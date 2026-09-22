import { extname, join, normalize, parse, sep } from "node:path";
import { request as httpsRequest } from "node:https";
import { existsSync } from "node:fs";
import { mkdir, readFile, open, writeFile } from "node:fs/promises";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const imageCacheDir = join(process.cwd(), "image-cache");
const downloadsInFlight = new Map<string, Promise<void>>();
const variantsInFlight = new Map<string, Promise<void>>();

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".jfif": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
};

// Immutable: upstream paths are content-hashed (<hash>/<file>), variants are
// derived from them, so responses never change for a given URL.
const CACHE_HEADERS = "public, max-age=31536000, immutable";

const TRANSFORM_FORMATS = new Set<TransformFormat>(["webp", "avif", "jpeg", "png"]);
const MAX_WIDTH = 1600;
const DEFAULT_QUALITY = 75;

type TransformFormat = "webp" | "avif" | "jpeg" | "png";
type Variant = { width: number; format: TransformFormat; quality: number };

function parseVariant(url: URL): Variant | null {
  const wRaw = url.searchParams.get("w");
  const fRaw = url.searchParams.get("f");
  const qRaw = url.searchParams.get("q");
  if (!wRaw && !fRaw) return null;

  const width = Math.min(MAX_WIDTH, Math.max(1, parseInt(wRaw ?? "", 10) || 0));
  if (!width) return null;

  const requested = (fRaw ?? "webp").toLowerCase() as TransformFormat;
  const format: TransformFormat = TRANSFORM_FORMATS.has(requested) ? requested : "webp";
  const quality = Math.min(100, Math.max(1, parseInt(qRaw ?? "", 10) || DEFAULT_QUALITY));

  return { width, format, quality };
}

function resolveImagePath(rest: string): string {
  const rel = normalize(decodeURIComponent(rest.split("?")[0])).replace(
    /^[\\/]+/,
    "",
  );
  if (!rel) throw new Error("Invalid image path");
  const filePath = join(imageCacheDir, rel);
  if (filePath !== imageCacheDir && !filePath.startsWith(imageCacheDir + sep)) {
    throw new Error("Invalid image path");
  }
  return filePath;
}

async function getContentType(filePath: string): Promise<string> {
  const byExt = MIME_BY_EXT[extname(filePath).toLowerCase()];
  if (byExt) return byExt;
  const handle = await open(filePath, "r");
  try {
    const buf = Buffer.alloc(16);
    await handle.read(buf, 0, 16, 0);
    if (
      buf
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    )
      return "image/png";
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
    if (
      buf.subarray(0, 6).toString() === "GIF87a" ||
      buf.subarray(0, 6).toString() === "GIF89a"
    )
      return "image/gif";
    if (
      buf.subarray(0, 4).toString() === "RIFF" &&
      buf.subarray(8, 12).toString() === "WEBP"
    )
      return "image/webp";
    if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00)
      return "image/x-icon";
    if (buf.subarray(0, 4).toString().toLowerCase() === "<svg")
      return "image/svg+xml";
    return "application/octet-stream";
  } finally {
    await handle.close();
  }
}

function downloadImage(remotePath: string, filePath: string): Promise<void> {
  return (async () => {
    await mkdir(/* turbopackIgnore: true */ parse(filePath).dir, { recursive: true });
    const data = await new Promise<Buffer>((resolve, reject) => {
      const req = httpsRequest(
        { host: "img.poki-cdn.com", path: remotePath, method: "GET" },
        (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            reject(new Error("upstream returned " + res.statusCode));
            return;
          }
          const chunks: Buffer[] = [];
          res.on("data", (c: Buffer) => chunks.push(c));
          res.on("end", () => resolve(Buffer.concat(chunks)));
        },
      );
      req.setTimeout(20000, () => req.destroy(new Error("timeout")));
      req.on("error", reject);
      req.end();
    });
    await writeFile(filePath, data);
    console.log("[image-cache] cached " + filePath);
  })();
}

/** Ensures the original upstream file exists on disk (single-flight per path). */
async function ensureOriginal(filePath: string, remotePath: string): Promise<void> {
  if (existsSync(/* turbopackIgnore: true */ filePath)) return;
  let pending = downloadsInFlight.get(filePath);
  if (!pending) {
    pending = downloadImage(remotePath, filePath).finally(() =>
      downloadsInFlight.delete(filePath),
    );
    downloadsInFlight.set(filePath, pending);
  }
  await pending;
}

/** Generates a resized/format-converted variant from the cached original. */
async function ensureVariant(
  originalPath: string,
  variantPath: string,
  variant: Variant,
): Promise<void> {
  if (existsSync(/* turbopackIgnore: true */ variantPath)) return;
  let pending = variantsInFlight.get(variantPath);
  if (!pending) {
    pending = (async () => {
      await mkdir(/* turbopackIgnore: true */ parse(variantPath).dir, { recursive: true });
      await sharp(/* turbopackIgnore: true */ originalPath)
        .rotate()
        .resize({ width: variant.width, withoutEnlargement: true })
        .toFormat(variant.format, { quality: variant.quality })
        .toFile(/* turbopackIgnore: true */ variantPath);
      console.log("[image-cache] variant " + variantPath);
    })().finally(() => variantsInFlight.delete(variantPath));
    variantsInFlight.set(variantPath, pending);
  }
  await pending;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/image\//, "");

  let filePath: string;
  try {
    filePath = resolveImagePath(rest);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Never forward our transform params upstream: the CDN 403s on unknown query.
  const upstreamQuery = new URLSearchParams(url.search);
  upstreamQuery.delete("w");
  upstreamQuery.delete("f");
  upstreamQuery.delete("q");
  const queryString = upstreamQuery.toString();
  const remotePath = "/" + rest + (queryString ? "?" + queryString : "");

  const variant = parseVariant(url);

  // Animated/vector sources must not be rasterized: always serve the original.
  const ext = extname(filePath).toLowerCase();
  const transformable = ext !== ".gif" && ext !== ".svg";

  try {
    if (variant && transformable) {
      const variantPath = `${filePath}.w${variant.width}.q${variant.quality}.${variant.format}`;
      if (!existsSync(/* turbopackIgnore: true */ variantPath)) {
        await ensureOriginal(filePath, remotePath);
        await ensureVariant(filePath, variantPath, variant);
      }
      return await serve(variantPath);
    }

    await ensureOriginal(filePath, remotePath);
    return await serve(filePath);
  } catch (err) {
    console.error(
      "[image-cache] failed to load " +
        filePath +
        ": " +
        (err as Error).message,
    );
    return new Response("Unable to load image", { status: 502 });
  }
}

async function serve(filePath: string): Promise<Response> {
  const data = await readFile(/* turbopackIgnore: true */ filePath);
  const type = await getContentType(filePath);
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": type, "Cache-Control": CACHE_HEADERS },
  });
}

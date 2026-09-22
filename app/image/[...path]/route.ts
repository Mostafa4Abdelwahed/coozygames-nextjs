import { extname, join, normalize, parse, sep } from "node:path";
import { request as httpsRequest } from "node:https";
import { existsSync } from "node:fs";
import { mkdir, readFile, open, writeFile } from "node:fs/promises";

export const dynamic = "force-dynamic";

const imageCacheDir = join(process.cwd(), "image-cache");
const downloadsInFlight = new Map<string, Promise<void>>();

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

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/image\//, "");

  let filePath: string;
  try {
    filePath = resolveImagePath(rest);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const remotePath = "/" + rest + url.search;

  try {
    if (!existsSync(/* turbopackIgnore: true */ filePath)) {
      let pending = downloadsInFlight.get(filePath);
      if (!pending) {
        pending = downloadImage(remotePath, filePath).finally(() =>
          downloadsInFlight.delete(filePath),
        );
        downloadsInFlight.set(filePath, pending);
      }
      await pending;
    }
    const data = await readFile(/* turbopackIgnore: true */ filePath);
    const type = await getContentType(filePath);
    return new Response(data, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" },
    });
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
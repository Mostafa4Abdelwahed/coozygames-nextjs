"""Scrape Poki catalog WITH real per-game categories.

Source: https://poki.com/en/sitemaps/games.xml -> /en/g/<slug> pages.
Each game page JSON-LD gives:
  - breadcrumb level 2  -> primary category  (url slug + "<Name> Games")
  - applicationSubCategory -> secondary signal ("<Name> Games", slug derived)

Output: data/games.json entries:
  {name, image, url, categories: [{slug, label}, ...]}

Usage: python scripts/scrape-poki-catalog.py [limit] [output]
Long run (~15-25 min for all). Safe to re-run; writes only on success.
"""
import concurrent.futures
import json
import os
import re
import sys
import urllib.request

BASE_URL = "https://poki.com"
SITEMAP_URL = "https://poki.com/en/sitemaps/games.xml"
IMAGE_HOST = "https://img.poki-cdn.com/"
OUTPUT_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "data",
    "games.json",
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

JSONLD_RE = re.compile(
    r'<script type="application/ld\+json" id="game-json-ld">(.*?)</script>', re.S
)
CONTENT_RE = re.compile(r'\\"content\\":\\"([^"]*)\\"')
GAMEURI_RE = re.compile(r'"gameUri":"([^"]+)"')

MAX_WORKERS = 24
RETRIES = 3


def fetch(url, referer=None):
    last_error = None
    headers = dict(HEADERS)
    if referer:
        headers["Referer"] = referer
    for _ in range(RETRIES):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as res:
                return res.read().decode("utf-8", "replace")
        except Exception as err:  # noqa: BLE001
            last_error = err
    raise last_error


def find_game_node(node):
    if isinstance(node, dict):
        if "url" in node and "image" in node and "name" in node:
            return node
        for value in node.values():
            found = find_game_node(value)
            if found:
                return found
    elif isinstance(node, list):
        for value in node:
            found = find_game_node(value)
            if found:
                return found
    return None


def clean_label(name):
    if not name:
        return None
    label = name[:-len(" Games")] if name.endswith(" Games") else name
    return label.strip() or None


def slug_from_label(label):
    return re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")


def extract_categories(page_node, main_entity):
    cats = []

    def push(url, name):
        if not url or not name:
            return
        slug = url.rstrip("/").split("/")[-1]
        label = clean_label(name)
        if slug and label and not any(c["slug"] == slug for c in cats):
            cats.append({"slug": slug, "label": label})

    crumbs = (page_node.get("breadcrumb", {}) or {}).get("itemListElement", []) or []
    if len(crumbs) >= 2:
        item = crumbs[1].get("item", {}) or {}
        push(item.get("@id", ""), item.get("name", ""))

    sub = (main_entity or {}).get("applicationSubCategory", "")
    if sub:
        label = clean_label(sub)
        if label:
            slug = slug_from_label(label)
            if slug and not any(c["slug"] == slug for c in cats):
                cats.append({"slug": slug, "label": label})

    return cats


def parse_game_page(html):
    match = JSONLD_RE.search(html)
    if not match:
        return None
    data = json.loads(match.group(1))
    graph = data.get("@graph", [data]) if isinstance(data, dict) else [data]
    page_node = next(
        (n for n in graph if isinstance(n, dict) and n.get("@type") == "ItemPage"),
        graph[0] if graph else {},
    )
    node = find_game_node(data)
    if not node:
        return None

    image = node["image"]
    if isinstance(image, dict):
        image = image.get("@id")
    if not image or not image.startswith(IMAGE_HOST):
        return None

    main_entity = page_node.get("mainEntity", {}) or {}
    categories = extract_categories(page_node, main_entity)

    content_match = CONTENT_RE.search(html)
    content_url = None
    if content_match:
        content_url = content_match.group(1).replace("\\u002F", "/")
        if content_url.startswith("//"):
            content_url = "https:" + content_url

    return {
        "name": node["name"],
        "portal": node["url"],
        "image": image[len(IMAGE_HOST):],
        "content": content_url,
        "categories": categories,
    }


def resolve_game_url(game):
    content = game["content"]
    if not content:
        return game["portal"]
    if "gdn.poki.com" in content:
        return content
    try:
        wrapper = fetch(content, referer="https://poki.com/")
    except Exception:  # noqa: BLE001
        return game["portal"]
    match = GAMEURI_RE.search(wrapper)
    if match:
        return match.group(1)
    return game["portal"]


def scrape(url):
    try:
        game = parse_game_page(fetch(url))
        if not game:
            print("SKIP " + url + " (no game data)", flush=True)
            return None
        game["url"] = resolve_game_url(game)
        game.pop("content", None)
        game.pop("portal", None)
        print("OK   " + game["name"] + " [" + ",".join(c["slug"] for c in game["categories"]) + "]", flush=True)
        return game
    except Exception as err:  # noqa: BLE001
        print("FAIL " + url + " (" + str(err) + ")", flush=True)
        return None


def get_game_urls():
    xml = fetch(SITEMAP_URL)
    urls = re.findall(r"<loc>(.*?)</loc>", xml)
    return [u for u in urls if "/en/g/" in u]


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    output = sys.argv[2] if len(sys.argv) > 2 else OUTPUT_FILE
    offset = int(os.environ.get("SCRAPE_OFFSET", "0"))

    urls = get_game_urls()
    urls = urls[offset:]
    if limit:
        urls = urls[:limit]
    print("Scraping " + str(len(urls)) + " games from Poki...")

    games = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        for game in pool.map(scrape, urls):
            if game:
                games.append(game)

    games.sort(key=lambda g: g["name"].lower())

    out_path = os.path.abspath(output)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(games, f)

    print("Wrote " + str(len(games)) + " games to " + out_path)


if __name__ == "__main__":
    main()

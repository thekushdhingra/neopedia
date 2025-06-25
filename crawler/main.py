import httpx
from bs4 import BeautifulSoup, Tag
from urllib.parse import unquote
from supabase import create_client, Client
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from rich.console import Console
from dotenv import load_dotenv
import os

console = Console()
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if SUPABASE_KEY is None or SUPABASE_URL is None:
    console.print("[red]Supabase URL or Key not set in environment variables![/red]")
    exit(1)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

visited = set()
visited_lock = Lock()

def slugify(title: str) -> str:
    return title.strip().replace(" ", "_").replace("/", "_").lower()

def get_article_html(title: str) -> str | None:
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "parse",
        "format": "json",
        "page": title,
        "prop": "text",
        "formatversion": 2,
        "origin": "*"
    }
    try:
        client = httpx.Client(timeout=10)
        r = client.get(url, params=params)
        if r.status_code == 200:
            data = r.json()
            return data["parse"]["text"] if "parse" in data else None
    except Exception as e:
        console.print(f"[red]Error fetching {title}:[/red] {e}")
    return None

def extract_and_rewrite_links(html: str) -> tuple[str, list[str]]:
    soup = BeautifulSoup(html, "html.parser")
    new_links = []

    for edit in soup.select(".mw-editsection"):
        edit.decompose()

    
    for ref in soup.select("sup.reference"):
        ref.decompose()

    
    for hatnote in soup.select(".hatnote"):
        hatnote.decompose()

    
    for div in soup.select(".metadata, .ambox, .navbox, .vertical-navbox, .plainlinks"):
        div.decompose()

    
    for tag in soup.find_all(["link", "style", "script"]):
        tag.decompose()

    
    for a in soup.find_all("a", href=True):
        if not isinstance(a, Tag):
            continue
        href = str(a["href"])
        if a.find("img"):
            a.unwrap()
            continue
        if href.startswith("/wiki/") and not any(x in href for x in [":", "#", "//"]):
            article_name = unquote(href.replace("/wiki/", ""))
            slug = slugify(article_name)
            new_links.append(article_name)
            a["href"] = f"/article/{slug}"
        else:
            a["target"] = "_blank"  

    return str(soup), new_links


def save_article(title: str, slug: str, html: str):
    console.print(f"[green]Saving:[/green] {title}")
    supabase.table("articles").upsert({
        "slug": slug,
        "title": title,
        "html": html,
        "visited": True
    }).execute()

def crawl(title: str, depth: int = 0, max_depth: int = 2) -> list[str]:
    slug = slugify(title)
    with visited_lock:
        if slug in visited:
            return []
        visited.add(slug)

    html = get_article_html(title)
    if not html:
        return []

    modified_html, links = extract_and_rewrite_links(html)
    save_article(title, slug, modified_html)

    return links[:15] if depth < max_depth else []

def threaded_crawler(seed_articles: list[str], max_depth: int = 2, max_workers: int = 10):
    queue = [(title, 0) for title in seed_articles]

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        while queue:
            futures = {
                executor.submit(crawl, title, depth, max_depth): (title, depth)
                for (title, depth) in queue
            }
            queue = []

            for future in as_completed(futures):
                title, depth = futures[future]
                try:
                    new_links = future.result()
                    for link in new_links:
                        queue.append((link, depth + 1))
                except Exception as e:
                    console.print(f"[red]Thread failed for {title}:[/red] {e}")

if __name__ == "__main__":
    threaded_crawler([
        "Linux",
        "Python_(programming_language)",
        "Artificial_intelligence"
    ], max_depth=2, max_workers=5)

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.toLowerCase();

  if (!query) {
    console.warn("⚠️ No query param provided");
    return new Response(JSON.stringify({ error: "Missing query param" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase
    .from("articles")
    .select("html, slug")
    .filter("search_vector", "fts", query)
    .limit(10);

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return new Response(JSON.stringify({ error: "Supabase query failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!data || data.length === 0) {
    console.warn("⚠️ No matching articles found");
    return new Response(
      JSON.stringify({ error: "No matching articles found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  data.forEach((obj) => {
    console.log(obj.slug);
  });

  const bestMatch =
    data.find((item) => item.slug === query) ||
    data.find((item) => item.slug.includes(query)) ||
    data.find((item) => query.includes(item.slug)) ||
    data[0];

  const rawHTML = bestMatch.html;

  if (!rawHTML) {
    console.warn("⚠️ First article has no HTML field");
    return new Response(
      JSON.stringify({ error: "Article does not contain HTML content" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const $ = cheerio.load(rawHTML);
  const infobox = $(".infobox").first();

  if (!infobox.length) {
    console.warn("🚫 No .infobox found in the HTML content");
    return new Response(
      JSON.stringify({ error: "No .infobox found in article" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(infobox.html(), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

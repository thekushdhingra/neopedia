import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.toLowerCase();

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query param" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data, error } = await supabase
    .from("articles")
    .select("html, slug")
    .filter("search_vector", "fts", query)
    .limit(10);

  if (error) {
    return new Response(JSON.stringify({ error: "Supabase query failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({ error: "No matching articles found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const bestMatch =
    data.find((item) => item.slug === query) ||
    data.find((item) => item.slug.includes(query)) ||
    data.find((item) => query.includes(item.slug)) ||
    data[0];

  const rawHTML = bestMatch.html;

  if (!rawHTML) {
    return new Response(
      JSON.stringify({ error: "Article does not contain HTML content" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const $ = cheerio.load(rawHTML);
  const infobox = $(".infobox").first();

  if (!infobox.length) {
    return new Response(
      JSON.stringify({ error: "No .infobox found in article" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const infoboxJSON: Record<string, any> = {};
  const rows = infobox.find("tr");

  rows.each((_, el) => {
    const $row = $(el);
    const th = $row.find("th").first().text().trim();
    const td = $row.find("td").first();

    if (!th || !td.length) return;

    let value: string | string[];
    const listItems = td.find("li");

    if (listItems.length) {
      value = listItems.map((_, li) => $(li).text().trim()).get();
    } else {
      value = td.text().trim();
    }

    infoboxJSON[th] = value;
  });

  const title = infobox.find(".infobox-above").first().text().trim();
  if (title) infoboxJSON["Title"] = title;

  const image = infobox.find("img").first().attr("src");
  if (image) {
    infoboxJSON["Image"] = image.startsWith("http") ? image : `https:${image}`;
  }

  return new Response(JSON.stringify(infoboxJSON, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

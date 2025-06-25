"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ title: string; slug: string }[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      const { data, error } = await supabase
        .from("articles")
        .select("title, slug")
        .filter("search_vector", "fts", query)
        .limit(10);

      if (!error) {
        setResults(data);
      }
    };

    const timeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <main className="landing">
      <h1>Neopedia</h1>
      <em style={{ marginBottom: "2rem", fontSize: "1.5rem" }}>
        A Modern Encylopedia
      </em>
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <ul className="search-results">
            {results.map((r) => (
              <li
                key={r.slug}
                onClick={() => {
                  window.location.href = "/article/" + r.slug;
                }}
              >
                {r.title.replaceAll("_", " ")}
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer
        style={{
          marginTop: "3rem",
          padding: "2rem 0 1rem 0",
          textAlign: "center",
          fontSize: "1rem",
        }}
      >
        <div style={{ marginBottom: "0.5rem" }}>
          <strong>Neopedia</strong> &mdash; Made by Kush Dhingra
        </div>
        <div className="socials" style={{ marginBottom: "0.5rem" }}>
          <Link
            href="https://github.com/thekushdhingra"
            target="_blank"
            rel="noopener noreferrer"
            style={{ margin: "0 0.5rem" }}
            aria-label="GitHub"
          >
            <Github />
          </Link>
          <Link
            href="https://x.com/thekushdhingra"
            target="_blank"
            rel="noopener noreferrer"
            style={{ margin: "0 0.5rem" }}
            aria-label="X"
          >
            <Twitter />
          </Link>
          <Link
            href="https://linkedin.com/in/thekushdhingra"
            target="_blank"
            rel="noopener noreferrer"
            style={{ margin: "0 0.5rem" }}
            aria-label="LinkedIn"
          >
            <Linkedin />
          </Link>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          Data sourced from{" "}
          <Link
            href="https://wikipedia.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia
          </Link>
          . Not affiliated with Wikipedia.
        </div>
      </footer>
    </main>
  );
}

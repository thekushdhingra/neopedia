"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Github, Linkedin, Search, Twitter } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ title: string; slug: string }[]>([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("title, slug")
        .filter("search_vector", "fts", query)
        .limit(10);

      if (!error) {
        setResults(data);
      }
      setLoading(false);
    };

    const timeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".search-results")
      ) {
        setFocused(false);
      }
    };
    if (focused) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [focused]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("title, slug")
      .filter("search_vector", "fts", query)
      .limit(10);
    if (!error) {
      setResults(data);
    }
    setLoading(false);
    setFocused(false);
    if (data && data.length > 0) {
      window.location.href = "/article/" + data[0].slug;
    }
  };

  // Handle autocomplete click
  const handleAutocompleteClick = (r: { title: string; slug: string }) => {
    setQuery(r.title.replaceAll("_", " "));
    setFocused(false);
    inputRef.current?.focus();
  };

  return (
    <main className="landing">
      <h1>Neopedia</h1>
      <em style={{ marginBottom: "2rem", fontSize: "1.5rem" }}>
        A Modern Encylopedia
      </em>
      <div className="search-bar">
        <form onSubmit={handleSearch} style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            autoComplete="off"
          />
          <button
            type="submit"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              cursor: "pointer",
              padding: "0 1rem",
              fontWeight: "bold",
            }}
            aria-label="Search"
          >
            <Search />
          </button>
        </form>
        {focused && results.length > 0 && (
          <ul className="search-results">
            {results.map((r) => (
              <li
                key={r.slug}
                onClick={() => handleAutocompleteClick(r)}
                tabIndex={0}
                style={{ cursor: "pointer" }}
              >
                {r.title.replaceAll("_", " ")}
              </li>
            ))}
          </ul>
        )}
        {focused && loading && (
          <div className="search-results" style={{ padding: "0.5rem" }}>
            Searching...
          </div>
        )}
      </div>
      {/* Search cards below the search bar */}
      <div
        className="search-cards"
        style={{
          marginTop: "2rem",
          display: "flex",
          width: "50%",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {results.length > 0 && (
          <>
            <h3
              style={{ width: "100%", textAlign: "center", fontSize: "2rem" }}
            >
              Search Results:{" "}
            </h3>
          </>
        )}
        {results.map((r) => (
          <button
            key={r.slug}
            className="search-card"
            onClick={() => {
              window.location.href = "/article/" + encodeURIComponent(r.slug);
            }}
            style={{
              borderRadius: "8px",
              cursor: "pointer",
              padding: "1rem",
              minWidth: "180px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
            }}
          >
            {r.title.replaceAll("_", " ")}
          </button>
        ))}
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

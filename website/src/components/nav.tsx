"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ title: string; slug: string }[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();

  // Dark mode effect
  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (stored === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else if (stored === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        setDarkMode(false);
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

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

      if (!error && data) {
        setResults(data);
      }
    };

    const timeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <nav className={`navbar${darkMode ? " dark" : ""}`}>
      {pathname !== "/" && (
        <>
          <Link href="/" className="navbar-brand">
            Neopedia
          </Link>
          <div className="navbar-search">
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
        </>
      )}
      <button
        className="dark-mode-toggle"
        aria-label="Toggle dark mode"
        onClick={() => setDarkMode((d) => !d)}
        style={{ marginLeft: 16 }}
      >
        {darkMode ? <Moon /> : <Sun />}
      </button>
    </nav>
  );
}

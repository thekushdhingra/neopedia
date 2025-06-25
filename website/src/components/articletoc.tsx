"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

type Heading = { id: string; text: string; level: number };

export default function ArticleTOC() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [open, setOpen] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    const result: Heading[] = [];
    document.querySelectorAll("h2, h3").forEach((el) => {
      const id =
        el.id ||
        el.textContent
          ?.toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w\-]/g, "");
      if (id) el.id = id;
      result.push({
        id: id ?? "",
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : 3,
      });
    });
    setHeadings(result);
    window.scrollTo(0, 0);
  }, []);

  // Group h3s under their parent h2
  const grouped: (Heading & { children: Heading[] })[] = [];
  let currentH2: (Heading & { children: Heading[] }) | null = null;

  for (const h of headings) {
    if (h.level === 2) {
      if (currentH2) grouped.push(currentH2);
      currentH2 = { ...h, children: [] };
    } else if (h.level === 3 && currentH2) {
      currentH2.children.push(h);
    }
  }
  if (currentH2) grouped.push(currentH2);

  return (
    <div className="toc">
      <div style={{ fontWeight: "600", fontSize: "1.7rem" }}>Contents</div>
      <div>
        {grouped.map((h2) => {
          const isOpen = open[h2.id] ?? true;

          return (
            <div key={h2.id} className="toc-item">
              <div
                onClick={() =>
                  h2.children.length &&
                  setOpen((prev) => ({ ...prev, [h2.id]: !prev[h2.id] }))
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: h2.children.length ? "pointer" : "default",
                }}
              >
                <Link href={`#${h2.id}`}>{h2.text}</Link>
                {h2.children.length > 0 && (
                  <span>
                    {isOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </span>
                )}
              </div>

              {/* ✅ Smooth collapse */}
              <div
                style={{
                  marginLeft: "1rem",
                  maxHeight: isOpen ? "500px" : "0px",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease-in-out",
                }}
              >
                {h2.children.map((h3) => (
                  <div key={h3.id} style={{ marginBottom: "0.25rem" }}>
                    <Link href={`#${h3.id}`}>{h3.text}</Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

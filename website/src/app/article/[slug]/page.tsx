import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ArticleTOC from "@/components/articletoc";
import ClientOnly from "@/components/clientonly";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function ArticlePage({ params }: any) {
  const slug = decodeURIComponent(params.slug);

  const { data, error } = await supabase
    .from("articles")
    .select("title, html")
    .eq("slug", slug)
    .single();

  if (!data || error) return notFound();

  return (
    <main>
      <ClientOnly>
        <ArticleTOC />
      </ClientOnly>

      <div>
        <h1>{data.title.replaceAll("_", " ")}</h1>
        <div dangerouslySetInnerHTML={{ __html: data.html }} />
      </div>
    </main>
  );
}

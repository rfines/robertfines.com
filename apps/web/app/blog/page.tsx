import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";

type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
};

function getPosts(): PostMeta[] {
  const postsDir = path.join(process.cwd(), "content/posts");
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
      const { data } = matter(raw);
      return {
        slug: file.replace(/\.mdx$/, ""),
        title: data.title ?? "Untitled",
        date: data.date ?? "",
        description: data.description ?? "",
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default function BlogPage() {
  const posts = getPosts();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
      <div>
        <p className="text-[var(--muted)] text-sm mb-2">$ ls ./blog</p>
        <h1 className="text-2xl font-bold text-[var(--accent)]">## blog</h1>
      </div>

      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-1"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">&gt;</span>
                <span className="text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors font-medium">
                  {post.title}
                </span>
              </div>
              <div className="pl-5 space-y-0.5">
                <p className="text-[var(--accent)] text-xs">{post.date}</p>
                <p className="text-[var(--muted)] text-sm">{post.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

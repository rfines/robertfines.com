import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

function getPost(slug: string) {
  const filePath = path.join(process.cwd(), "content/posts", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { meta: data, content };
}

export async function generateStaticParams() {
  const postsDir = path.join(process.cwd(), "content/posts");
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => ({ slug: file.replace(/\.mdx$/, "") }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) notFound();

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 space-y-8">
      <div className="space-y-2">
        <p className="text-[var(--muted)] text-sm">$ cat ./blog/{slug}.mdx</p>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {post.meta.title}
        </h1>
        <p className="text-[var(--accent)] text-sm">{post.meta.date}</p>
      </div>

      <article className="prose prose-invert prose-amber max-w-none text-sm leading-relaxed text-[var(--foreground)] space-y-4 [&_h2]:text-[var(--accent)] [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:text-[var(--foreground)] [&_p]:leading-7 [&_a]:text-[var(--accent)] [&_a]:underline [&_code]:bg-[var(--border)] [&_code]:px-1 [&_code]:rounded [&_pre]:bg-[var(--border)] [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto">
        <MDXRemote source={post.content} />
      </article>
    </div>
  );
}

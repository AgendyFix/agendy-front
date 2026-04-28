import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  lastModified?: string;
  keywords: string[];
  readingTime: string;
  coverImage?: string;
  coverImageAlt?: string;
  content: string;
  faqs: FAQItem[];
}

function extractFAQs(content: string): FAQItem[] {
  const faqSection = content.split(/^## Preguntas frecuentes/m)[1];
  if (!faqSection) return [];

  const faqs: FAQItem[] = [];
  const blocks = faqSection.split(/^### /m).slice(1);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const question = lines[0]?.trim();
    const answer = lines
      .slice(1)
      .join("\n")
      .trim()
      .replace(/\n{2,}/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1");
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }

  return faqs;
}

function estimateReadingTime(text: string): string {
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

function validateFrontmatter(
  data: Record<string, unknown>,
  file: string
): void {
  const required = ["title", "description", "date"] as const;
  for (const field of required) {
    if (!data[field]) {
      console.warn(`[blog] Missing required field "${field}" in ${file}`);
    }
  }
  if (data.date && isNaN(Date.parse(data.date as string))) {
    console.warn(`[blog] Invalid date "${data.date}" in ${file}`);
  }
}

function parsePost(slug: string, raw: string, file?: string): BlogPost {
  const { data, content } = matter(raw);
  validateFrontmatter(data, file || `${slug}.md`);

  return {
    slug,
    title: data.title || "Sin título",
    description: data.description || "",
    date: data.date || new Date().toISOString().split("T")[0],
    lastModified: data.lastModified,
    keywords: data.keywords || [],
    readingTime: data.readingTime || estimateReadingTime(content),
    coverImage: data.coverImage,
    coverImageAlt: data.coverImageAlt,
    content,
    faqs: extractFAQs(content),
  };
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    return parsePost(file.replace(/\.md$/, ""), raw, file);
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return undefined;
  return parsePost(slug, fs.readFileSync(filePath, "utf-8"));
}

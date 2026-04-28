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

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug: file.replace(/\.md$/, ""),
      title: data.title,
      description: data.description,
      date: data.date,
      lastModified: data.lastModified,
      keywords: data.keywords || [],
      readingTime: data.readingTime || estimateReadingTime(content),
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      content,
      faqs: extractFAQs(content),
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return undefined;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    lastModified: data.lastModified,
    keywords: data.keywords || [],
    readingTime: data.readingTime || estimateReadingTime(content),
    coverImage: data.coverImage,
    coverImageAlt: data.coverImageAlt,
    content,
    faqs: extractFAQs(content),
  };
}

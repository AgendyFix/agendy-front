"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-10 mb-4 text-2xl md:text-3xl font-bold text-foreground break-words">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-4 text-xl md:text-2xl font-bold text-foreground break-words">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-3 text-lg md:text-xl font-bold text-foreground break-words">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-5 leading-relaxed text-muted-foreground text-base md:text-lg">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="text-primary font-semibold hover:underline break-words"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mb-5 pl-5 md:pl-6 list-disc space-y-2 text-muted-foreground text-base md:text-lg leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-5 pl-5 md:pl-6 list-decimal space-y-2 text-muted-foreground text-base md:text-lg leading-relaxed">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-4 md:pl-6 py-2 my-6 bg-primary/5 rounded-r-xl [&>p]:mb-0 [&>p]:italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="bg-muted p-4 md:p-6 rounded-xl overflow-x-auto mb-5 text-sm md:text-base leading-relaxed">
          <code>{children}</code>
        </pre>
      );
    }
    return (
      <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[0.85em] font-mono break-words">
        {children}
      </code>
    );
  },
  strong: ({ children }) => (
    <strong className="font-bold text-foreground">{children}</strong>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-5">
      <table className="w-full border-collapse min-w-[400px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left p-2 md:p-3 border-b-2 border-primary font-bold text-foreground text-sm md:text-base whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="p-2 md:p-3 border-b border-border text-muted-foreground text-sm md:text-base">
      {children}
    </td>
  ),
  hr: () => <hr className="border-none border-t border-border my-8" />,
};

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </Markdown>
  );
}

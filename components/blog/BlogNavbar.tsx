"use client";

import Link from "next/link";
import Image from "next/image";

export default function BlogNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-4xl flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/blog" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="AgendyFix Logo"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            unoptimized
          />
          <span className="text-lg font-bold text-foreground">AgendyFix</span>
          <span className="text-sm text-muted-foreground font-medium">Blog</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    </nav>
  );
}

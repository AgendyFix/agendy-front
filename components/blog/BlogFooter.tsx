import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.agendyfix.com";

export default function BlogFooter() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="font-bold text-foreground">AgendyFix</p>
            <p className="text-sm text-muted-foreground mt-1">
              La plataforma para empresas de servicios en Latinoamérica
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Acceder
            </Link>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Sitio web
            </a>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} AgendyFix. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}

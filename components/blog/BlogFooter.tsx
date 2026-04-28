import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { buildWaUrl } from "@/lib/tracking";

const WA_MSG = "Hola, quiero saber mas sobre AgendyFix.";

export default function BlogFooter() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="font-bold text-foreground">AgendyFix</p>
            <p className="text-sm text-muted-foreground mt-1">
              La plataforma para academias y escuelas en Latinoamerica
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Inicio
            </Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Acceder
            </Link>
            <a
              href={buildWaUrl(WA_MSG)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Contactar
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

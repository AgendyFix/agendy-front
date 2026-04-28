import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { buildWaUrl } from "@/lib/tracking";

const WA_MSG = "Hola, quiero saber mas sobre AgendyFix.";

const LINKS = {
  producto: [
    { label: "Funcionalidades", href: "#features" },
    { label: "Como funciona", href: "#how-it-works" },
  ],
  recursos: [
    { label: "Blog", href: "/blog" },
    { label: "Iniciar sesion", href: "/login" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.png"
                alt="AgendyFix"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                unoptimized
              />
              <span className="text-lg font-bold text-foreground">AgendyFix</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-4">
              El software de gestion para academias y escuelas en Latinoamerica.
              Centraliza alumnos, pagos, clases y comunicacion en un solo lugar.
            </p>
            <a
              href={buildWaUrl(WA_MSG)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              +52 56 6771 4084
            </a>
          </div>

          {/* Producto */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Producto</h4>
            <ul className="space-y-2">
              {LINKS.producto.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Recursos</h4>
            <ul className="space-y-2">
              {LINKS.recursos.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} AgendyFix. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}

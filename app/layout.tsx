import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BrowserWarning } from "@/components/ui/BrowserWarning";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgendyFix - Panel Administrativo",
  description: "Sistema de gestión de citas y servicios",
};

// Polyfills inline para Safari/iOS 15 y browsers sin soporte completo de ES2022+
// Se ejecutan sincrónicamente antes del bundle principal, sin afectar browsers modernos.
const POLYFILLS = `
(function() {
  // structuredClone — no existe en iOS/Safari 15
  if (typeof structuredClone === 'undefined') {
    window.structuredClone = function(obj) {
      return JSON.parse(JSON.stringify(obj));
    };
  }
  // Object.hasOwn — no existe en Safari < 15.4
  if (!Object.hasOwn) {
    Object.hasOwn = function(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };
  }
  // Array.prototype.at — no existe en Safari < 15.4
  if (!Array.prototype.at) {
    Array.prototype.at = function(index) {
      var n = Math.trunc(index) || 0;
      if (n < 0) n += this.length;
      if (n < 0 || n >= this.length) return undefined;
      return this[n];
    };
  }
  // String.prototype.at
  if (!String.prototype.at) {
    String.prototype.at = function(index) {
      var n = Math.trunc(index) || 0;
      if (n < 0) n += this.length;
      if (n < 0 || n >= this.length) return undefined;
      return this[n];
    };
  }
  // Promise.withResolvers — no existe en Safari < 17
  if (!Promise.withResolvers) {
    Promise.withResolvers = function() {
      var resolve, reject;
      var promise = new Promise(function(res, rej) {
        resolve = res;
        reject = rej;
      });
      return { promise: promise, resolve: resolve, reject: reject };
    };
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Polyfills para compatibilidad con Safari/iOS 15 — se ejecutan antes del bundle */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: POLYFILLS }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <BrowserWarning />
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: 'text-white',
              title: 'text-white font-medium',
              description: 'text-white/90',
            },
            actionButtonStyle: {
              backgroundColor: '#FF8A00',
              color: '#FFFFFF',
              fontWeight: '600',
            },
          }}
        />
      </body>
    </html>
  );
}

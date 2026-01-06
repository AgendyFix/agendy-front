import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
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

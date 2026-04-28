import BlogNavbar from "@/components/blog/BlogNavbar";
import BlogFooter from "@/components/blog/BlogFooter";
import { WhatsAppFab } from "@/components/landing/WhatsAppFab";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BlogNavbar />
      <main className="flex-1">{children}</main>
      <BlogFooter />
      <WhatsAppFab />
    </div>
  );
}

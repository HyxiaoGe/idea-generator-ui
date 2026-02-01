import type { Metadata } from "next";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Navigation } from "@/components/navigation";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 创作工坊",
  description: "AI Image and Video Generator",
};

function NavigationFallback() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="h-8 w-32 animate-pulse rounded bg-surface-secondary" />
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Suspense fallback={<NavigationFallback />}>
              <Navigation />
            </Suspense>
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

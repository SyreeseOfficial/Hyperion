import type { Metadata } from "next";
import { Cinzel, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/Sidebar";
import CommandPalette from "@/components/CommandPalette";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hyperion",
  description: "AI Mission Control & Personal Operations Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-gold="subtle"
      className={`${cinzel.variable} ${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full flex bg-obsidian text-ivory">
        <TooltipProvider delay={300}>
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
          <CommandPalette />
        </TooltipProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { CommandPalette } from "@/components/shared/command-palette";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Event Console",
  description: "Multi-event operations console for private dinners and receptions.",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper font-sans text-ink">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
          </div>
        </div>
        <CommandPalette />
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reddit Copilot",
  description: "AI-powered assistant for Reddit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0e1113] text-[#f2f4f5] min-h-screen">
        {children}
      </body>
    </html>
  );
}

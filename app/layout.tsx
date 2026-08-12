import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golden Dawn eFC",
  description: "Official club hub for Golden Dawn eFootball Club",
  manifest: "/manifest.webmanifest",
  themeColor: "#05070d"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

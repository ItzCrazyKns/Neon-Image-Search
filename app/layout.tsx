import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Search Engine",
  description: "Search for similar images using Neon DB and Vertex AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

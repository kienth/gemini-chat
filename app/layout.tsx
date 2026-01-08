import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kentoy Chat",
  description: "A chat application powered by Google Gemini AI",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

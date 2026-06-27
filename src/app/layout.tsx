import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trip Engineer",
  description: "AI-powered travel itineraries",
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

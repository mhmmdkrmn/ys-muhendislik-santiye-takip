import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YS Muhendislik Santiye Takip",
  description: "YS Muhendislik icin santiye, metraj ve is takip sistemi."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

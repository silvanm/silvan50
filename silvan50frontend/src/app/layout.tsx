import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silvan's Birthday",
  description: "Silvan's 50th Birthday Celebration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

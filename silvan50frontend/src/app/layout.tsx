import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silvan's Birthday",
  description: "Silvan's 50th Birthday Celebration",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow, nosnippet, noarchive, noimageindex, nocache" />
        <meta name="googlebot" content="noindex, nofollow, noimageindex, nosnippet, noarchive, nocache" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

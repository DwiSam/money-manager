import type { Metadata, Viewport } from "next";
import { Geist, Roboto_Mono } from "next/font/google"; // Changed Geist_Mono to Roboto_Mono
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono", // Standardize variable name to font-mono
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export const metadata: Metadata = {
  title: "Money Tracker",
  description: "Kelola keuanganmu dengan mudah",
  robots: {
    index: false,
    follow: false,
  },
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${robotoMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

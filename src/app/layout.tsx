import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import CartSidebar from "@/components/cart/CartSidebar";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Artiziva Homes — Bespoke Epoxy & Resin Furniture",
    template: "%s | Artiziva Homes",
  },
  description:
    "Handcrafted bespoke epoxy & resin furniture and artworks by Artiziva Homes. Every piece is one-of-one, combining raw timber with flowing resin. Founded in Siliguri, India.",
  keywords: [
    "epoxy furniture",
    "resin tables",
    "bespoke furniture",
    "luxury furniture India",
    "handcrafted tables",
    "resin art",
    "Artiziva Homes",
    "epoxy dining table",
    "custom furniture",
  ],
  authors: [{ name: "Artiziva Homes" }],
  creator: "Artiziva Homes",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Artiziva Homes",
    title: "Artiziva Homes — Bespoke Epoxy & Resin Masterpieces",
    description:
      "Handcrafted bespoke epoxy & resin furniture. Every piece is one-of-one. 400+ masterpieces delivered.",
    images: [{ url: "/images/products/emerald-dining-table.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Artiziva Homes — Bespoke Epoxy & Resin Furniture",
    description:
      "Handcrafted bespoke epoxy & resin furniture. Every piece is one-of-one.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${playfair.variable} ${inter.variable} font-sans antialiased bg-bg-primary text-text-primary`}
      >
        <CartProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <CartSidebar />
        </CartProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}


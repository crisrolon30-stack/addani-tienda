import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Cormorant_Garamond } from 'next/font/google';
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  themeColor: '#9f1239',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://addani-tienda.vercel.app'),
  title: {
    default: "ADDANI — Tu polirrubro de confianza | Resistencia, Chaco",
    template: "%s · ADDANI"
  },
  description: "Maquillaje, bijouterie, ropa interior, accesorios y servicio técnico de celulares. Comprá online y retirá en local. Resistencia, Chaco.",
  keywords: [
    'polirrubro resistencia',
    'maquillaje resistencia chaco',
    'bijouterie chaco',
    'ropa interior resistencia',
    'tienda online chaco',
    'servicio tecnico celulares resistencia',
    'reparacion celulares chaco',
    'addani',
  ],
  authors: [{ name: 'ADDANI' }],
  creator: 'ADDANI',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://addani-tienda.vercel.app',
    title: 'ADDANI — Tu polirrubro de confianza',
    description: 'Maquillaje, bijouterie, ropa interior y servicio técnico. Resistencia, Chaco.',
    siteName: 'ADDANI',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'ADDANI — Polirrubro de confianza',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ADDANI — Tu polirrubro de confianza',
    description: 'Maquillaje, bijouterie y mucho más en Resistencia, Chaco',
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${playfair.variable} ${cormorant.variable} ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

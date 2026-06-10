import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: '#be123c',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://addani-tienda.vercel.app'),
  title: {
    default: "ADDANI - Maquillaje, Bijou y Ropa Interior | Resistencia, Chaco",
    template: "%s | ADDANI"
  },
  description: "Compra online maquillaje, bijouterie, ropa interior y más en ADDANI. Retiro en local en Resistencia, Chaco. Pago por transferencia o efectivo.",
  keywords: [
    'maquillaje resistencia',
    'bijouterie chaco',
    'ropa interior resistencia',
    'tienda online chaco',
    'cosmeticos resistencia',
    'libreria chaco',
    'addani polirrubro',
  ],
  authors: [{ name: 'ADDANI' }],
  creator: 'ADDANI',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://addani-tienda.vercel.app',
    title: 'ADDANI - Tu boutique de confianza',
    description: 'Maquillaje, bijouterie, ropa interior y más. Comprá online y retirá en local en Resistencia, Chaco.',
    siteName: 'ADDANI',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'ADDANI - Polirrubro',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ADDANI - Tu boutique de confianza',
    description: 'Maquillaje, bijouterie y más en Resistencia, Chaco',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
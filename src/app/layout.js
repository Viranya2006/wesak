import { Inter, Cinzel, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Ceylon X — High-Fidelity 3D Vesak Kalapaya Engine",
  description: "Experience the traditional Vesak lantern (Atapattama) in high-fidelity interactive 3D WebGL. Built by Ceylon X.",
  openGraph: {
    title: "Ceylon X — High-Fidelity 3D Vesak Kalapaya Engine",
    description: "Interactive 3D WebGL Vesak celebration featuring custom shaders and spatial audio.",
    url: "https://ceylonx.co",
    siteName: "Ceylon X Corporation",
    locale: "en_US",
    type: "website",
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cinzel.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-black text-cx-cream overflow-hidden">
        {children}
      </body>
    </html>
  );
}

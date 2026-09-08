import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted variable fonts, bundled at build time — no runtime request to
// Google's CDN. Same visual result as next/font/google, but the font files
// ship with the app itself, which matters for a low-data-first product.
const fraunces = localFont({
  src: "../fonts/fraunces.ttf",
  variable: "--font-fraunces",
  display: "swap",
});

const inter = localFont({
  src: "../fonts/inter.ttf",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "December Issa Vybe — The door opens 1 October | FirstBank",
  description:
    "Run at the door, spin the wheel, climb the leaderboard, and bring a friend to jump the queue. FirstBank opens Nigeria's December on 1 October.",
  openGraph: {
    title: "The door is locked. For now. — December Issa Vybe",
    description: "Play, earn Vybe Points, and get in first. Opens 1 October.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans grain-overlay antialiased">
        <div className="aurora-field" aria-hidden="true">
          <div className="aurora-blob-3" />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}

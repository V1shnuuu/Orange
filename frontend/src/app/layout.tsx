import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { WalletProvider } from "@/components/WalletProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SplitStream — Programmable Revenue Sharing on Stellar",
  description:
    "One payment. Infinite splits. On-chain. SplitStream lets you create programmable revenue splits that automatically distribute USDC to multiple recipients on the Stellar network.",
  keywords: ["Stellar", "Soroban", "revenue sharing", "USDC", "smart contracts", "crypto payments"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary antialiased">
        <WalletProvider>
          <Nav />
          <main className="flex-1">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}

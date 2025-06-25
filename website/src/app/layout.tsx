import type { Metadata } from "next";

import "./globals.css";

import Navbar from "@/components/nav";

import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "NeoPedia",
  description: "Online Encyclopedia",
  icons: [
    {
      rel: "icon",
      url: "data:image/svg+xml,%3Csvg data-v-56bd7dfc='' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' stroke='%23fff' style='background: %23000;'%3E%3Cpath d='M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20'%3E%3C/path%3E%3Cpath d='M8 11h8'%3E%3C/path%3E%3Cpath d='M8 7h6'%3E%3C/path%3E%3C/svg%3E",
      type: "image/svg+xml",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}

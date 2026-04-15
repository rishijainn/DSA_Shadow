import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DSA Shadow — FSRS-Powered LeetCode Tracker",
  description:
    "Stop forgetting what you solved. DSA Shadow uses the FSRS spaced-repetition algorithm to tell you exactly when your memory is fading — so you review at the perfect moment.",
  keywords: ["LeetCode", "DSA", "spaced repetition", "FSRS", "algorithm", "interview prep"],
  openGraph: {
    title: "DSA Shadow — FSRS-Powered LeetCode Tracker",
    description: "Stop grinding. Start retaining. The smarter way to prepare for coding interviews.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

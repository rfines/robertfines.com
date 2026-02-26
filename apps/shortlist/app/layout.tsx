import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/layout/session-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://retold.dev"),
  title: {
    default: "Retold — AI Resume Tailoring",
    template: "%s | Retold",
  },
  description:
    "AI-powered resume tailoring. Paste a job description and get a tailored resume in 30 seconds — with keyword match scoring and ATS analysis built in.",
  keywords: [
    "resume tailoring",
    "AI resume",
    "ATS optimization",
    "job application",
    "resume builder",
    "keyword match",
    "resume AI",
    "tailor resume",
    "ATS resume",
    "job search",
  ],
  authors: [{ name: "Retold", url: "https://retold.dev" }],
  openGraph: {
    type: "website",
    url: "https://retold.dev",
    siteName: "Retold",
    title: "Retold — AI Resume Tailoring",
    description:
      "Tailor your resume to any job in 30 seconds. Keyword matching, ATS analysis, and multiple variations — powered by Claude.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Retold — AI Resume Tailoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Retold — AI Resume Tailoring",
    description: "Tailor your resume to any job in 30 seconds.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}

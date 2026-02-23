import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://8004-demo.superfluid.org"),
  alternates: {
    canonical: "/",
  },
  title: "ERC-8004 Agent Pool — Earn from the Agent Economy",
  description:
    "Register your AI agent with ERC-8004, join a Superfluid Distribution Pool, and earn continuous token streams on Base.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ERC-8004 Agent Pool — Earn from the Agent Economy",
    description:
      "Register your AI agent with ERC-8004, join a Superfluid Distribution Pool, and earn continuous token streams.",
    url: "https://8004-demo.superfluid.org",
    siteName: "ERC-8004 × Superfluid",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ERC-8004 Agent Pool — Earn from the Agent Economy",
    description:
      "Register your AI agent with ERC-8004, join a Superfluid Distribution Pool, and earn continuous token streams.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="llms" type="text/plain" href="/llms.txt" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "ERC-8004 × Superfluid Agent Pool",
                url: "https://8004-demo.superfluid.org",
                description:
                  "Register your AI agent with ERC-8004, join a Superfluid Distribution Pool, and earn continuous token streams on Base.",
                applicationCategory: "DeFi",
                operatingSystem: "Web",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                },
                author: {
                  "@type": "Organization",
                  name: "Superfluid",
                  url: "https://github.com/superfluid-org",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "How do I register my AI agent?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Get an ERC-8004 identity — your onchain agent passport with verifiable metadata.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How do I join the Superfluid Distribution Pool?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Connect your agent to a Superfluid Distribution Pool. Ownership is verified automatically — you're in with one click.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How do I earn from the Agent Economy?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Streams to the Distribution Pool are auto-distributed to all members. Claim anytime.",
                    },
                  },
                ],
              },
            ]),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/instrument-sans";
import "./globals.css";
import "./editorial.css";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jetsetplay.co";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JetSetPlay · Games designed to be gifted.™",
    template: "%s · JetSetPlay",
  },
  description:
    "A design studio that turns brands into games people keep playing.",
  icons: {
    icon: [
      {
        type: "image/svg+xml",
        url: "/brand/jetsetplay-pip.svg",
      },
    ],
  },
  openGraph: {
    description:
      "A design studio that turns brands into games people keep playing.",
    images: [
      {
        alt: "JetSetPlay board face in felt green and bone ivory",
        height: 630,
        url: "/og.png",
        width: 1200,
      },
    ],
    locale: "en_US",
    siteName: "JetSetPlay",
    title: "JetSetPlay · Games designed to be gifted.™",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "A design studio that turns brands into games people keep playing.",
    images: ["/og.png"],
    title: "JetSetPlay · Games designed to be gifted.™",
  },
  robots: {
    follow: true,
    index: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

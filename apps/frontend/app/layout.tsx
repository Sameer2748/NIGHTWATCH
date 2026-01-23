import type { Metadata } from "next";
import { Instrument_Serif, Roboto, Silkscreen } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { ReduxProvider } from "@/store/provider";
import { Toaster } from "sonner";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-logo",
});

export const metadata: Metadata = {
  title: "NIGHTWATCH | Premium Uptime Monitoring",
  description: "Advanced open-source uptime monitoring and status pages. Keep your services under control 24/7.",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0a0b0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${instrument.variable} ${roboto.variable} ${silkscreen.variable}`}>
        <ReduxProvider>
          <ThemeProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

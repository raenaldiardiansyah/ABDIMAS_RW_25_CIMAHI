import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/use-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Abdi Masyarakat â€” Portal RW 25 Cimahi",
  description:
    "Layanan digital warga RW 25 Cimahi: cek bansos, kelayakan pemilu, aspirasi, dan jadwal kegiatan.",
  manifest: "/manifest.webmanifest",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RW25 Cimahi",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          <PwaRegister />
          <Toaster />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

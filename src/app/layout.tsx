import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "QuimioGest",
  description: "Gestión inteligente para tu negocio de químicos.",
  manifest: "/manifest.json",
  icons: {
    icon: '/iconohomecleancuadrado.png',
    shortcut: '/iconohomecleancuadrado.png',
    apple: '/iconohomecleancuadrado.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuimioGest",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3F51B5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

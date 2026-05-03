import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/crm/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlanVida CRM - Gestión de Ventas",
  description:
    "CRM para la gestión de ventas de planes de salud en Argentina. Pipeline visual, leads, tareas y automatización con IA.",
  keywords: [
    "CRM",
    "PlanVida",
    "planes de salud",
    "ventas",
    "Argentina",
    "obras sociales",
    "gestión",
  ],
  authors: [{ name: "PlanVida" }],
  openGraph: {
    title: "PlanVida CRM - Gestión de Ventas",
    description:
      "CRM para la gestión de ventas de planes de salud en Argentina",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

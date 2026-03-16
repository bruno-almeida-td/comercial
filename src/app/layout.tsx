import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import DataInitializer from "@/components/DataInitializer";

export const metadata: Metadata = {
  title: "Tax Summit 2026 - Gestão de Ingressos",
  description: "Sistema de gestão de ingressos para o Tax Summit 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <DataInitializer />
        <Sidebar />
        <main className="ml-64 min-h-screen p-8">{children}</main>
      </body>
    </html>
  );
}

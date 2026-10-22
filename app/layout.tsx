import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // <-- 1. Importar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FeedbackFlow",
  description: "Construyendo el producto juntos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar /> {/* <-- 2. Añadir Navbar aquí */}
        {children}
      </body>
    </html>
  );
}
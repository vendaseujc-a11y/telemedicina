import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VitaLink - Telemedicina Online",
  description: "Consultas médicas por videochamada. Agende sua consulta online com médicos certificados. Saúde digital acessível para todos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Telemedicina Pro",
  description: "Sistema de agendamento e consulta por vídeo",
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
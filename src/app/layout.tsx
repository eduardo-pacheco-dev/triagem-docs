import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/Providers"

export const metadata: Metadata = {
  title: "IBM Document Intake — Check-in e Fila de Análise",
  description: "Plataforma de check-in e fila de espera para análise de documentos, com painel administrativo em tempo real.",
  authors: [{ name: "IBM Document Intake" }],
  openGraph: {
    title: "IBM Document Intake — Check-in e Fila de Análise",
    description: "Plataforma de check-in e fila de espera para análise de documentos.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IBM Document Intake — Check-in e Fila de Análise",
    description: "Plataforma de check-in e fila de espera para análise de documentos.",
  },

}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

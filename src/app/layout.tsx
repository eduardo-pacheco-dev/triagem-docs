import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AFL Engenharia - Triagem Docs",
  description: "Plataforma de check-in e fila de espera para análise de documentos.",
  openGraph: {
    title: "AFL Engenharia - Triagem Docs",
    description: "Plataforma de check-in e fila de espera para análise de documentos.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AFL Engenharia - Triagem Docs",
    description: "Plataforma de check-in e fila de espera para análise de documentos.",
  },

}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}
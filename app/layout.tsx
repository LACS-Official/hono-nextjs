import '../styles/globals.css';

export const metadata = {
  title: 'Neon API Server',
  description: 'API server with Neon Postgres and activation codes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}

import '../styles/globals.css';

export const metadata = {
  title: 'LACS API Server',
  description: 'API server with Neon Postgres, activation codes and software management',
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

import './globals.css'

export const metadata = {
  title: 'Visual Intelligence System',
  description: 'Transform visual content into searchable intelligence',
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'default',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
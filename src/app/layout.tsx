import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'YouTube to Twitter Thread & AI Art Generator',
  description: 'Transform YouTube videos, articles, PDFs, or text into Twitter threads and AI art prompts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🧵 Thread & Art Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Transform any content into Twitter threads and AI art prompts
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
'use client'
import { Inter }    from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import { Provider } from 'react-redux'
import { store }    from '@/store'
import { Toaster }  from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider store={store}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#1f2937', color: '#fff' },
            }}
          />
        </Provider>
      </body>
    </html>
  )
}
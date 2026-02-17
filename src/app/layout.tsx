import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { CartProvider } from '../contexts/CartContext'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar></Navbar>
          <main>{children}</main>
          <Footer></Footer>
        </CartProvider>
      </body>
    </html>
  )
}
'use client'

import Image from 'next/image'
import { useCart } from '@/src/contexts/CartContext'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const formatPrice = (price: number) => {
  if (price >= 1000) {
    const thousand = price / 1000
    return `₡${thousand % 1 === 0 ? thousand : thousand.toFixed(1)} mil`
  }
  return `₡${price}`
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart()

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return

    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    const message = items
      .map((item) => {
        const details = [item.storage, item.color, item.batteryHealth, item.condition]
          .filter(Boolean)
          .join(' • ')
        const link = item.productUrl && origin ? `${origin}${item.productUrl}` : item.productUrl
        const linkLine = link ? `\n  Link: ${link}` : ''
        return `• ${item.modelBrand} ${item.modelName}\n  ${details}\n  ${formatPrice(item.price)} x ${item.quantity} = ${formatPrice(item.price * item.quantity)}${linkLine}`
      })
      .join('\n\n')

    const total = `\n\nTotal: ${formatPrice(totalPrice)}`
    const fullMessage = `Hola, me gustaría comprar:\n\n${message}${total}`

    const whatsappUrl = `https://wa.me/50661826821?text=${encodeURIComponent(fullMessage)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="cart-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Cart Sidebar */}
      <div
        className={`cart-sidebar ${isOpen ? 'cart-sidebar-open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '400px',
          height: '100vh',
          backgroundColor: '#fff',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            Carrito ({totalItems})
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Cart Items */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
          }}
        >
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
              Tu carrito está vacío
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item) => (
                <div
                  key={item.productId}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {item.modelImage && (
                      <Image
                        src={item.modelImage}
                        alt={item.modelName}
                        width={60}
                        height={60}
                        style={{
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                        {item.modelBrand} {item.modelName}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0' }}>
                        {[item.storage, item.color, item.batteryHealth, item.condition]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          background: '#fff',
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          background: '#fff',
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              padding: '20px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '16px',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              <span>Total:</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <button
              onClick={handleWhatsAppCheckout}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              Comprar por WhatsApp
            </button>
            <button
              onClick={clearCart}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#fff',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  )
}

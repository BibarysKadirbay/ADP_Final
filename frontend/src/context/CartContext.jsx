import React, { createContext, useState, useEffect } from 'react'

export const CartContext = createContext()

function cartKey(bookId, formatType) {
    return bookId + '|' + formatType
}

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart')
        return savedCart ? JSON.parse(savedCart) : []
    })

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (book, format) => {
        const id = book.id || book._id
        const key = cartKey(id, format.type)
        setCart((prevCart) => {
            const existing = prevCart.find((item) => cartKey(item.bookId, item.formatType) === key)
            if (existing) {
                return prevCart.map((item) =>
                    cartKey(item.bookId, item.formatType) === key ? { ...item, quantity: item.quantity + 1 } : item
                )
            }
            return [...prevCart, {
                bookId: id,
                formatType: format.type,
                price: format.price,
                quantity: 1,
                bookTitle: book.title || book.Title,
                type: format.type,
            }]
        })
    }

    const removeFromCart = (bookId, formatType) => {
        const key = cartKey(bookId, formatType)
        setCart((prev) => prev.filter((item) => cartKey(item.bookId, item.formatType) !== key))
    }

    const updateQuantity = (bookId, formatType, quantity) => {
        if (quantity <= 0) {
            removeFromCart(bookId, formatType)
        } else {
            const key = cartKey(bookId, formatType)
            setCart((prevCart) =>
                prevCart.map((item) =>
                    cartKey(item.bookId, item.formatType) === key ? { ...item, quantity } : item
                )
            )
        }
    }

    const clearCart = () => {
        setCart([])
    }

    const getTotalPrice = (discountPercent = 0) => {
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        return total * (1 - discountPercent / 100)
    }

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0)
    }

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getTotalPrice,
                getTotalItems
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const context = React.useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within CartProvider')
    }
    return context
}

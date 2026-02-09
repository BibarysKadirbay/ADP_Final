import React, { createContext, useState, useEffect } from 'react'

export const CartContext = createContext()

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart')
        return savedCart ? JSON.parse(savedCart) : []
    })

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (format) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === format.id)
            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === format.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            }
            return [...prevCart, { ...format, quantity: 1 }]
        })
    }

    const removeFromCart = (formatId) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== formatId))
    }

    const updateQuantity = (formatId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(formatId)
        } else {
            setCart((prevCart) =>
                prevCart.map((item) =>
                    item.id === formatId ? { ...item, quantity } : item
                )
            )
        }
    }

    const clearCart = () => {
        setCart([])
    }

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0)
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

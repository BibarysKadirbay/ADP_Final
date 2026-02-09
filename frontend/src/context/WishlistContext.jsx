import React, { createContext, useState, useEffect } from 'react'

export const WishlistContext = createContext()

const STORAGE_KEY = 'bookstore_wishlist'

export const WishlistProvider = ({ children }) => {
    const [ids, setIds] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return []
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    }, [ids])

    const add = (bookId) => {
        const id = typeof bookId === 'string' ? bookId : (bookId?.id || bookId?._id)
        if (!id) return
        setIds(prev => prev.includes(id) ? prev : [...prev, id])
    }

    const remove = (bookId) => {
        const id = typeof bookId === 'string' ? bookId : (bookId?.id || bookId?._id)
        if (!id) return
        setIds(prev => prev.filter(x => x !== id))
    }

    const has = (bookId) => {
        const id = typeof bookId === 'string' ? bookId : (bookId?.id || bookId?._id)
        return id ? ids.includes(id) : false
    }

    const toggle = (bookId) => {
        if (has(bookId)) remove(bookId)
        else add(bookId)
    }

    return (
        <WishlistContext.Provider value={{ wishlistIds: ids, addToWishlist: add, removeFromWishlist: remove, isInWishlist: has, toggleWishlist: toggle }}>
            {children}
        </WishlistContext.Provider>
    )
}

export const useWishlist = () => {
    const ctx = React.useContext(WishlistContext)
    if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
    return ctx
}

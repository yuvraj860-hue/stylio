import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { wishlistApi } from '../services/api';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isSignedIn } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isSignedIn) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await wishlistApi.get();
      setItems(res?.wishlist || []);
    } catch (e) {
      console.warn('Wishlist load failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const wishlistIds = useMemo(() => {
    return new Set(items.map((item) => String(item._id || item.id)));
  }, [items]);

  const isInWishlist = useCallback(
    (productId) => wishlistIds.has(String(productId)),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      const pid = String(product._id || product.id);
      const currentlyIn = wishlistIds.has(pid);

      // Optimistic update
      if (currentlyIn) {
        setItems((prev) => prev.filter((p) => String(p._id || p.id) !== pid));
      } else {
        setItems((prev) => [product, ...prev]);
      }

      window.dispatchEvent(
        new CustomEvent('stylio:toast', {
          detail: {
            message: currentlyIn
              ? `Removed "${product.name}" from Wishlist`
              : `Added "${product.name}" to Wishlist ❤️`,
          },
        })
      );

      if (isSignedIn) {
        try {
          await wishlistApi.toggle(pid);
        } catch (err) {
          // Revert on error
          fetchWishlist();
        }
      }
    },
    [wishlistIds, isSignedIn, fetchWishlist]
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      loading,
      isInWishlist,
      toggleWishlist,
      refreshWishlist: fetchWishlist,
    }),
    [items, loading, isInWishlist, toggleWishlist, fetchWishlist]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}

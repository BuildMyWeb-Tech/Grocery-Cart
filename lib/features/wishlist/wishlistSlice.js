// lib/features/wishlist/wishlistSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchWishlistThunk = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/wishlist', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch wishlist');
      return await res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleWishlistThunk = createAsyncThunk(
  'wishlist/toggle',
  async ({ productId }, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error('Failed to update wishlist');
      return await res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: [], loading: false, error: null },
  reducers: {
    addToWishlist: (state, action) => {
      const product = action.payload;
      const id = product.id || product.productId;
      // Check both flat and nested shape
      const exists = state.items.find(
        (item) => (item.productId || item.id) === id
      );
      if (!exists) {
        state.items.push({ id, productId: id, ...product });
      }
    },
    removeFromWishlist: (state, action) => {
      const id = action.payload;
      // Remove regardless of shape
      state.items = state.items.filter(
        (item) => (item.productId || item.id) !== id
      );
    },
    clearWishlist: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlistThunk.pending,   (state) => { state.loading = true; })
      .addCase(fetchWishlistThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items   = action.payload.items || [];
      })
      .addCase(fetchWishlistThunk.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
      .addCase(toggleWishlistThunk.fulfilled, (state, action) => {
        if (action.payload.items !== undefined) state.items = action.payload.items;
      });
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
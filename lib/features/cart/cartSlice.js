// lib/features/cart/cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ── Async: Fetch cart from DB ─────────────────────────────────────
export const fetchCartThunk = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch cart');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ── Async: Save cart to DB ────────────────────────────────────────
export const uploadCartThunk = createAsyncThunk(
  'cart/uploadCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const items = getState().cart.items;
      const response = await fetch('/api/cart', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error('Failed to save cart');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ── Helpers ───────────────────────────────────────────────────────
function recalculate(state) {
  state.totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  state.total = state.items.length;

  // Group items by store for multi-store display
  const groups = {};
  for (const item of state.items) {
    const sid = item.storeId;
    if (!groups[sid]) {
      groups[sid] = {
        storeId: sid,
        storeName: item.storeName || 'Store',
        storeLogo: item.storeLogo || null,
        storeUsername: item.storeUsername || null,
        items: [],
        subtotal: 0,
      };
    }
    groups[sid].items.push(item);
    groups[sid].subtotal += item.price * item.quantity;
  }
  state.storeGroups = groups;
}

// ── Initial State ─────────────────────────────────────────────────
const initialState = {
  items: [],        // flat list of all cart items
  storeGroups: {},  // items grouped by storeId
  totalPrice: 0,
  total: 0,
  loading: false,
  error: null,
};

// ── Slice ─────────────────────────────────────────────────────────
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // addToCart expects:
    // { variantId, productId, storeId, price, variantName, productName,
    //   productImage, storeName, quantity }
    addToCart: (state, action) => {
      const product = action.payload;

      if (!product.variantId) {
        console.warn('addToCart: variantId is required');
        return;
      }
      if (!product.storeId) {
        console.warn('addToCart: storeId is required');
        return;
      }

      // Match by variantId (unique per variant)
      const existing = state.items.find((item) => item.variantId === product.variantId);

      if (existing) {
        existing.quantity += product.quantity ?? 1;
      } else {
        state.items.push({
          ...product,
          quantity: product.quantity ?? 1,
        });
      }

      recalculate(state);
    },

    removeFromCart: (state, action) => {
      // action.payload = variantId
      state.items = state.items.filter((item) => item.variantId !== action.payload);
      recalculate(state);
    },

    updateCartQuantity: (state, action) => {
      const { variantId, quantity } = action.payload;
      const item = state.items.find((item) => item.variantId === variantId);
      if (item) item.quantity = Math.max(1, quantity);
      recalculate(state);
    },

    clearCart: (state) => {
      state.items       = [];
      state.storeGroups = {};
      state.totalPrice  = 0;
      state.total       = 0;
    },

    // Apply live stock validation results from API
    applyStockValidation: (state, action) => {
      const { validItems } = action.payload;
      const variantMap = {};
      validItems.forEach((item) => { variantMap[item.variantId] = item; });

      state.items = state.items
        .filter((item) => variantMap[item.variantId] && !variantMap[item.variantId].removed)
        .map((item) => ({
          ...item,
          quantity: variantMap[item.variantId]?.quantity ?? item.quantity,
          availableStock: variantMap[item.variantId]?.availableStock ?? null,
          outOfStock: variantMap[item.variantId]?.outOfStock ?? false,
          stockWarning: variantMap[item.variantId]?.stockWarning ?? false,
          price: variantMap[item.variantId]?.price ?? item.price,
        }));

      recalculate(state);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchCartThunk.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        const items = action.payload.items || [];
        state.items = items;
        recalculate(state);
      })
      .addCase(fetchCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
      .addCase(uploadCartThunk.pending, (state) => { state.loading = true; })
      .addCase(uploadCartThunk.fulfilled, (state) => { state.loading = false; })
      .addCase(uploadCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  applyStockValidation,
} = cartSlice.actions;

export default cartSlice.reducer;
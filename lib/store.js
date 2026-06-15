// lib/store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

import cartReducer     from './features/cart/cartSlice';
import wishlistReducer from './features/wishlist/wishlistSlice';
import productReducer  from './features/product/productSlice';
import addressReducer  from './features/address/addressSlice';
import ratingReducer   from './features/rating/ratingSlice';

// ── SSR-safe storage ──────────────────────────────────────────────
// redux-persist/lib/storage crashes on the server because it uses
// localStorage. This creates a no-op storage for SSR and the real
// localStorage storage in the browser.
const createNoopStorage = () => ({
  getItem:    () => Promise.resolve(null),
  setItem:    (_key, value) => Promise.resolve(value),
  removeItem: () => Promise.resolve(),
});

const storage =
  typeof window !== 'undefined'
    ? createWebStorage('local')
    : createNoopStorage();

// ── Root Reducer ──────────────────────────────────────────────────
const rootReducer = combineReducers({
  cart:     cartReducer,
  wishlist: wishlistReducer,
  product:  productReducer,
  address:  addressReducer,
  rating:   ratingReducer,
});

// ── Persist Config ────────────────────────────────────────────────
const persistConfig = {
  key:       'root',
  storage,
  whitelist: ['cart', 'wishlist'], // only persist cart and wishlist
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ── Store ─────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false, // required for redux-persist actions
    }),
});

// ── Persistor ─────────────────────────────────────────────────────
export const persistor = persistStore(store);
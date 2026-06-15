// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\lib\features\product\productSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async ({ storeId, search, category, page, limit } = {}, thunkAPI) => {
    try {
      const params = new URLSearchParams();
      if (storeId)  params.set('storeId',  storeId);
      if (search)   params.set('search',   search);
      if (category) params.set('category', category);
      if (page)     params.set('page',     page);
      if (limit)    params.set('limit',    limit);

      const qs  = params.toString();
      const res = await fetch(`/api/products${qs ? `?${qs}` : ''}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      return data.products || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const productSlice = createSlice({
  name: 'product',
  initialState: {
    list:    [],
    loading: false,
    error:   null,
  },
  reducers: {
    setProduct: (state, action) => {
      state.list = action.payload;
    },
    clearProduct: (state) => {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list    = action.payload;
      })
      .addCase(fetchProducts.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });
  },
});

export const { setProduct, clearProduct } = productSlice.actions;
export default productSlice.reducer;
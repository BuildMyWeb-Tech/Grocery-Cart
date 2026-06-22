// C:\Users\Siddharathan\Desktop\Grocery-Cart\lib\features\address\addressSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const fetchAddress = createAsyncThunk(
  'address/fetchAddress',
  async (_, thunkAPI) => {
    try {
      const res = await fetch('/api/address', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch addresses');
      const data = await res.json();
      return data.addresses || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const addressSlice = createSlice({
  name: 'address',
  initialState: { list: [] },
  reducers: {
    addAddress: (state, action) => {
      state.list.push(action.payload);
    },
    removeAddress: (state, action) => {
      state.list = state.list.filter((a) => a.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAddress.fulfilled, (state, action) => {
      state.list = action.payload;
    });
  },
});

export const { addAddress, removeAddress } = addressSlice.actions;
export default addressSlice.reducer;
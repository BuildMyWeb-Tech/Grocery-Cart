// lib/features/rating/ratingSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const fetchUserRatings = createAsyncThunk(
  'rating/fetchUserRatings',
  async (_, thunkAPI) => {
    try {
      const res = await fetch('/api/rating', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch ratings');
      const data = await res.json();
      return data.ratings || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const submitRating = createAsyncThunk(
  'rating/submit',
  async ({ orderId, productId, rating, review }, thunkAPI) => {
    try {
      const res = await fetch('/api/rating', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, productId, rating, review }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      return data.rating;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const ratingSlice = createSlice({
  name: 'rating',
  initialState: {
    ratings:     [],
    loading:     false,
    error:       null,
    submitError: null,
  },
  reducers: {
    // Used by RatingModal for optimistic/direct update after API call
    addRating: (state, action) => {
      if (action.payload) {
        state.ratings.unshift(action.payload);
      }
    },
    clearSubmitError: (state) => {
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserRatings.pending,   (state) => { state.loading = true; })
      .addCase(fetchUserRatings.fulfilled, (state, action) => {
        state.loading = false;
        state.ratings = action.payload;
      })
      .addCase(fetchUserRatings.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
      .addCase(submitRating.pending,   (state) => { state.loading = true; state.submitError = null; })
      .addCase(submitRating.fulfilled, (state, action) => {
        state.loading = false;
        state.ratings.unshift(action.payload);
      })
      .addCase(submitRating.rejected,  (state, action) => {
        state.loading     = false;
        state.submitError = action.payload;
      });
  },
});

export const { addRating, clearSubmitError } = ratingSlice.actions;
export default ratingSlice.reducer;
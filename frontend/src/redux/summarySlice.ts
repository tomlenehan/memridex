import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { SummariesService } from '../client';

interface SummaryState {
  summary: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed' | 'streaming';
  error: string | null;
  currentStreamingSummary: string | null;
}

const initialState: SummaryState = {
  summary: '',
  status: 'idle',
  error: null,
  currentStreamingSummary: null,
};

export const fetchSummary = createAsyncThunk(
  'summary/fetchSummary',
  async (conversationId: number) => {
    const response = await SummariesService.readStorySummary({ id: conversationId });
    return response.summary_text;
  }
);

export const generateSummary = createAsyncThunk(
  'summary/generateSummary',
  async (conversationId: number) => {
    const response = await SummariesService.createStorySummary({ conversationId });
    return response.summary_text;
  }
);

const summarySlice = createSlice({
  name: 'summary',
  initialState,
  reducers: {
    startStreamingSummary: (state) => {
      state.currentStreamingSummary = '';
      state.status = 'streaming';
    },
    addStreamingSummary: (state, action: PayloadAction<string>) => {
      if (state.currentStreamingSummary !== null) {
        state.currentStreamingSummary += action.payload;
      }
    },
    endStreamingSummary: (state) => {
      if (state.currentStreamingSummary !== null) {
        state.summary = state.currentStreamingSummary;
        state.currentStreamingSummary = null;
        state.status = 'succeeded';
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(generateSummary.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(generateSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(generateSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      });
  },
});

export const { startStreamingSummary, addStreamingSummary, endStreamingSummary } = summarySlice.actions;

export default summarySlice.reducer;

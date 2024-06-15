import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ConversationPublic, ConversationsService } from '../client';

interface ConversationState {
  conversation: ConversationPublic | null;
  status: 'inactive' | 'active' | 'ready_for_summary' | 'complete' | 'failed' | 'loading';
  error: string | null;
}

const initialState: ConversationState = {
  conversation: null,
  status: 'inactive',
  error: null,
};

export const fetchConversationStatus = createAsyncThunk(
  'conversation/fetchConversationStatus',
  async (conversationId: number) => {
    const response = await ConversationsService.readConversation({ id: conversationId });
    return response;
  }
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setReadyForSummary: (state) => {
      state.status = 'ready_for_summary';
    },
    setComplete: (state) => {
      state.status = 'complete';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversationStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchConversationStatus.fulfilled, (state, action) => {
        state.status = action.payload.status ?? 'inactive';
        state.conversation = action.payload;
      })
      .addCase(fetchConversationStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      });
  },
});

export const { setReadyForSummary, setComplete } = conversationSlice.actions;

export default conversationSlice.reducer;

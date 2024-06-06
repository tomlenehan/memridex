import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ChatMessagePublic, ChatMessagesService } from '../client';

interface ChatState {
  messages: ChatMessagePublic[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentStreamingMessageId: number | null;
}

const initialState: ChatState = {
  messages: [],
  status: 'idle',
  error: null,
  currentStreamingMessageId: null,
};

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: number) => {
    const response = await ChatMessagesService.readChatMessages({ conversationId });
    return response.data;
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessagePublic>) => {
      state.messages.push(action.payload);
    },
    startStreamingMessage: (state) => {
      const newMessage: ChatMessagePublic = {
        id: Date.now(), // Temporary unique identifier
        timestamp: new Date().toISOString(),
        sender_type: 'ai',
        content: '',
      };
      state.messages.push(newMessage);
      state.currentStreamingMessageId = newMessage.id;
    },
    addStreamingMessage: (state, action: PayloadAction<Partial<ChatMessagePublic>>) => {
      const streamingMessage = state.messages.find(
        (msg) => msg.id === state.currentStreamingMessageId
      );

      if (streamingMessage) {
        streamingMessage.content += action.payload.content;
      }
    },
    endStreamingMessage: (state) => {
      state.currentStreamingMessageId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      });
  },
});

export const { addMessage, startStreamingMessage, addStreamingMessage, endStreamingMessage } = chatSlice.actions;

export default chatSlice.reducer;

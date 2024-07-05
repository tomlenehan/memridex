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
    clearMessages: (state) => {
      state.messages = [];
      state.status = 'idle';
      state.error = null;
      state.currentStreamingMessageId = null;
    },
    addMessage: (state, action: PayloadAction<ChatMessagePublic>) => {
      state.messages.push(action.payload);
    },
    startStreamingMessage: (state, action: PayloadAction<{ id: number, sender_type?: string }>) => {
      const newMessage: ChatMessagePublic = {
        id: action.payload.id,
        timestamp: new Date().toISOString(),
        sender_type: 'ai',
        content: '',
      };
      state.messages.push(newMessage);
      state.currentStreamingMessageId = newMessage.id;
    },
    addStreamingMessage: (state, action: PayloadAction<{ id: number, content: string }>) => {
      if (action.payload.id) {
        const streamingMessage = state.messages.find(
          (msg) => msg.id === action.payload.id
        );

        if (streamingMessage) {
          streamingMessage.content += action.payload.content;
        }
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

export const {
  clearMessages,
  addMessage,
  startStreamingMessage,
  addStreamingMessage,
  endStreamingMessage,
} = chatSlice.actions;

export default chatSlice.reducer;

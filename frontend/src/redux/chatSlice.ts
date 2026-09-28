import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ChatMessagePublic, ChatMessagesService } from '../client';

interface ChatState {
  messages: ChatMessagePublic[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentStreamingMessageId: number | null;
  streamingMessageIds: number[];
}

const initialState: ChatState = {
  messages: [],
  status: 'idle',
  error: null,
  currentStreamingMessageId: null,
  streamingMessageIds: [],
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
      state.streamingMessageIds = [];
    },
    addMessage: (state, action: PayloadAction<ChatMessagePublic>) => {
      state.messages.push(action.payload);
    },
    startStreamingMessage: (state, action: PayloadAction<{ id: number, sender_type?: string }>) => {
      const newMessage: ChatMessagePublic = {
        id: action.payload.id,
        timestamp: new Date().toISOString(),
        sender_type: (action.payload.sender_type as ChatMessagePublic['sender_type']) || 'ai',
        content: '',
      };
      state.messages.push(newMessage);
      state.currentStreamingMessageId = newMessage.id;
      if (!state.streamingMessageIds.includes(newMessage.id)) {
        state.streamingMessageIds.push(newMessage.id);
      }
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
    replaceStreamingMessage: (state, action: PayloadAction<{ id: number, message: ChatMessagePublic }>) => {
      const index = state.messages.findIndex((msg) => msg.id === action.payload.id);
      if (index >= 0) state.messages[index] = action.payload.message;
      else state.messages.push(action.payload.message);
      state.streamingMessageIds = state.streamingMessageIds.filter((id) => id !== action.payload.id);
      if (state.currentStreamingMessageId === action.payload.id) {
        state.currentStreamingMessageId = null;
      }
    },
    removeStreamingMessage: (state, action: PayloadAction<{ id: number }>) => {
      state.messages = state.messages.filter((msg) => msg.id !== action.payload.id);
      state.streamingMessageIds = state.streamingMessageIds.filter((id) => id !== action.payload.id);
      if (state.currentStreamingMessageId === action.payload.id) {
        state.currentStreamingMessageId = null;
      }
    },
    endStreamingMessage: (state, action: PayloadAction<{ id?: number } | undefined>) => {
      if (action.payload?.id !== undefined) {
        state.streamingMessageIds = state.streamingMessageIds.filter((id) => id !== action.payload?.id);
        if (state.currentStreamingMessageId === action.payload.id) {
          state.currentStreamingMessageId = null;
        }
      } else {
        state.streamingMessageIds = [];
        state.currentStreamingMessageId = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        if (state.messages.length === 0) state.status = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = state.messages.length === 0 ? 'failed' : 'succeeded';
        state.error = action.error.message || null;
      });
  },
});

export const {
  clearMessages,
  addMessage,
  startStreamingMessage,
  addStreamingMessage,
  replaceStreamingMessage,
  removeStreamingMessage,
  endStreamingMessage,
} = chatSlice.actions;

export default chatSlice.reducer;

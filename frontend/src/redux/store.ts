import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import conversationReducer from './conversationSlice';

const store = configureStore({
  reducer: {
    chat: chatReducer,
    conversation: conversationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

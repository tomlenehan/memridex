import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import conversationReducer from './conversationSlice';
import summaryReducer from './summarySlice';

const store = configureStore({
  reducer: {
    chat: chatReducer,
    conversation: conversationReducer,
    summary: summaryReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

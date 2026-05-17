import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { executeChatActions } from '@/lib/chatbotActions';

export interface ChatAction {
  action: 'navigate' | 'applyVoucher' | 'addToCart' | string;
  slug?: string;
  code?: string;
  message?: string;
  [key: string]: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actions?: ChatAction[];
  suggestions?: string[];
}

interface ChatbotState {
  messages: Message[];
  isLoading: boolean;
  sessionId: string;
  isOpen: boolean;
  
  // Actions
  setIsOpen: (isOpen: boolean) => void;
  toggleChat: () => void;
  sendMessage: (text: string, router?: { push: (path: string) => void }) => Promise<void>;
  clearChat: () => Promise<void>;
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const useChatbot = create<ChatbotState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      sessionId: generateUUID(),
      isOpen: false,

      setIsOpen: (isOpen) => set({ isOpen }),
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

      sendMessage: async (text: string, router?: { push: (path: string) => void }) => {
        if (!text.trim()) return;

        const { sessionId, messages } = get();
        
        // Optimistic UI update
        const userMsg: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: text.trim(),
          timestamp: Date.now(),
        };

        set({
          messages: [...messages, userMsg],
          isLoading: true,
          isOpen: true, // Ensure window is open if sending programmatically (e.g. prompt click)
        });

        try {
          const res = await api.post('/chatbot/message', { 
            message: text.trim(), 
            sessionId 
          });

          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: res.data.data.reply,
            actions: res.data.data.actions,
            suggestions: res.data.data.suggestions,
            timestamp: Date.now(),
          };

          set((state) => ({
            messages: [...state.messages, botMsg],
            isLoading: false,
          }));

          if (router && botMsg.actions?.length) {
            await executeChatActions(botMsg.actions, router);
          }
        } catch (error) {
          console.error("Chatbot API Error:", error);
          
          const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Sorry, I am having trouble connecting to the server right now. Please try again later.',
            timestamp: Date.now(),
          };

          set((state) => ({
            messages: [...state.messages, errorMsg],
            isLoading: false,
          }));
        }
      },

      clearChat: async () => {
        const { sessionId } = get();
        try {
          await api.delete(`/chatbot/session/${sessionId}`);
        } catch (e) {
          // Fire and forget
        }
        set({ messages: [], sessionId: generateUUID() });
      },
    }),
    {
      name: 'chatbot-storage',
      partialize: (state) => ({ 
        messages: state.messages, 
        sessionId: state.sessionId 
      }), // Persist messages and sessionId
    }
  )
);

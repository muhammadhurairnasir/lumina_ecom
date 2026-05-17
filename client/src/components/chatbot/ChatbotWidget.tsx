'use client';

import { MessageSquare } from 'lucide-react';
import { useChatbot } from './useChatbot';
import ChatWindow from './ChatWindow';

export default function ChatbotWidget() {
  const { isOpen, toggleChat } = useChatbot();

  return (
    <>
      {!isOpen && (
        <button 
          onClick={toggleChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform z-[9999] focus:outline-none focus:ring-4 focus:ring-primary-light"
          aria-label="Open Shopping Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      <ChatWindow />
    </>
  );
}

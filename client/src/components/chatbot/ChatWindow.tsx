import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, ShoppingBag, Gift, Package, Tag } from 'lucide-react';
import { useChatbot } from './useChatbot';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatWindow() {
  const router = useRouter();
  const { messages, isLoading, isOpen, setIsOpen, sendMessage } = useChatbot();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  if (!isOpen) return null;

  const handleSuggestedPrompt = (text: string) => {
    sendMessage(text, router);
  };

  return (
    <div className="fixed bottom-6 right-6 w-full md:w-[400px] h-full md:h-[560px] max-h-[calc(100vh-48px)] md:max-h-[calc(100vh-100px)] flex flex-col bg-surface md:rounded-2xl shadow-2xl border border-border overflow-hidden z-[9999] transform origin-bottom-right transition-all">
      
      {/* Header */}
      <div className="bg-primary p-4 flex justify-between items-center text-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Shopping Assistant</h3>
            <p className="text-xs text-primary-light">Online & ready to help</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          className="text-primary-light hover:text-white transition-colors p-1"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-[#F9FAFB] flex flex-col"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-primary mb-2">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-text-primary">How can I help today?</h4>
              <p className="text-sm text-text-secondary mt-1">I can find products, track orders, or apply discounts.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 w-full mt-4">
              <button onClick={() => handleSuggestedPrompt("What's popular right now?")} className="flex flex-col items-center justify-center p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:border-primary hover:text-primary transition-colors text-center shadow-sm">
                <ShoppingBag className="w-4 h-4 mb-2 text-text-secondary" />
                What's popular?
              </button>
              <button onClick={() => handleSuggestedPrompt("I need a gift under $50")} className="flex flex-col items-center justify-center p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:border-primary hover:text-primary transition-colors text-center shadow-sm">
                <Gift className="w-4 h-4 mb-2 text-text-secondary" />
                Gifts under $50
              </button>
              <button onClick={() => handleSuggestedPrompt("Track my order")} className="flex flex-col items-center justify-center p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:border-primary hover:text-primary transition-colors text-center shadow-sm">
                <Package className="w-4 h-4 mb-2 text-text-secondary" />
                Track Order
              </button>
              <button onClick={() => handleSuggestedPrompt("Do you have any discount codes?")} className="flex flex-col items-center justify-center p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:border-primary hover:text-primary transition-colors text-center shadow-sm">
                <Tag className="w-4 h-4 mb-2 text-text-secondary" />
                Vouchers
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}

        {isLoading && (
          <div className="flex items-start mb-4">
            <div className="bg-white border border-border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex space-x-1.5 items-center h-10">
              <div className="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-text-secondary/40 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput />
    </div>
  );
}

import { Send } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatbot } from './useChatbot';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const router = useRouter();
  const { sendMessage, isLoading } = useChatbot();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const text = input;
    setInput('');
    await sendMessage(text, router);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="p-4 bg-white border-t border-border rounded-b-2xl">
      <form 
        onSubmit={handleSubmit} 
        className="flex items-center bg-[#F9FAFB] rounded-full border border-border px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
      >
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..." 
          disabled={isLoading}
          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm py-1 text-text-primary disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="text-white bg-primary p-1.5 rounded-full disabled:opacity-50 hover:bg-primary-dark transition-colors flex-shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

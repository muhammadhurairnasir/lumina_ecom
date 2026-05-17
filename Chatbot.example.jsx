import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, ShoppingCart, Package, Tag, ChevronDown, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
/** Renders **bold** markdown syntax and [Text](link) inside chat bubbles */
const FormattedText = ({ text }) => {
  // Split by markdown links first [Text](url)
  const linkParts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return (
    <span>
      {linkParts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
          const m = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (m) {
            // Check if inside the link text it's bolded
            const linkText = m[1];
            const isBold = linkText.startsWith('**') && linkText.endsWith('**');
            const display = isBold ? <strong>{linkText.slice(2, -2)}</strong> : linkText;
            return <Link key={i} to={m[2]} className="text-blue-200 hover:text-white underline font-medium">{display}</Link>;
          }
        }

        // Otherwise handle normal bolding
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {boldParts.map((subPart, j) =>
              subPart.startsWith('**') && subPart.endsWith('**')
                ? <strong key={j}>{subPart.slice(2, -2)}</strong>
                : subPart.split('\n').map((line, k, arr) => (
                  <span key={`${j}-${k}`}>
                    {line}
                    {k < arr.length - 1 && <br />}
                  </span>
                ))
            )}
          </span>
        );
      })}
    </span>
  );
};

const QUICK_STARTS = [
  { label: 'Show Menu', icon: <ShoppingCart className="w-3 h-3" /> },
  { label: 'Track my order', icon: <Package className="w-3 h-3" /> },
  { label: 'Any coupons?', icon: <Tag className="w-3 h-3" /> },
  { label: 'Recommend something', icon: <Sparkles className="w-3 h-3" /> },
];

export default function Chatbot({ restaurantId, customerId, cart = [], onAddToCart, onRemoveFromCart, onClearCart, onOpenCheckout, onApplyCoupon }) {
  const [isOpen, setIsOpen] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('chatbot_isOpen')) || false; } catch { return false; }
  });
  const [isMinimized, setIsMinimized] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('chatbot_isMinimized')) || false; } catch { return false; }
  });
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('chatbot_messages');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      {
        role: 'bot',
        text: '👋 Hi! I\'m your **AI Store Assistant**.\n\nI can help you:\n• 🔍 Search & filter menu items\n• 📦 Track your orders\n• 🛒 Manage your cart\n• 🎟️ Find coupons & deals\n• ❓ Answer any FAQs\n\nWhat can I do for you today?',
        suggestions: ['Show menu', 'Track my order', 'Any coupons?', 'Recommend something']
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('chatbot_isOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  useEffect(() => {
    sessionStorage.setItem('chatbot_isMinimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    sessionStorage.setItem('chatbot_messages', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim() || isTyping) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => {
      const newMessages = [...prev, userMsg];
      sessionStorage.setItem('chatbot_messages', JSON.stringify(newMessages));
      return newMessages;
    });
    setInput('');
    setIsTyping(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: text,
        restaurantId,
        customerId,
        cart  // pass cart for abandoned cart detection
      });
      const botMsg = {
        role: 'bot',
        text: data.data.reply,
        suggestions: data.data.suggestions || []
      };

      // Force synchronous save BEFORE executing actions that might unmount component
      const stored = JSON.parse(sessionStorage.getItem('chatbot_messages') || '[]');
      const newMessagesWithBot = [...stored, botMsg];
      sessionStorage.setItem('chatbot_messages', JSON.stringify(newMessagesWithBot));
      setMessages(newMessagesWithBot);

      // Handle direct cart actions (supports single or array of actions)
      const actions = data.data.actions || (data.data.action ? [data.data.action] : []);
      actions.forEach(act => {
        if (act.type === 'ADD_TO_CART') {
          onAddToCart?.(act.item, act.quantity || 1);
        }
        if (act.type === 'REMOVE_FROM_CART') {
          onRemoveFromCart?.(act.itemId);
        }
        if (act.type === 'CLEAR_CART') {
          onClearCart?.();
        }
        if (act.type === 'OPEN_CHECKOUT') {
          onOpenCheckout?.();
        }
        if (act.type === 'APPLY_COUPON') {
          onApplyCoupon?.(act.coupon);
        }
      });

      if (!isOpen) setUnreadCount(prev => prev + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: '⚠️ Sorry, I\'m having trouble connecting. Please try again shortly.',
        suggestions: []
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleChip = (text) => {
    sendMessage(text);
  };

  return (
    <>
      {/* Floating Launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-50 flex items-center justify-center"
          style={{ animation: 'chatPulse 3s ease-in-out infinite' }}
          aria-label="Open AI Chat Assistant"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden"
          style={{ height: isMinimized ? 'auto' : '540px', transition: 'height 0.2s ease' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">AI Store Assistant</h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  Always Online • Powered by AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const defaultMsg = [
                    {
                      role: 'bot',
                      text: '👋 Hi! I\'m your **AI Store Assistant**.\n\nI can help you:\n• 🔍 Search & filter menu items\n• 📦 Track your orders\n• 🛒 Manage your cart\n• 🎟️ Find coupons & deals\n• ❓ Answer any FAQs\n\nWhat can I do for you today?',
                      suggestions: ['Show menu', 'Track my order', 'Any coupons?', 'Recommend something']
                    }
                  ];
                  setMessages(defaultMsg);
                  sessionStorage.setItem('chatbot_messages', JSON.stringify(defaultMsg));
                }}
                title="Reset Chat"
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Start Chips (only when 1 message) */}
              {messages.length === 1 && (
                <div className="px-3 pt-3 pb-1 flex flex-wrap gap-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                  {QUICK_STARTS.map(({ label, icon }) => (
                    <button
                      key={label}
                      onClick={() => handleChip(label)}
                      className="flex items-center gap-1.5 bg-white border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 text-sm">
                {messages.map((msg, idx) => (
                  <div key={idx}>
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'bot' && (
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                          <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                        }`}>
                        <p className="leading-relaxed text-[13px]">
                          <FormattedText text={msg.text} />
                        </p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Quick Reply Chips after bot message */}
                    {msg.role === 'bot' && msg.suggestions?.length > 0 && idx === messages.length - 1 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                        {msg.suggestions.map(s => {
                          const isRemove = /^remove\b/i.test(s);
                          const isAdd = /^add\b/i.test(s);
                          const isClear = /^clear\b/i.test(s);
                          const isAction = /^(checkout|pay|apply)/i.test(s);
                          const isMenu = /^(show menu|view cart)/i.test(s);
                          const chipClass = isRemove
                            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                            : isAdd
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : isAction || isClear
                                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                : isMenu
                                  ? 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
                          const icon = isRemove ? '🗑️ ' : isAdd ? '🛒 ' : isAction ? '⚡ ' : isClear ? '🧨 ' : isMenu ? '📖 ' : '';
                          return (
                            <button
                              key={s}
                              onClick={() => handleChip(s)}
                              className={`text-xs border font-medium px-3 py-1 rounded-full transition-colors ${chipClass}`}
                            >
                              {icon}{s}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start items-end gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                      <span className="text-xs text-gray-400">AI is typing</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder='Try "show burgers under $15"...'
                  className="flex-1 bg-gray-100 text-gray-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(37,99,235,0); }
        }
      `}</style>
    </>
  );
}

'use client';

import { Package, Tag, Loader2 } from 'lucide-react';
import { Message, useChatbot } from './useChatbot';
import ChatProductCard from './ProductCard';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/** Renders **bold** markdown syntax and [Text](link) inside chat bubbles */
const FormattedText = ({ text }: { text: string }) => {
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
            return <Link key={i} href={m[2]} className="text-blue-200 hover:text-white underline font-medium">{display}</Link>;
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

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const { setCart } = useStore();
  const router = useRouter();
  const { sendMessage } = useChatbot();
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyVoucher = async (code: string) => {
    setIsApplying(true);
    try {
      const res = await api.post('/cart/voucher', { code });
      setCart(res.data.data.cart);
      toast.success('Voucher applied to your cart!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply voucher');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4`}>
      {/* Message bubble */}
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
        isUser
          ? 'bg-primary text-white rounded-br-none'
          : 'bg-white border border-border text-text-primary rounded-bl-none'
      }`}>
        <p className="whitespace-pre-wrap leading-relaxed">
          <FormattedText text={message.content} />
        </p>
      </div>

      {/* Action cards */}
      {!isUser && message.actions && message.actions.length > 0 && (
        <div className="mt-2 ml-2 space-y-2 max-w-[85%]">
          {message.actions.map((action, i) => {
            const actionType = action.type || action.action;
            if (action.action === 'navigate' && action.slug) {
              return <ChatProductCard key={i} slug={action.slug} />;
            }
            if ((action.action === 'applyVoucher' || action.type === 'APPLY_VOUCHER') && (action.code || action.voucher?.code)) {
              const code = action.code || action.voucher?.code;
              return (
                <div key={i} className="flex items-center justify-between bg-blue-50 border border-primary/20 p-3 rounded-xl">
                  <div className="flex items-center space-x-2 text-primary">
                    <Tag className="w-4 h-4" />
                    <span className="font-bold">{code}</span>
                  </div>
                  <button
                    onClick={() => handleApplyVoucher(code!)}
                    disabled={isApplying}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition font-medium flex items-center gap-1"
                  >
                    {isApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply to Cart'}
                  </button>
                </div>
              );
            }
            if (action.action === 'trackOrder' || action.type === 'TRACK_ORDER') {
              return (
                <button
                  key={i}
                  onClick={() => router.push('/account/orders')}
                  className="flex items-center space-x-2 text-xs bg-white border border-border px-3 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm text-text-primary"
                >
                  <Package className="w-4 h-4 text-text-secondary" />
                  <span className="font-medium">Track Order</span>
                </button>
              );
            }
            if (actionType === 'VIEW_CART' || actionType === 'OPEN_CHECKOUT') {
              const href = actionType === 'OPEN_CHECKOUT' ? '/checkout' : '/cart';
              const label = actionType === 'OPEN_CHECKOUT' ? 'Go to Checkout' : 'View Cart';
              return (
                <button
                  key={i}
                  onClick={() => router.push(href)}
                  className="flex items-center space-x-2 text-xs bg-primary text-white px-3 py-2 rounded-lg hover:opacity-90 transition font-medium"
                >
                  <Package className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              );
            }
            if (action.type === 'ORDER_TIMELINE') {
              const steps: string[] = action.steps || ['pending', 'processing', 'shipped', 'delivered'];
              const currentIdx = steps.findIndex((s: string) => s.toLowerCase() === (action.status || '').toLowerCase());
              return (
                <div key={i} className="bg-white border border-border rounded-xl p-3 my-2 max-w-[280px] shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-text-primary">Order #{action.orderId}</span>
                    <span className="text-xs font-bold text-primary">${action.total?.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2">
                    {steps.map((step: string, si: number) => {
                      const isDone = si < currentIdx;
                      const isCurrent = si === currentIdx;
                      return (
                        <div key={si} className="flex items-center space-x-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                            isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {isDone ? '✓' : si + 1}
                          </div>
                          <span className={`text-xs capitalize ${
                            isCurrent ? 'font-bold text-primary' : isDone ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {step}
                          </span>
                          {isCurrent && <span className="text-[10px] text-primary font-medium">← Now</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Suggestion chips */}
      {!isUser && message.suggestions && message.suggestions.length > 0 && (
        <div className="mt-2 ml-2 flex flex-wrap gap-1.5 max-w-[90%]">
          {message.suggestions.map((suggestion, i) => {
            const isRemove = /^remove\b/i.test(suggestion);
            const isAdd = /^add\b/i.test(suggestion);
            const isClear = /^clear\b/i.test(suggestion);
            const isAction = /^(checkout|pay|apply)/i.test(suggestion);
            const isMenu = /^(show menu|view cart|browse)/i.test(suggestion);
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
                key={i}
                onClick={() => sendMessage(suggestion, router)}
                aria-label={`Suggestion: ${suggestion}`}
                className={`text-[11px] border font-medium px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${chipClass}`}
              >
                {icon}{suggestion}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

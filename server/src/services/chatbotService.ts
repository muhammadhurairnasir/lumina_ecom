import Product from '../models/Product';
import Order from '../models/Order';
import Voucher from '../models/Voucher';
import Category from '../models/Category';
import redisClient from '../config/redis';
import mongoose from 'mongoose';

// ─── 1. SYNONYMS & DICTIONARIES ─────────────────────────────────────────────

const SYNONYMS: Record<string, string[]> = {
  electronics: ['electronics', 'gadget', 'tech', 'device', 'phone', 'laptop', 'computer', 'tablet', 'headphone', 'speaker'],
  fashion: ['fashion', 'clothing', 'clothes', 'shirt', 'dress', 'pants', 'shoes', 'bag', 'watch', 'accessory'],
  home: ['home', 'furniture', 'kitchen', 'decor', 'lamp', 'sofa', 'bed', 'chair', 'table'],
  accessories: ['accessories', 'jewellery', 'jewelry', 'belt', 'wallet', 'scarf', 'hat', 'cap'],
  vegan: ['vegan', 'plant-based', 'eco-friendly', 'sustainable', 'organic'],
  cheap: ['cheap', 'affordable', 'budget', 'low-cost', 'inexpensive', 'economical'],
};

const FAQ_DATA: Record<string, string> = {
  shipping: '🚚 **Shipping & Delivery:** We ship worldwide! Standard delivery takes 5-7 business days. Free shipping on orders over $50.',
  returns: '🔄 **Return Policy:** We accept returns within 30 days of purchase for a full refund. Items must be unused and in original packaging.',
  payment: '💳 **Payment Methods:** We accept all major credit/debit cards via Stripe, as well as PayPal.',
  hours: '🕒 **Customer Support Hours:** Available Monday–Friday, 9 AM to 6 PM.',
  contact: '📞 **Contact Us:** Email us at support@lumina.com or use the chat below!',
};

const WORD_NUMBERS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

// ─── 2. UTILITY FUNCTIONS ────────────────────────────────────────────────────

const getEditDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
};

const isFuzzyMatch = (query: string, targetPhrase: string): boolean => {
  const targetWords = targetPhrase.toLowerCase().split(/\s+/);
  query = query.toLowerCase();
  for (const tWord of targetWords) {
    if (tWord === query) return true;
    if (tWord.length > 4 && query.length > 4) {
      if (tWord.includes(query) || query.includes(tWord)) return true;
      if (getEditDistance(query, tWord) <= 2) return true;
    }
  }
  return false;
};

const extractCategories = (text: string): string[] => {
  const found = new Set<string>();
  const lower = text.toLowerCase();
  for (const [canon, syns] of Object.entries(SYNONYMS)) {
    for (const syn of syns) {
      if (new RegExp(`\\b${syn}s?\\b`).test(lower)) found.add(canon);
    }
  }
  return Array.from(found);
};

const SKIP_WORDS = new Set([
  'add', 'remove', 'delete', 'clear', 'show', 'find', 'search', 'get', 'want', 'order', 'put',
  'include', 'swap', 'replace', 'change', 'take', 'without', 'checkout', 'pay', 'view',
  'cart', 'my', 'me', 'the', 'a', 'an', 'some', 'any', 'and', 'or', 'please', 'now', 'just',
  'have', 'do', 'what', 'where', 'how', 'is', 'are', 'can', 'could', 'would', 'should',
  'track', 'status', 'delivery', 'popular', 'trending', 'best', 'recommend', 'suggest',
  'cheap', 'budget', 'under', 'below', 'coupon', 'promo', 'deal', 'code', 'discount',
  'stars', 'rating', 'rated', 'top', 'highly', 'shipping', 'return', 'refund', 'hours', 'pay',
]);

interface ProductDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  category?: any;
  rating?: number;
  stock?: number;
  isActive?: boolean;
  description?: string;
  images?: string[];
}

interface Target {
  type: 'specific' | 'category';
  product?: ProductDoc;
  category?: string;
  quantity: number;
}

const extractTargetTokens = (text: string, allProducts: ProductDoc[]): Target[] => {
  const tokens = text.toLowerCase().match(/\w+/g) || [];
  const targets: Target[] = [];
  let currentQty = 1;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    if (WORD_NUMBERS[word]) { currentQty = WORD_NUMBERS[word]; continue; }
    if (!isNaN(parseInt(word))) { currentQty = parseInt(word); continue; }
    if (SKIP_WORDS.has(word)) continue;

    const twoWord = i < tokens.length - 1 ? `${word} ${tokens[i + 1]}` : null;
    let matchedItem: ProductDoc | undefined;
    if (twoWord) matchedItem = allProducts.find(p => p.name.toLowerCase().includes(twoWord));
    if (!matchedItem) matchedItem = allProducts.find(p => p.name.toLowerCase().includes(word));
    if (!matchedItem && word.length > 4) matchedItem = allProducts.find(p => isFuzzyMatch(word, p.name));

    let matchedCategory: string | null = null;
    if (!matchedItem) matchedCategory = Object.keys(SYNONYMS).find(canon => SYNONYMS[canon].includes(word)) || null;

    if (matchedItem) {
      targets.push({ type: 'specific', product: matchedItem, quantity: currentQty });
      if (twoWord && matchedItem.name.toLowerCase().includes(twoWord)) i++;
      currentQty = 1;
    } else if (matchedCategory) {
      targets.push({ type: 'category', category: matchedCategory, quantity: currentQty });
      currentQty = 1;
    }
  }
  return targets;
};

const extractPrice = (text: string): number | null => {
  const match = text.match(/(?:under|below|less than|max|budget|\$)\s?(\d+(\.\d+)?)/);
  if (match) return parseFloat(match[1]);
  const alt = text.match(/\b(?:for|under)\s(\d+)\b/);
  return alt ? parseFloat(alt[1]) : null;
};

const extractRating = (text: string): number | null => {
  const match = text.match(/(\d)(\s?stars?| rating)/);
  return match ? parseInt(match[1]) : null;
};

const buildOrderTimeline = (order: any): string => {
  const steps = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const currentIdx = steps.findIndex(s => s.toLowerCase() === (order.orderStatus || order.status || '').toLowerCase());
  return steps.map((step, i) =>
    i < currentIdx ? `✅ ${step}` :
    i === currentIdx ? `🔄 **${step}** ← You are here` :
    `⬜ ${step}`
  ).join('\n');
};

const getLiveVouchers = async () => {
  try {
    const now = new Date();
    return await Voucher.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).limit(5).lean();
  } catch { return []; }
};

// ─── 3. CHAT SESSION MEMORY (Redis) ─────────────────────────────────────────

const MEMORY_TTL = 7200;

export const getChatHistory = async (sessionId: string): Promise<any[]> => {
  const data = await redisClient.get(`chat:${sessionId}`);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
};

export const saveChatHistory = async (sessionId: string, messages: any[]) => {
  await redisClient.setex(`chat:${sessionId}`, MEMORY_TTL, JSON.stringify(messages.slice(-20)));
};

export const clearChatHistory = async (sessionId: string) => {
  await redisClient.del(`chat:${sessionId}`);
};

// ─── 4. MAIN NLP ROUTER ──────────────────────────────────────────────────────

export const processChatMessage = async (
  sessionId: string,
  userMessage: string,
  context: {
    userId?: string;
    userName?: string;
    cartItems?: any[];
    cartSubtotal?: number;
  }
): Promise<{ reply: string; suggestions: string[]; actions: any[] }> => {

  const lowerMsg = userMessage.toLowerCase().trim();
  let reply = '';
  const suggestions: string[] = [];
  const actions: any[] = [];

  // Load all active products
  const allProducts: ProductDoc[] = await Product.find({ isActive: true })
    .select('name slug price compareAtPrice category rating stock description images')
    .populate('category', 'name slug')
    .lean() as any;

  // ── Intent flags ──────────────────────────────────────────────────────────
  const isOrderTrack = /\b(track|where.*(my|is)|status|history|past|orders?|previous|shipped|package|what did i (buy|purchase|get)|ready)\b/.test(lowerMsg) && !/order.*product/.test(lowerMsg);
  const isFAQ = /\b(shipping|delivery|deliver|arrive|eta|refund|return|policy|how.*pay|payment|pay |pay\?|hours|open|close|closing|when.*open|contact|phone|email|cash|card|stripe|accepted)\b/.test(lowerMsg);
  const isSearch = /show me|find|search|looking for|want|i need|do you have|what products/.test(lowerMsg);
  const isBudget = /under|below|less than|cheap|budget|affordable/.test(lowerMsg);
  const isRemove = /\b(remove|delete|take out|without|no )\b/.test(lowerMsg);
  const isClear = /clear.{0,5}cart|empty.{0,5}cart|wipe.{0,5}cart|reset.{0,5}cart/.test(lowerMsg);
  const isViewCart = /\b(view cart|show cart|my cart|what'?s in my cart)\b/.test(lowerMsg);
  const isCheckout = !isClear && !isViewCart && /\b(checkout|pay now|pay for|order now|finish order)\b/.test(lowerMsg);
  const isCoupon = /coupon|discount|promo|code|voucher|offer|deal|cheaper|save money|redeem|apply\s([a-z0-9]+)/.test(lowerMsg);
  const isTrending = /recommend|suggest|what.*good|popular|trending|best|favorite|special/.test(lowerMsg);
  const isPairing = /also bought|goes.{0,8}with|pair|recommend with|similar/.test(lowerMsg);
  const isRating = /top rated|highly rated|best rated|best reviewed|\d\s?stars?/.test(lowerMsg);
  const isCheapest = /\b(cheapest|lowest price|least expensive)\b/.test(lowerMsg);
  const isExpensive = /\b(most expensive|priciest|highest price)\b/.test(lowerMsg);
  const isAdd = /\b(add|put|include|throw in|insert|give me|buy a|buy some)\b/.test(lowerMsg);
  const hasExplicitCartIntent = isAdd || isRemove;

  const targets = extractTargetTokens(lowerMsg, allProducts);
  const priceLimit = extractPrice(lowerMsg);
  const ratingLimitFromText = extractRating(lowerMsg);
  const ratingLimit = ratingLimitFromText || (isRating ? 4 : null);
  const extractedCategories = extractCategories(lowerMsg);

  const applyFilters = (baseProducts: ProductDoc[]) => {
    let f = [...baseProducts];
    if (priceLimit) f = f.filter(p => p.price <= priceLimit);
    if (ratingLimit) {
      const threshold = ratingLimit >= 5 ? 4.7 : ratingLimit - 0.3;
      f = f.filter(p => (p.rating || 4.5) >= threshold);
    }
    if (extractedCategories.length > 0) {
      f = f.filter(p => {
        const catName = (p.category as any)?.name?.toLowerCase() || '';
        const catSlug = (p.category as any)?.slug?.toLowerCase() || '';
        return extractedCategories.some(c => catName.includes(c) || catSlug.includes(c) || p.name.toLowerCase().includes(c));
      });
    }
    return f;
  };

  const formatProducts = (items: ProductDoc[]) =>
    items.map(i => `• [**${i.name}**](/products/${i.slug}) — $${i.price.toFixed(2)}${i.compareAtPrice ? ` ~~$${i.compareAtPrice.toFixed(2)}~~` : ''}`).join('\n');

  // ── Cart actions ────────────────────────────────────────────────────────
  if (targets.length > 0 && hasExplicitCartIntent) {
    const added: any[] = [];
    const removed: any[] = [];

    targets.forEach(target => {
      if (target.type === 'specific' && target.product) {
        const isRemoving = isRemove && !isAdd;
        const productIdStr = target.product._id.toString();
        
        if (isRemoving) {
          if (!removed.some(r => r._id.toString() === productIdStr)) {
            removed.push(target.product);
            actions.push({ type: 'REMOVE_FROM_CART', itemId: target.product._id });
          }
        } else {
          if (!added.some(a => a.item._id.toString() === productIdStr)) {
            added.push({ item: target.product, quantity: target.quantity });
            actions.push({ type: 'ADD_TO_CART', item: target.product, quantity: target.quantity });
          }
        }
      }
    });

    if (added.length > 0 || removed.length > 0) {
      let msg = '';
      if (removed.length > 0) msg += `🗑️ Removed ${removed.map(r => `[**${r.name}**](/products/${r.slug})`).join(', ')}. `;
      if (added.length > 0) msg += `🛒 Added ${added.map(a => `${a.quantity}x [**${a.item.name}**](/products/${a.item.slug})`).join(', ')} to your cart!`;
      reply = msg;
      
      if (added.length > 0 && removed.length === 0) {
        suggestions.push(...added.slice(0, 2).map(a => `Remove ${a.item.name}`), 'View Cart', 'Show more products');
      } else if (removed.length > 0 && added.length === 0) {
        suggestions.push(...removed.slice(0, 2).map(r => `Add ${r.name}`), 'View Cart', 'Show more products');
      } else {
        suggestions.push('View Cart', 'Checkout', 'Show more products');
      }
    }
  }

  if (isClear) {
    actions.push({ type: 'CLEAR_CART' });
    reply = (reply ? reply + '\n\n' : '') + `🗑️ Your cart has been cleared!`;
    suggestions.push('Browse products', 'Show trending');
  }

  if (isViewCart) {
    actions.push({ type: 'VIEW_CART' });
    reply += (reply ? '\n\n' : '') + `🛒 Opening your cart!`;
  }

  if (isCheckout) {
    actions.push({ type: 'OPEN_CHECKOUT' });
    reply += (reply ? '\n\n' : '') + `💳 Taking you to checkout!`;
  }

  // ── FAQ ──────────────────────────────────────────────────────────────────
  if (isFAQ && !isCheckout) {
    let faqReply = '';
    if (lowerMsg.match(/shipping|delivery|deliver|arrive|eta/)) faqReply = FAQ_DATA.shipping;
    else if (lowerMsg.match(/return|refund|policy/)) faqReply = FAQ_DATA.returns;
    else if (lowerMsg.match(/pay|payment|cash|card|stripe|accepted/)) faqReply = FAQ_DATA.payment;
    else if (lowerMsg.match(/close|closing|hours|open|when.*open/)) faqReply = FAQ_DATA.hours;
    else if (lowerMsg.match(/contact|phone|email/)) faqReply = FAQ_DATA.contact;
    if (faqReply) {
      reply += (reply ? '\n\n' : '') + faqReply;
      suggestions.push('Browse products', 'View Cart');
    }
  }

  // ── Order tracking ───────────────────────────────────────────────────────
  if (isOrderTrack) {
    if (!context.userId) {
      reply += (reply ? '\n\n' : '') + '🔐 Please **sign in** to track your orders.';
      suggestions.push('Sign In');
    } else {
      const isHistory = /\b(all|history|past|previous|orders|what did i)\b/.test(lowerMsg);
      const orders = await Order.find({ user: context.userId }).sort({ createdAt: -1 }).limit(isHistory ? 5 : 1).lean();
      if (orders.length === 0) {
        reply += (reply ? '\n\n' : '') + "You don't have any orders yet.";
        suggestions.push('Browse products');
      } else if (isHistory && orders.length > 1) {
        reply += (reply ? '\n\n' : '') + `📦 **Your Last ${orders.length} Orders:**\n\n${orders.map((o: any) => `• Order #${(o._id as any).toString().slice(-6)} — **${(o.orderStatus || '').toUpperCase()}** — $${o.total?.toFixed(2)}`).join('\n')}`;
        suggestions.push('Track latest order');
      } else {
        const latest: any = orders[0];
        reply += (reply ? '\n\n' : '') + `📦 **Latest Order** — $${latest.total?.toFixed(2)}\n\n${buildOrderTimeline(latest)}`;
        suggestions.push('Show all orders');
      }
    }
  }

  // ── Vouchers ─────────────────────────────────────────────────────────────
  if (isCoupon) {
    const vouchers: any[] = await getLiveVouchers();
    const codeMatch = lowerMsg.match(/apply\s+([a-z0-9]+)/i);
    const explicitCode = codeMatch ? vouchers.find(v => v.code.toLowerCase() === codeMatch[1].toLowerCase()) : null;

    if (explicitCode && /\b(apply|use|redeem)\b/.test(lowerMsg)) {
      actions.push({ type: 'APPLY_VOUCHER', voucher: explicitCode });
      reply += (reply ? '\n\n' : '') + `✨ Voucher **${explicitCode.code}** applied! ${explicitCode.type === 'percentage' ? `${explicitCode.value}% off` : `$${explicitCode.value} off`}`;
    } else if (vouchers.length > 0) {
      reply += (reply ? '\n\n' : '') + `🎟️ **Active Voucher Codes:**\n\n${vouchers.map((v: any) => `• **${v.code}** — ${v.type === 'percentage' ? `${v.value}% off` : `$${v.value} off`}${v.minOrderAmount > 0 ? ` (min $${v.minOrderAmount})` : ''}`).join('\n')}\n\nSay "apply [code]" to use one!`;
      suggestions.push(...vouchers.slice(0, 3).map((v: any) => `Apply ${v.code}`));
    } else {
      reply += (reply ? '\n\n' : '') + `🎟️ No active vouchers right now — check back soon!`;
    }
  }

  // ── Product search / filters ──────────────────────────────────────────────
  if (isSearch || isBudget || isRating || extractedCategories.length > 0 || isCheapest || isExpensive) {
    let filtered = applyFilters(allProducts);
    if (isExpensive) filtered = filtered.sort((a, b) => b.price - a.price);
    else filtered = filtered.sort((a, b) => a.price - b.price);

    if (filtered.length > 0) {
      const shown = (isCheapest || isExpensive) ? filtered.slice(0, 1) : filtered.slice(0, 8);
      const modeLabel = isExpensive ? 'most expensive ' : isCheapest ? 'cheapest ' : '';
      const catLabel = extractedCategories.length > 0 ? extractedCategories.join('/') : 'products';
      const priceNote = priceLimit ? ` under $${priceLimit}` : '';
      reply += (reply ? '\n\n' : '') + `🛍️ **Here are the ${modeLabel}${catLabel}${priceNote}:**\n\n${formatProducts(shown)}`;
      suggestions.push(...shown.slice(0, 3).map(i => `Add ${i.name}`));
    } else {
      reply += (reply ? '\n\n' : '') + `😕 No products match those filters. Want me to show what's popular?`;
      suggestions.push("What's popular?", 'Browse all products');
    }
  }

  // ── Trending ─────────────────────────────────────────────────────────────
  if (isTrending) {
    try {
      const trending = await Order.aggregate([
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productDetails' } },
        { $unwind: '$productDetails' },
        { $group: { _id: '$items.product', count: { $sum: '$items.quantity' }, name: { $first: '$items.name' }, slug: { $first: '$productDetails.slug' } } },
        { $sort: { count: -1 } },
        { $limit: 4 },
      ]);

      if (trending.length > 0) {
        reply += (reply ? '\n\n' : '') + `🔥 **Trending Right Now:**\n\n${trending.map((t: any, i: number) => `${i + 1}. [**${t.name}**](/products/${t.slug || t._id})`).join('\n')}`;
        suggestions.push(...trending.map((t: any) => `Show ${t.name}`));
      } else {
        // Fallback — highest rated products
        const topRated = allProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
        reply += (reply ? '\n\n' : '') + `⭐ **Top Rated Products:**\n\n${formatProducts(topRated)}`;
        suggestions.push(...topRated.slice(0, 3).map(i => `View ${i.name}`));
      }
    } catch { /* ignore */ }
  }

  // ── Pairing ──────────────────────────────────────────────────────────────
  if (isPairing && targets.length > 0) {
    const target = targets.find(t => t.type === 'specific');
    if (target?.product) {
      try {
        const coOrders = await Order.aggregate([
          { $match: { 'items.product': new mongoose.Types.ObjectId(target.product._id as any) } },
          { $unwind: '$items' },
          { $match: { 'items.product': { $ne: new mongoose.Types.ObjectId(target.product._id as any) } } },
          { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productDetails' } },
          { $unwind: '$productDetails' },
          { $group: { _id: '$items.product', count: { $sum: 1 }, name: { $first: '$items.name' }, slug: { $first: '$productDetails.slug' } } },
          { $sort: { count: -1 } },
          { $limit: 3 },
        ]);
        if (coOrders.length > 0) {
          reply += (reply ? '\n\n' : '') + `🤝 **People who bought ${target.product.name} also loved:**\n\n${coOrders.map((c: any) => `• [**${c.name}**](/products/${c.slug || c._id})`).join('\n')}`;
          suggestions.push(...coOrders.map((c: any) => `Add ${c.name}`));
        }
      } catch { /* ignore */ }
    }
  }

  // ── Categories list ───────────────────────────────────────────────────────
  if (/\b(categories|category|departments|sections|browse)\b/.test(lowerMsg)) {
    const cats = await Category.find({ isActive: true }).select('name slug').lean();
    if (cats.length > 0) {
      reply += (reply ? '\n\n' : '') + `📂 **Shop by Category:**\n\n${cats.map((c: any) => `• [${c.name}](/products?category=${c.slug})`).join('\n')}`;
    }
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  if (reply === '') {
    if (context.cartItems && context.cartItems.length > 0) {
      reply = `👋 Hi${context.userName ? ` ${context.userName}` : ''}! You have **${context.cartItems.length} item(s)** in your cart.\n\nReady to checkout, or still browsing?`;
      suggestions.push('Checkout', 'Clear cart', "What's trending?");
    } else {
      reply = `👋 Hi${context.userName ? ` ${context.userName}` : ''}! I'm your Lumina shopping assistant.\n\nI can help you:\n• 🔍 **Find products** (e.g. "Show me electronics under $100")\n• 📦 **Track orders** (e.g. "Where is my order?")\n• 🎟️ **Apply vouchers** (e.g. "Do you have any discount codes?")\n• 🔥 **See what's trending**\n• ❓ **Answer FAQs** about shipping, returns, payment\n\nWhat can I help you with?`;
      suggestions.push("What's trending?", 'Electronics under $100', 'Track my order', 'Shipping policy');
    }
  }

  // Universal Suggestion Safety Net
  if (suggestions.length === 0) {
    if (context.cartItems && context.cartItems.length > 0) {
      suggestions.push('View Cart', 'Checkout', 'Clear cart');
    } else {
      suggestions.push('Browse products', "What's trending?", 'Track my order');
    }
  }

  // Deduplicate suggestions
  const finalSuggestions = [...new Set(suggestions)].slice(0, 6);

  // Save to session memory
  const history = await getChatHistory(sessionId);
  history.push({ role: 'user', content: userMessage }, { role: 'assistant', content: reply });
  await saveChatHistory(sessionId, history);

  return { reply, suggestions: finalSuggestions, actions };
};

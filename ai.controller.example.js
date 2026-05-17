import { successResponse, errorResponse } from '../utils/responseHandler.js';
import Product from '../models/Product.model.js';
import Order from '../models/Order.model.js';
import Coupon from '../models/Coupon.model.js';
import mongoose from 'mongoose';

// ─── 1. SYNONYMS & DICTIONARIES ────────────────────────────────────────────────

const SYNONYMS = {
  burger: ['burger', 'hamburger', 'cheeseburger', 'slider', 'patty', 'whopper', 'smashburger', 'burgr', 'cheesesebaarger'],
  pizza: ['pizza', 'slice', 'pie', 'margherita', 'pepperoni', 'crust', 'piza'],
  fries: ['fries', 'fry', 'chips', 'potato', 'wedges', 'poutine'],
  drink: ['drink', 'soda', 'pop', 'coke', 'beverage', 'water', 'juice', 'cola', 'pepsi', 'sprite'],
  salad: ['salad', 'greens', 'lettuce', 'bowl', 'caesar'],
  dessert: ['dessert', 'sweet', 'cake', 'ice cream', 'cookie', 'brownie', 'treat', 'shake'],
  wrap: ['wrap', 'sandwich', 'sub', 'hoagie', 'burrito', 'shawarma', 'gyro'],

  vegan: ['vegan', 'plant-based', 'dairy-free', 'no meat', 'meatless'],
  vegetarian: ['vegetarian', 'veggie'],
  gluten_free: ['gluten-free', 'gf', 'celiac', 'no wheat'],
  halal: ['halal', 'zabiha'],
};

const FAQ_DATA = {
  shipping: "🚚 **Shipping & Delivery:** We deliver across the city! Average delivery time is 30-45 minutes depending on traffic. Delivery is FREE for orders over $30.",
  returns: "🔄 **Return Policy:** Orders can be cancelled before preparation starts for a full refund. If there is an issue with your food, please contact us within 1 hour for a replacement or refund.",
  payment: "💳 **Payment Methods:** We accept all major credit cards via Stripe, Apple Pay, Google Pay, and Cash on Delivery.",
  hours: "🕒 **Opening Hours:** We are open daily from 10:00 AM to 11:30 PM.",
  contact: "📞 **Contact Us:** You can reach us at +1 (555) 012-3456 or email support@resova.com"
};

const WORD_NUMBERS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

// ─── 2. UTILITY FUNCTIONS ──────────────────────────────────────────────────────

const getEditDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
    }
  }
  return matrix[b.length][a.length];
};

const isFuzzyMatch = (query, targetPhrase) => {
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

const extractCategories = (text) => {
  const found = new Set();
  const lower = text.toLowerCase();
  for (const [canon, syns] of Object.entries(SYNONYMS)) {
    for (const syn of syns) {
      // Match plural forms too (e.g. 'burgers', 'pizzas', 'fries')
      if (new RegExp(`\\b${syn}s?\\b`).test(lower)) found.add(canon);
    }
  }
  return Array.from(found);
};

const SKIP_WORDS = new Set([
  'add', 'remove', 'delete', 'clear', 'empty', 'show', 'find', 'search', 'get', 'want', 'order', 'put',
  'include', 'swap', 'instead', 'replace', 'change', 'take', 'without', 'checkout', 'pay', 'view',
  'cart', 'my', 'me', 'the', 'a', 'an', 'some', 'any', 'and', 'or', 'please', 'now', 'just', 'all',
  'have', 'do', 'what', 'where', 'how', 'is', 'are', 'can', 'could', 'would', 'should', 'track',
  'status', 'delivery', 'where', 'popular', 'trending', 'best', 'recommend', 'suggest', 'cheap',
  'budget', 'under', 'below', 'coupon', 'promo', 'deal', 'offer', 'code', 'discount', 'vegan', 'halal',
  'stars', 'rating', 'rated', 'top', 'highly', 'better', 'shipping', 'return', 'refund', 'hours', 'pay'
]);

const extractTargetTokens = (text, allProducts) => {
  const tokens = text.toLowerCase().match(/\w+/g) || [];
  const targets = [];
  let currentQty = 1;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    if (WORD_NUMBERS[word]) { currentQty = WORD_NUMBERS[word]; continue; }
    if (!isNaN(parseInt(word))) { currentQty = parseInt(word); continue; }
    if (SKIP_WORDS.has(word)) continue;

    const twoWord = i < tokens.length - 1 ? `${word} ${tokens[i + 1]}` : null;
    let matchedItem = null;
    if (twoWord) matchedItem = allProducts.find(p => p.name.toLowerCase().includes(twoWord));
    if (!matchedItem) matchedItem = allProducts.find(p => p.name.toLowerCase().includes(word));
    if (!matchedItem && word.length > 4) matchedItem = allProducts.find(p => isFuzzyMatch(word, p.name));

    let matchedCategory = null;
    if (!matchedItem) matchedCategory = Object.keys(SYNONYMS).find(canon => SYNONYMS[canon].includes(word));

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

const extractPrice = (text) => {
  const match = text.match(/(?:under|below|less than|max|budget|\$)\s?(\d+(\.\d+)?)/);
  if (match) return parseFloat(match[1]);
  // Fallback for "15 dollars" or "for 15"
  const alternative = text.match(/\b(?:for|under)\s(\d+)\b/);
  return alternative ? parseFloat(alternative[1]) : null;
};

const extractRating = (text) => {
  const match = text.match(/(\d)(\s?stars?| rating)/);
  return match ? parseInt(match[1]) : null;
};

const extractBrand = (text, allProducts) => {
  const brands = [...new Set(allProducts.map(p => p.brand?.toLowerCase()).filter(Boolean))];
  const found = brands.find(b => text.toLowerCase().includes(b));
  return found || null;
};

const buildOrderTimeline = (order) => {
  const steps = ['pending', 'shipped', 'delivered', 'cancelled'];
  const currentIdx = steps.findIndex(s => s.toLowerCase() === order.status.toLowerCase());
  return steps.map((step, i) => i < currentIdx ? `✅ ${step}` : i === currentIdx ? `🔄 **${step}** ← You are here` : `⬜ ${step}`).join('\n');
};

const formatItems = (items) => items.map(i => `• **${i.name}** — $${i.price.toFixed(2)}${i.brand ? ` (${i.brand})` : ''}`).join('\n');

const getLiveCoupons = async (restaurantId) => {
  try {
    const now = new Date();
    return await Coupon.find({ restaurantId, isActive: true, validFrom: { $lte: now }, validUntil: { $gte: now }, $or: [{ usageLimit: null }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }] }).limit(5);
  } catch { return []; }
};

// ─── 3. MAIN CHAT HANDLER (NLP Router) ───────────────────────────────────────

export const handleChat = async (req, res) => {
  try {
    const { message, restaurantId, customerId, cart = [] } = req.body;
    const lowerMsg = message.toLowerCase().trim();
    let reply = '';
    let suggestions = [];
    let actions = [];

    const allProducts = await Product.find({ restaurantId, availability: true });

    // NLP intent flags
    const isOrderTrack = /\b(track|where.*(my|is)|status|history|past|orders?|previous|shipped|package|what did i (buy|purchase|get)|ready)\b/.test(lowerMsg) && !/order.*pizza|order.*burger/.test(lowerMsg);
    const isFAQ = /\b(shipping|delivery|deliver|arrive|eta|refund|return|policy|how.*pay|payment|pay |pay\?|hours|open|close|closing|when.*open|contact|phone|email|cash|card|stripe|apple|crypto|accepted)\b/.test(lowerMsg);
    const isSearch = /show me|find|search|looking for|want|i need|do you have/.test(lowerMsg);
    const isBudget = /under|below|less than|cheap|budget|affordable/.test(lowerMsg);
    const isRemove = /\b(remove|delete|take out|without|no )\b/.test(lowerMsg);
    const isClear = /clear.{0,5}cart|empty.{0,5}cart|wipe.{0,5}cart|reset.{0,5}cart/.test(lowerMsg);

    const isCheckout = !isClear && (
      /\b(checkout|pay now|pay for|view cart|order now|finish order)\b/.test(lowerMsg) ||
      /open.*(cart|checkout|bag)|take me to (cart|checkout|payment|bag)|go to (cart|bag)|finish/.test(lowerMsg)
    );
    const isCoupon = /coupon|discount|promo|code|voucher|offer|deal|cheaper|save money|redeem|apply\s([a-z0-9]+)/.test(lowerMsg);
    const isTrending = /recommend|suggest|what.*good|popular|trending|best|favorite|special/.test(lowerMsg);
    const isPairing = /also bought|goes.{0,8}with|pair|recommend with|similar/.test(lowerMsg);
    const isRating = /top rated|highly rated|best rated|best reviewed|\d\s?stars?/.test(lowerMsg);
    const isCheapest = /\b(cheapest|lowest price|least expensive)\b/.test(lowerMsg);
    const isExpensive = /\b(most expensive|priciest|highest price)\b/.test(lowerMsg);

    const targets = extractTargetTokens(lowerMsg, allProducts);
    const priceLimit = extractPrice(lowerMsg);
    const ratingLimitFromText = extractRating(lowerMsg);
    const ratingLimit = ratingLimitFromText || (isRating ? 4 : null);
    const brandTarget = extractBrand(lowerMsg, allProducts);
    const extractedCategories = extractCategories(lowerMsg);

    const isAdd = /\b(add|put|include|throw in|insert|toss|give me|buy a|buy some)\b/.test(lowerMsg);
    const hasExplicitCartIntent = isAdd || isRemove;

    const applyFilters = (baseProducts) => {
      let f = [...baseProducts];
      if (priceLimit) f = f.filter(p => p.price <= priceLimit);
      if (ratingLimit) {
        // Lenient threshold: "5 stars" matches top-tier (4.7+), "4 stars" matches 3.7+
        const threshold = ratingLimit >= 5 ? 4.7 : ratingLimit - 0.3;
        f = f.filter(p => (p.rating || 4.5) >= threshold);
      }
      if (brandTarget) f = f.filter(p => p.brand?.toLowerCase() === brandTarget);

      const dietary = [];
      if (SYNONYMS.vegan.some(s => lowerMsg.includes(s))) dietary.push('vegan', 'plant-based');
      if (SYNONYMS.halal.some(s => lowerMsg.includes(s))) dietary.push('halal');
      if (SYNONYMS.gluten_free.some(s => lowerMsg.includes(s))) dietary.push('gluten-free');
      if (dietary.length > 0) f = f.filter(p => dietary.some(d => p.description?.toLowerCase().includes(d) || p.name.toLowerCase().includes(d)));
      if (extractedCategories.length > 0) f = f.filter(p => extractedCategories.some(c => p.category.toLowerCase().includes(c) || p.name.toLowerCase().includes(c)));
      return f;
    };

    // ── 1. COMPOUND CART ACTIONS ──────────────────────
    if (targets.length > 0 && hasExplicitCartIntent) {
      const added = [];
      const removed = [];
      targets.forEach((target) => {
        let itemPos = -1;
        
        if (target.type === 'specific') {
          // Identify EXACTLY where the item was matched in the string using synonyms
          const words = target.product.name.toLowerCase().split(/\s+/);
          const catSyns = SYNONYMS[target.product.category?.toLowerCase()] || [];
          const searchTerms = [...new Set([...words, ...catSyns])];
            
          for (const term of searchTerms) {
            const idx = lowerMsg.indexOf(term);
            const isMatchLen = term.length > 2 || (term === 'id' || term === 'xl');
            if (idx > -1 && isMatchLen) { itemPos = idx; break; }
          }
            
          if (itemPos > -1) {
            // Find ALL indices of add and remove intents in the whole string
            const addIdxs = [...lowerMsg.matchAll(/\b(add|put|include|throw in|give me|buy)\b/g)].map(m => m.index);
            const removeIdxs = [...lowerMsg.matchAll(/\b(remove|delete|without|no\s|take out|instead of)\b/g)].map(m => m.index);
            
            let isRemoving = false;
            
            if (removeIdxs.length > 0) {
              if (addIdxs.length === 0) {
                 isRemoving = true;
              } else {
                 // Determine which intent verb is strictly geographically closer to the Item name
                 const minRemoveDist = Math.min(...removeIdxs.map(i => Math.abs(i - itemPos)));
                 const minAddDist = Math.min(...addIdxs.map(i => Math.abs(i - itemPos)));
                 if (minRemoveDist < minAddDist) isRemoving = true;
              }
            }

            if (isRemoving && !removed.find(r => r.itemId === target.product._id)) {
              removed.push({ itemId: target.product._id, name: target.product.name, slug: target.product.seo?.slug || target.product._id });
              actions.push({ type: 'REMOVE_FROM_CART', itemId: target.product._id });
            } else if (!isRemoving && !added.find(a => a.item._id === target.product._id)) {
              added.push({ item: target.product, quantity: target.quantity, slug: target.product.seo?.slug || target.product._id });
              actions.push({ type: 'ADD_TO_CART', item: target.product, quantity: target.quantity });
            }
          }
        }
      });

      if (added.length > 0 || removed.length > 0) {
        let msg = '';
        if (removed.length > 0) msg += `🗑️ Removed ${removed.map(r => `[**${r.name}**](/item/${r.slug})`).join(', ')}. `;
        if (added.length > 0) msg += `🛒 Added ${added.map(a => `${a.quantity}x [**${a.item.name}**](/item/${a.slug})`).join(', ')}. `;
        reply = msg;

        // Context-aware suggestions based on what just happened
        if (added.length > 0 && removed.length === 0) {
          // Just added item(s) → offer to remove + go to cart/checkout
          suggestions = [
            ...added.slice(0, 2).map(a => `Remove ${a.item.name}`),
            'View Cart',
            'Show menu'
          ];
        } else if (removed.length > 0 && added.length === 0) {
          // Just removed item(s) → offer to undo + explore more
          suggestions = [
            ...removed.slice(0, 2).map(r => `Add ${r.name}`),
            'View Cart',
            'Show menu'
          ];
        } else {
          // Mixed add + remove → go to cart
          suggestions = ['View Cart', 'Checkout', 'Recommend sides'];
        }
      }
    }

    if (isClear) {
      actions.push({ type: 'CLEAR_CART' });
      reply = (reply ? reply + '\n\n' : '') + `🗑️ Your cart has been cleared!`;
      suggestions.push('Show menu', 'Recommend something');
    }

    if (isCheckout) {
      actions.push({ type: 'OPEN_CHECKOUT' });
      reply += (reply ? '\n\n' : '') + `💳 I've popped open your checkout drawer!`;
      suggestions.push('Show menu', 'Clear my cart');
    }

    if (isFAQ) {
      let faqReply = '';
      if (lowerMsg.match(/shipping|delivery|deliver|arrive|eta/)) faqReply = FAQ_DATA.shipping;
      else if (lowerMsg.match(/return|refund|policy/)) faqReply = FAQ_DATA.returns;
      else if (lowerMsg.match(/pay|payment|cash|card|stripe|apple|crypto|accepted/)) faqReply = FAQ_DATA.payment;
      else if (lowerMsg.match(/close|closing|hours|open|when.*open/)) faqReply = FAQ_DATA.hours;
      else if (lowerMsg.match(/contact|phone|email/)) faqReply = FAQ_DATA.contact;

      if (faqReply) {
        reply += (reply ? '\n\n' : '') + faqReply;
        suggestions.push('Checkout', 'View Cart');
      }
    } else if (targets.length === 0 && isAdd && !isClear && !isCheckout && !isOrderTrack) {
      reply += (reply ? '\n\n' : '') + `🍽️ What would you like to add? Simply tell me the item name, or ask to "show the menu".`;
      suggestions.push('Show menu');
    } else if (targets.length === 0 && isRemove && !isClear && !isCheckout && !isOrderTrack) {
      if (cart && cart.length > 0) {
        reply += (reply ? '\n\n' : '') + `🍽️ What would you like to remove from your cart?`;
        suggestions.push('Clear cart');
      } else {
        reply += (reply ? '\n\n' : '') + `🛒 Your cart is already empty! There's nothing to remove.`;
        suggestions.push('Show menu', "What's trending?");
      }
    }

    if (isOrderTrack) {
      if (!customerId) {
        reply += (reply ? '\n\n' : '') + '🔐 Please **sign in** to track your past orders.';
        suggestions.push('Sign In', 'Browse Menu');
      } else {
        const isHistory = /\b(all|history|past|previous|orders|what did i (buy|purchase|get))\b/.test(lowerMsg);
        const limit = isHistory ? 5 : 3;
        const orders = await Order.find({ customerId, restaurantId }).sort({ createdAt: -1 }).limit(limit);

        if (orders.length === 0) reply += (reply ? '\n\n' : '') + "I couldn't find any past orders linked to your account yet.";
        else if (isHistory && orders.length > 1) {
          reply += (reply ? '\n\n' : '') + `📦 **Order History (Last ${orders.length}):**\n\n${orders.map(o => `• Order #${o._id.toString().slice(-4)} ($${o.totalAmount.toFixed(2)}) — **${o.status.toUpperCase()}**\n  *${o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}*`).join('\n\n')}`;
          suggestions.push('Track latest order', 'Reorder favorites');
        } else {
          const latest = orders[0];
          reply += (reply ? '\n\n' : '') + `📦 **Latest Order** — Total: $${latest.totalAmount.toFixed(2)}\n\n${buildOrderTimeline(latest)}\n\n**Items:**\n${latest.items.map(i => `• ${i.name} x${i.quantity}`).join('\n')}`;
          suggestions.push('Show all my orders', 'Reorder last order');
        }
      }
    }

    if (isCoupon) {
      const coupons = await getLiveCoupons(restaurantId);
      const explicitCoupon = coupons.find(c => lowerMsg.includes(c.code.toLowerCase()));
      if (explicitCoupon && /\b(apply|use|redeem)\b/.test(lowerMsg)) {
        actions.push({ type: 'APPLY_COUPON', coupon: explicitCoupon });
        reply += (reply ? '\n\n' : '') + `✨ Coupon **${explicitCoupon.code}** has been applied to your cart!`;
      } else if (/\b(apply|use|redeem)\b/.test(lowerMsg) && !explicitCoupon) {
        // User tried to apply a specific code that isn't valid/active
        reply += (reply ? '\n\n' : '') + `❌ Sorry, that coupon code isn't valid or has expired. ${coupons.length > 0 ? `Try one of our active codes: **${coupons.map(c => c.code).join(', ')}**` : 'Check back soon for new promotions!'}`;
      } else if (coupons.length > 0) {
        reply += (reply ? '\n\n' : '') + `🎟️ **Active Coupon Codes:**\n\n${coupons.map(c => `• **${c.code}** — ${c.discountType === 'percentage' ? `${c.discountValue}% off` : `$${c.discountValue} off`}${c.minOrderValue > 0 ? ` (min $${c.minOrderValue})` : ''}`).join('\n')}\n\nSay "apply [code]" and I'll apply it instantly!`;
        suggestions.push(...coupons.map(c => `Apply ${c.code}`));
      } else {
        reply += (reply ? '\n\n' : '') + `🎟️ No active promotions right now, but check back soon! We regularly offer discounts to our loyal customers.`;
      }
    }

    if (isSearch || isBudget || isRating || extractedCategories.length > 0 || brandTarget || isCheapest || isExpensive) {
      const formatItems = (items) => items.map(i => `• [**${i.name}**](/item/${i.seo?.slug || i._id}) — $${i.price.toFixed(2)}${i.brand ? ` (${i.brand})` : ''}`).join('\n');
      let filtered = applyFilters(allProducts);
      if (isExpensive) filtered = filtered.sort((a, b) => b.price - a.price);
      else filtered = filtered.sort((a, b) => a.price - b.price); // default cheapest first

      if (filtered.length > 0) {
        if (isCheapest || isExpensive) filtered = filtered.slice(0, 1);
        else filtered = filtered.slice(0, 15); // Show a healthy limit for the text
        const catLabel = extractedCategories.length > 0 ? extractedCategories.join('/') : (isRating ? 'top-rated items' : 'items');
        const priceNote = priceLimit ? ` under $${priceLimit}` : '';
        const ratingNote = ratingLimit ? ` with ${ratingLimit}+ stars` : '';
        const brandNote = brandTarget ? ` from ${brandTarget}` : '';
        const modeLabel = isExpensive ? 'most expensive ' : (isCheapest ? 'cheapest ' : '');
        reply += (reply ? '\n\n' : '') + `🍽️ **Here is the ${modeLabel}${catLabel}${brandNote}${priceNote}${ratingNote}:**\n\n${formatItems(filtered)}\n\nShall I add ${filtered.length === 1 ? 'it' : 'any'} to your cart?`;
        suggestions.push(...filtered.map(i => `Add ${i.name}`));
      } else {
        const catNote = extractedCategories.length > 0 ? ` for ${extractedCategories.join('/')}` : '';
        reply += (reply ? '\n\n' : '') + `I couldn't find any items matching those specific filters${catNote}. Want me to show our popular favorites instead?`;
        suggestions.push("What's popular?", 'Show menu');
      }
    }

    if (isPairing && targets.length > 0) {
      const target = targets.find(t => t.type === 'specific');
      if (target) {
        const coOrders = await Order.aggregate([
          { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId), 'items.product': new mongoose.Types.ObjectId(target.product._id) } },
          { $unwind: '$items' },
          { $match: { 'items.product': { $ne: new mongoose.Types.ObjectId(target.product._id) } } },
          { $group: { _id: '$items.product', count: { $sum: 1 }, name: { $first: '$items.name' } } },
          { $sort: { count: -1 } },
          { $limit: 3 }
        ]);
        if (coOrders.length > 0) reply += (reply ? '\n\n' : '') + `🤝 **People who ordered the ${target.product.name} also loved:**\n\n${coOrders.map(c => `• [**${c.name}**](/item/${c._id})`).join('\n')}`;
        else reply += (reply ? '\n\n' : '') + `The **${target.product.name}** is amazing on its own, but it pairs great with our sides!`;
        suggestions.push(...coOrders.map(c => `Add ${c.name}`));
      }
    } else if (isPairing && targets.length === 0) {
      reply += (reply ? '\n\n' : '') + `Tell me which item you want pairings for! (e.g. "What goes well with pizza?")`;
    }

    if (isTrending) {
      const trending = await Order.aggregate([
        { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', count: { $sum: '$items.quantity' }, name: { $first: '$items.name' }, price: { $first: '$items.price' } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]);
      if (trending.length > 0) {
        reply += (reply ? '\n\n' : '') + `🔥 **Trending favorites right now:**\n\n${trending.map((t, i) => `${i + 1}. [**${t.name}**](/item/${t._id}) ($${t.price.toFixed(2)})`).join('\n')}`;
        suggestions.push(...trending.map(t => `Add ${t.name}`));
      }
    }

    // ── FALLBACK & PROACTIVE REMINDERS ───────
    if (reply === '') {
      if (cart.length > 0) {
        reply = `👋 Welcome back! I noticed you have **${cart.length} item(s)** in your cart totaling **$${cart.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}**.\n\nReady to complete your order?`;
        suggestions.push('Checkout', 'Clear my cart', 'Recommend something');
      } else {
        reply = `👋 Hi! I've been upgraded to handle complex flows:\n\n• **Compound ordering** ("Add 2 burgers and open checkout")\n• **Order Tracker** ("Where is my order?")\n• **Dietary requests** ("Find me vegan options under $15")\n• **FAQs** ("What is your refund policy?")\n\nWhat are you hungering for?`;
        suggestions.push('Track my order', 'Show cheap vegan food', 'What is popular?');
      }
    }

    // ── UNIVERSAL SUGGESTION SAFETY NET ───────
    if (suggestions.length === 0) {
      if (cart && cart.length > 0) {
        suggestions.push('View Cart', 'Checkout', 'Recommend sides');
      } else {
        suggestions.push('Show menu', "What's popular?", 'Track my order');
      }
    }

    suggestions = [...new Set(suggestions)].slice(0, 20);
    await new Promise(resolve => setTimeout(resolve, 300));
    successResponse(res, 200, 'AI Response', { reply, suggestions, actions });
  } catch (error) {
    errorResponse(res, 500, error.message);
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const rId = new mongoose.Types.ObjectId(restaurantId);

    const trending = await Order.aggregate([
      { $match: { restaurantId: rId } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalOrdered: { $sum: '$items.quantity' } } },
      { $sort: { totalOrdered: -1 } },
      { $limit: 6 }
    ]);

    if (trending.length >= 2) {
      const ids = trending.map(t => t._id);
      const items = await Product.find({ _id: { $in: ids }, availability: true });
      return successResponse(res, 200, 'Trending', items);
    }

    const items = await Product.aggregate([{ $match: { restaurantId: rId, availability: true } }, { $sample: { size: 4 } }]);
    successResponse(res, 200, 'Fallback', items);
  } catch (error) {
    errorResponse(res, 500, error.message);
  }
};

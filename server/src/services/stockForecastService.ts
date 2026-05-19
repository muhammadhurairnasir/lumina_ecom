import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import SeasonalRule from '../models/SeasonalRule';

export function getCurrentSeason(month: number): string {
  if (month >= 1 && month <= 2) return "Post Holiday";
  if (month >= 3 && month <= 4) return "Spring";
  if (month >= 5 && month <= 8) return "Summer";
  if (month >= 9 && month <= 10) return "Autumn";
  if (month >= 11 && month <= 12) return "Holiday Season";
  return "Unknown";
}

export async function getSeasonalMultiplier(product: any, currentMonth: number, preFetchedRules?: any[]) {
  const rules = preFetchedRules || await SeasonalRule.find({ isActive: true });
  
  const evergreenTags = ["evergreen", "all-season", "classic", "basic", "essential"];
  const productTags = product.tags || [];
  const normalizedProductTags = productTags.map((t: string) => t.toLowerCase().trim());
  
  const isEvergreen = normalizedProductTags.some((t: string) => evergreenTags.includes(t));
  if (isEvergreen) {
    return { multiplier: 1.0, rules: ["Evergreen Product"], isEvergreen: true };
  }

  let finalMultiplier = 1.0;
  const matchedRuleNames: string[] = [];

  for (const rule of rules) {
    if (!rule.months.includes(currentMonth)) continue;

    const normalizedRuleTags = rule.tags.map((t: string) => t.toLowerCase().trim());
    const hasTagOverlap = normalizedRuleTags.some((rt: string) => normalizedProductTags.includes(rt));
    const hasCategoryOverlap = rule.categories.some((rc: any) => rc.toString() === product.category?.toString());
    const isGlobal = rule.tags.length === 0 && rule.categories.length === 0;

    if (hasTagOverlap || hasCategoryOverlap || isGlobal) {
      finalMultiplier *= rule.demandMultiplier;
      matchedRuleNames.push(rule.name);
    }
  }

  return {
    multiplier: matchedRuleNames.length > 0 ? Number(finalMultiplier.toFixed(2)) : 1.0,
    rules: matchedRuleNames,
    isEvergreen: false
  };
}

export async function calculateStockForecast(productId: string, allRules?: any[]) {
  const product = await Product.findById(productId).populate('category', 'name').lean() as any;
  if (!product) throw new Error('Product not found');

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const season = getCurrentSeason(currentMonth);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const recentOrders = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $unwind: '$items' },
    { $match: { 'items.product': new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, sold: { $sum: '$items.quantity' } } }
  ]);

  const totalQuantitySold = recentOrders[0]?.sold || 0;
  const baseDailySales = totalQuantitySold / 30;

  const seasonalResult = await getSeasonalMultiplier(product, currentMonth, allRules);
  const adjustedDailySales = baseDailySales * seasonalResult.multiplier;
  
  let daysOfStockLeft = 999;
  let forecastedStockoutDate = null;
  let status = 'no_sales';
  let statusReason = "No sales recorded in the last 30 days";

  if (adjustedDailySales > 0) {
    daysOfStockLeft = Math.floor(product.stock / adjustedDailySales);
    forecastedStockoutDate = new Date(Date.now() + daysOfStockLeft * 24 * 60 * 60 * 1000);
    
    if (daysOfStockLeft < 7) {
      status = 'critical';
      statusReason = `Only ${daysOfStockLeft} days of stock remaining — reorder immediately`;
    } else if (daysOfStockLeft <= 30) {
      status = 'low';
      statusReason = `Running low — consider restocking within 2 weeks`;
    } else if (daysOfStockLeft <= 180) {
      status = 'healthy';
      statusReason = `Stock levels are healthy for the next ${daysOfStockLeft} days`;
    } else {
      status = 'overstocked';
      statusReason = `Overstocked — consider promotions to move inventory`;
    }
  }

  let recommendedRestockQty = 0;
  if (status !== 'no_sales') {
    const target = adjustedDailySales * 90;
    const restock = Math.max(0, target - product.stock);
    recommendedRestockQty = Math.ceil(restock / 10) * 10;
  }
  
  if (status === 'no_sales' && product.stock < 10) {
    statusReason = `No recent sales, but only ${product.stock} units remain in stock — consider restocking`;
    recommendedRestockQty = 20; // minimum restock suggestion
  }

  return {
    productId: product._id.toString(),
    productName: product.name,
    productImage: product.images?.[0]?.url || '',
    category: product.category?.name || 'Uncategorized',
    currentStock: product.stock,
    baseDailySales: Number(baseDailySales.toFixed(2)),
    seasonalMultiplier: seasonalResult.multiplier,
    adjustedDailySales: Number(adjustedDailySales.toFixed(2)),
    daysOfStockLeft: Math.round(daysOfStockLeft),
    status,
    statusReason,
    recommendedRestockQty,
    activeSeasonalRules: seasonalResult.rules,
    isEvergreen: seasonalResult.isEvergreen,
    forecastedStockoutDate,
    currentSeason: season
  };
}

export async function getForecastForAllProducts() {
  const products = await Product.find({ isActive: true }).select('_id').lean();
  const allRules = await SeasonalRule.find({ isActive: true }).lean();
  
  const forecasts = await Promise.all(
    products.map(p => calculateStockForecast(p._id.toString(), allRules))
  );

  const priorityOrder: Record<string, number> = { critical: 0, low: 1, no_sales: 2, healthy: 3, overstocked: 4 };
  forecasts.sort((a, b) => {
    const aPriority = priorityOrder[a.status] ?? 3;
    const bPriority = priorityOrder[b.status] ?? 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.daysOfStockLeft - b.daysOfStockLeft;
  });

  const summary = {
    critical: forecasts.filter(f => f.status === 'critical').length,
    low: forecasts.filter(f => f.status === 'low').length,
    healthy: forecasts.filter(f => f.status === 'healthy').length,
    overstocked: forecasts.filter(f => f.status === 'overstocked').length,
    no_sales: forecasts.filter(f => f.status === 'no_sales').length,
    totalProducts: forecasts.length,
    currentSeason: getCurrentSeason(new Date().getMonth() + 1),
    generatedAt: new Date()
  };

  return { products: forecasts, summary };
}

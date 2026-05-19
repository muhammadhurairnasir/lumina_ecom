import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import SeasonalRule from '../models/SeasonalRule';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

const defaultRules = [
  { name: "Summer Fashion Boost", tags: ["t-shirt","shirt","shorts","summer","cotton","linen"], months: [5,6,7,8], demandMultiplier: 1.8, description: "Summer clothing sells 80% faster in warm months" },
  { name: "Winter Fashion Boost", tags: ["jacket","coat","sweater","hoodie","winter","wool","fleece"], months: [11,12,1,2], demandMultiplier: 1.9, description: "Winter clothing sells 90% faster in cold months" },
  { name: "Electronics Holiday Boost", tags: ["electronics","gadget","tech","laptop","phone","headphones"], months: [11,12], demandMultiplier: 2.2, description: "Electronics sell 120% faster during holiday season" },
  { name: "Home Living Spring Boost", tags: ["home","decor","furniture","lamp","organizer"], months: [3,4,5], demandMultiplier: 1.5, description: "Home products sell 50% faster in spring" },
  { name: "Accessories Summer Boost", tags: ["watch","sunglasses","bag","accessories"], months: [5,6,7,8], demandMultiplier: 1.6, description: "Accessories sell 60% faster in summer" },
  { name: "General Holiday Boost", tags: [], months: [11,12], demandMultiplier: 1.4, description: "All products sell 40% faster during holidays" },
  { name: "Post Holiday Slowdown", tags: [], months: [1,2], demandMultiplier: 0.6, description: "All products sell 40% slower after holidays" },
  { name: "Evergreen — No Seasonal Effect", tags: ["evergreen","all-season","classic","basic","essential"], months: [1,2,3,4,5,6,7,8,9,10,11,12], demandMultiplier: 1.0, description: "Products that sell consistently year-round with no seasonal variation" }
];

async function seedSeasonalRules() {
  console.log('\n🌱 Seeding Seasonal Rules...\n');
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    for (const rule of defaultRules) {
      const exists = await SeasonalRule.findOne({ name: rule.name });
      if (!exists) {
        await SeasonalRule.create(rule);
        console.log(`   ✓ Created rule: ${rule.name}`);
      } else {
        console.log(`   ⏭️  Skipped existing rule: ${rule.name}`);
      }
    }

    console.log('\n✅ Seasonal Rules seeding complete!');
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedSeasonalRules();

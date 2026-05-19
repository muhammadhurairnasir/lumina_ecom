/**
 * Lumina Store — Database Seed Script
 * Run with: node seed.js
 * Drops existing data and inserts fresh categories, products, vouchers, and admin user.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

// ─── SCHEMA INLINES (avoid TS import issues) ──────────────────────────────────

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String,
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String, slug: String, description: String,
  price: Number, compareAtPrice: Number,
  images: [{ url: String, publicId: String, alt: String }],
  category: mongoose.Schema.Types.ObjectId,
  tags: [String], stock: Number, sku: String, brand: String,
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  seoTitle: String, seoDescription: String,
  seoKeywords: [String],
  specifications: [{ key: String, value: String }],
  variants: [{ name: String, options: [{ label: String, price: Number, stock: Number }] }],
}, { timestamps: true });

productSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

const voucherSchema = new mongoose.Schema({
  code: String, type: String, value: Number,
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: Number, usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  usedBy: [], startDate: Date, endDate: Date,
  isActive: { type: Boolean, default: true },
  applicableCategories: [], applicableProducts: [],
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isEmailVerified: { type: Boolean, default: false },
  addresses: [],
  wishlist: [],
  refreshToken: String,
}, { timestamps: true });

// Drop cached models so seed schemas apply (avoids stale definitions in watch mode)
if (mongoose.models.Category) delete mongoose.models.Category;
if (mongoose.models.Product) delete mongoose.models.Product;
if (mongoose.models.Voucher) delete mongoose.models.Voucher;
if (mongoose.models.User) delete mongoose.models.User;
if (mongoose.models.Cart) delete mongoose.models.Cart;
if (mongoose.models.Order) delete mongoose.models.Order;
if (mongoose.models.Review) delete mongoose.models.Review;

const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Voucher = mongoose.model('Voucher', voucherSchema);
const User = mongoose.model('User', userSchema);

const cartSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, sessionId: String, items: [] }, { timestamps: true });
const orderSchema = new mongoose.Schema({ orderNumber: String }, { timestamps: true });
const reviewSchema = new mongoose.Schema({ product: mongoose.Schema.Types.ObjectId }, { timestamps: true });
const Cart = mongoose.model('Cart', cartSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);

// ─── SEED DATA ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Electronics',  slug: 'electronics',  description: 'Gadgets, devices and tech accessories', sortOrder: 1 },
  { name: 'Fashion',      slug: 'fashion',       description: 'Clothing, shoes and style essentials', sortOrder: 2 },
  { name: 'Home & Living',slug: 'home',          description: 'Furniture, decor and home essentials', sortOrder: 3 },
  { name: 'Accessories',  slug: 'accessories',   description: 'Bags, watches, jewellery and more',    sortOrder: 4 },
  { name: 'New Arrivals', slug: 'new',           description: 'Fresh drops and latest additions',     sortOrder: 5 },
  { name: 'Sale',         slug: 'sale',          description: 'Special deals and discounted items',   sortOrder: 6 },
];

// Verified Picsum photos (stable CDN URLs for Next.js image loader)
const IMG = (id, alt = 'Product image') => ({
  url: `https://picsum.photos/seed/${id}/600/600`,
  publicId: `picsum_${id}`,
  alt,
});

const buildProducts = (cats) => {
  const elec = cats.find(c => c.slug === 'electronics')._id;
  const fash = cats.find(c => c.slug === 'fashion')._id;
  const home = cats.find(c => c.slug === 'home')._id;
  const acc  = cats.find(c => c.slug === 'accessories')._id;
  const neww = cats.find(c => c.slug === 'new')._id;
  const sale = cats.find(c => c.slug === 'sale')._id;

  return [
    // ── Electronics ──────────────────────────────────────────────────────────
    {
      name: 'Pro Wireless Headphones',
      slug: 'pro-wireless-headphones',
      description: 'Premium over-ear noise-cancelling headphones with 40-hour battery life and studio-quality sound. Crystal-clear calls and ultra-comfortable memory foam ear cushions.',
      price: 149.99, compareAtPrice: 199.99,
      images: [IMG('1505740420928-5e560c06d30e'), IMG('1484704849700-f032a568e944')],
      category: elec, tags: ['headphones', 'wireless', 'audio', 'noise-cancelling'],
      stock: 45, sku: 'ELEC-HP-001', brand: 'SoundWave',
      rating: 4.8, reviewCount: 312, isFeatured: true,
      specifications: [
        { key: 'Battery Life', value: '40 hours' },
        { key: 'Connectivity', value: 'Bluetooth 5.3' },
        { key: 'Driver Size', value: '40mm' },
        { key: 'Noise Cancellation', value: 'Active (ANC)' },
      ],
      variants: [{ name: 'Color', options: [
        { label: 'Midnight Black', price: 149.99, stock: 20 },
        { label: 'Arctic White',  price: 149.99, stock: 15 },
        { label: 'Rose Gold',     price: 159.99, stock: 10 },
      ]}],
    },
    {
      name: 'Smart 4K Tablet Pro',
      slug: 'smart-4k-tablet-pro',
      description: 'Stunning 11-inch 4K AMOLED display tablet with a powerful octa-core processor. Perfect for creative professionals, students and entertainment.',
      price: 499.99, compareAtPrice: 649.99,
      images: [IMG('1544244015-0df4cec583dc'), IMG('1587033411099-1c35b49e8b5e')],
      category: elec, tags: ['tablet', 'amoled', '4k', 'android'],
      stock: 22, sku: 'ELEC-TAB-001', brand: 'NovaTech',
      rating: 4.6, reviewCount: 187, isFeatured: true,
      specifications: [
        { key: 'Display', value: '11" 4K AMOLED 120Hz' },
        { key: 'Processor', value: 'Octa-Core 3.0GHz' },
        { key: 'RAM', value: '8GB' },
        { key: 'Storage', value: '256GB (expandable)' },
        { key: 'Battery', value: '10,000 mAh' },
      ],
    },
    {
      name: 'USB-C Hub 12-in-1',
      slug: 'usb-c-hub-12-in-1',
      description: 'The ultimate laptop companion. Adds 12 ports including 4K HDMI, 100W PD charging, SD card reader, Gigabit Ethernet and 4 USB-A ports.',
      price: 69.99, compareAtPrice: 89.99,
      images: [IMG('1625842268584-8f3296236761')],
      category: elec, tags: ['hub', 'usb-c', 'adapter', 'laptop'],
      stock: 88, sku: 'ELEC-HUB-001', brand: 'NovaTech',
      rating: 4.7, reviewCount: 523,
      specifications: [
        { key: 'Ports', value: '12 (HDMI, USB-A x4, USB-C, SD, microSD, Ethernet, 3.5mm)' },
        { key: 'Max Resolution', value: '4K @ 60Hz' },
        { key: 'Charging Power', value: '100W PD' },
      ],
    },
    {
      name: 'Mechanical Gaming Keyboard',
      slug: 'mechanical-gaming-keyboard',
      description: 'Full-size RGB mechanical keyboard with tactile switches, per-key lighting, N-Key rollover, and a detachable braided cable.',
      price: 89.99,
      images: [IMG('1587829741301-dc798b83add3')],
      category: elec, tags: ['keyboard', 'gaming', 'mechanical', 'rgb'],
      stock: 34, sku: 'ELEC-KB-001', brand: 'KeyForge',
      rating: 4.5, reviewCount: 298,
      variants: [{ name: 'Switch Type', options: [
        { label: 'Blue (Clicky)',   price: 89.99, stock: 12 },
        { label: 'Red (Linear)',    price: 89.99, stock: 12 },
        { label: 'Brown (Tactile)', price: 89.99, stock: 10 },
      ]}],
    },
    {
      name: '27" 4K Monitor',
      slug: '27-inch-4k-monitor',
      description: 'Professional-grade 27-inch IPS 4K monitor with 99% sRGB coverage, 144Hz refresh rate, and USB-C connectivity. Perfect for designers and developers.',
      price: 379.99, compareAtPrice: 449.99,
      images: [IMG('1527443224154-c4a3942d3acf')],
      category: elec, tags: ['monitor', '4k', 'ips', 'usb-c'],
      stock: 18, sku: 'ELEC-MON-001', brand: 'VisionClear',
      rating: 4.7, reviewCount: 142, isFeatured: true,
      specifications: [
        { key: 'Resolution', value: '3840 × 2160 (4K UHD)' },
        { key: 'Panel', value: 'IPS, 144Hz' },
        { key: 'Color Coverage', value: '99% sRGB / 95% DCI-P3' },
        { key: 'Connectivity', value: '2× HDMI 2.1, DisplayPort 1.4, USB-C 65W' },
      ],
    },

    // ── Fashion ──────────────────────────────────────────────────────────────
    {
      name: 'Classic Crewneck Sweatshirt',
      slug: 'classic-crewneck-sweatshirt',
      description: 'Ultra-soft 400gsm heavyweight fleece crewneck. Crafted from organic cotton for a premium feel. Relaxed fit, perfect for layering.',
      price: 59.99, compareAtPrice: 79.99,
      images: [IMG('1556821840-3a63f8550d2e'), IMG('1503342394128-ac188486ad5d')],
      category: fash, tags: ['sweatshirt', 'cotton', 'casual', 'organic'],
      stock: 120, sku: 'FASH-SW-001', brand: 'Lumina Basics',
      rating: 4.6, reviewCount: 445, isFeatured: true,
      variants: [
        { name: 'Color', options: [
          { label: 'Stone Grey',   price: 59.99, stock: 40 },
          { label: 'Cream White',  price: 59.99, stock: 40 },
          { label: 'Charcoal',     price: 59.99, stock: 40 },
        ]},
        { name: 'Size', options: [
          { label: 'S',  price: 59.99, stock: 30 },
          { label: 'M',  price: 59.99, stock: 40 },
          { label: 'L',  price: 59.99, stock: 30 },
          { label: 'XL', price: 59.99, stock: 20 },
        ]},
      ],
    },
    {
      name: 'Slim-Fit Chino Trousers',
      slug: 'slim-fit-chino-trousers',
      description: 'Versatile slim-fit chinos made from a cotton-stretch blend. Comfortable for the office, weekends, or dinner out.',
      price: 69.99,
      images: [IMG('1473966968600-fa4ef9d0b34b')],
      category: fash, tags: ['trousers', 'chinos', 'slim-fit', 'stretch', 'classic'],
      stock: 80, sku: 'FASH-TR-001', brand: 'Lumina Basics',
      rating: 4.4, reviewCount: 231,
      variants: [{ name: 'Size', options: [
        { label: '30×30', price: 69.99, stock: 20 },
        { label: '32×32', price: 69.99, stock: 25 },
        { label: '34×32', price: 69.99, stock: 20 },
        { label: '36×32', price: 69.99, stock: 15 },
      ]}],
    },
    {
      name: 'Leather Chelsea Boots',
      slug: 'leather-chelsea-boots',
      description: 'Handcrafted genuine leather Chelsea boots with elastic side panels and a sturdy rubber sole. Classic silhouette that pairs with anything.',
      price: 189.99, compareAtPrice: 240.00,
      images: [IMG('1542291026-7eec264c27ff')],
      category: fash, tags: ['boots', 'leather', 'chelsea', 'shoes'],
      stock: 35, sku: 'FASH-BT-001', brand: 'Heritage Co.',
      rating: 4.8, reviewCount: 178, isFeatured: true,
      variants: [{ name: 'Size (EU)', options: [
        { label: '40', price: 189.99, stock: 7 },
        { label: '41', price: 189.99, stock: 8 },
        { label: '42', price: 189.99, stock: 10 },
        { label: '43', price: 189.99, stock: 10 },
      ]}],
    },

    // ── Home & Living ─────────────────────────────────────────────────────────
    {
      name: 'Minimalist Table Lamp',
      slug: 'minimalist-table-lamp',
      description: 'Elegant brushed brass table lamp with a linen shade. Dimmable touch control with 3 brightness levels. Adds warmth to any room.',
      price: 79.99, compareAtPrice: 109.99,
      images: [IMG('1565814329452-e5a5c3cd4e9a'), IMG('1513694203232-719a899a20c0')],
      category: home, tags: ['lamp', 'lighting', 'minimalist', 'brass'],
      stock: 42, sku: 'HOME-LMP-001', brand: 'LumenHaus',
      rating: 4.6, reviewCount: 204, isFeatured: true,
    },
    {
      name: 'Ceramic Pour-Over Coffee Set',
      slug: 'ceramic-pour-over-coffee-set',
      description: 'Hand-thrown ceramic pour-over dripper with matching carafe and two mugs. Brews a perfect 600ml pot. Microwave and dishwasher safe.',
      price: 54.99,
      images: [IMG('1495474472287-4d71bcdd2085')],
      category: home, tags: ['coffee', 'ceramic', 'pour-over', 'kitchen', 'evergreen'],
      stock: 60, sku: 'HOME-COF-001', brand: 'Terra Goods',
      rating: 4.9, reviewCount: 389,
    },
    {
      name: 'Linen Duvet Cover Set',
      slug: 'linen-duvet-cover-set',
      description: 'Pure French linen duvet cover and pillowcases. Pre-washed for softness from day one. Gets better with every wash. OEKO-TEX certified.',
      price: 129.99, compareAtPrice: 160.00,
      images: [IMG('1615529328331-f891759dee1e', 'Linen bedding')],
      category: home, tags: ['bedding', 'linen', 'duvet', 'oeko-tex'],
      stock: 28, sku: 'HOME-BED-001', brand: 'Terra Goods',
      rating: 4.7, reviewCount: 156,
      variants: [{ name: 'Size', options: [
        { label: 'King',  price: 149.99, stock: 10 },
        { label: 'Queen', price: 129.99, stock: 12 },
        { label: 'Full',  price: 119.99, stock: 6 },
      ]}],
    },

    // ── Accessories ──────────────────────────────────────────────────────────
    {
      name: 'Slim Leather Wallet',
      slug: 'slim-leather-wallet',
      description: 'Ultra-thin bifold wallet crafted from full-grain vegetable-tanned leather. Holds up to 8 cards plus cash. RFID blocking.',
      price: 44.99,
      images: [IMG('1627123423454-843a4d3d0b7c', 'Leather wallet')],
      category: acc, tags: ['wallet', 'leather', 'rfid', 'slim', 'evergreen'],
      stock: 95, sku: 'ACC-WL-001', brand: 'Heritage Co.',
      rating: 4.7, reviewCount: 521,
      variants: [{ name: 'Color', options: [
        { label: 'Tan',    price: 44.99, stock: 35 },
        { label: 'Black',  price: 44.99, stock: 35 },
        { label: 'Cognac', price: 44.99, stock: 25 },
      ]}],
    },
    {
      name: 'Canvas Tote Bag',
      slug: 'canvas-tote-bag',
      description: 'Heavy-duty 12oz canvas tote with reinforced handles and an interior zip pocket. Holds a 15" laptop. Ethically made.',
      price: 34.99,
      images: [IMG('1590874103328-eac38a683ce7')],
      category: acc, tags: ['bag', 'canvas', 'tote', 'laptop', 'evergreen'],
      stock: 110, sku: 'ACC-TOTE-001', brand: 'Lumina Basics',
      rating: 4.5, reviewCount: 312,
    },
    {
      name: 'Automatic Mechanical Watch',
      slug: 'automatic-mechanical-watch',
      description: '40mm stainless steel case with a genuine sapphire crystal dial window. 80-hour power reserve. Water resistant to 100m.',
      price: 299.99, compareAtPrice: 399.99,
      images: [IMG('1523275335684-37898b6baf30', 'Watch'), IMG('1524592114545-88080917736e', 'Watch detail')],
      category: acc, tags: ['watch', 'automatic', 'stainless-steel', 'sapphire', 'classic'],
      stock: 15, sku: 'ACC-WCH-001', brand: 'ChronoLux',
      rating: 4.9, reviewCount: 94, isFeatured: true,
      specifications: [
        { key: 'Case Diameter', value: '40mm' },
        { key: 'Crystal', value: 'Sapphire' },
        { key: 'Movement', value: 'Japanese Automatic (NH35A)' },
        { key: 'Water Resistance', value: '100m / 10ATM' },
        { key: 'Power Reserve', value: '72 hours' },
      ],
    },

    // ── New Arrivals ──────────────────────────────────────────────────────────
    {
      name: 'Ambient Smart Light Strip',
      slug: 'ambient-smart-light-strip',
      description: 'App-controlled RGBIC LED strip that creates stunning room ambiance. Syncs to music, 16 million colors, works with Alexa and Google Home.',
      price: 39.99,
      images: [IMG('1558618666-fcd25c85cd64')],
      category: neww, tags: ['led', 'smart', 'rgb', 'alexa', 'ambient'],
      stock: 75, sku: 'NEW-LED-001', brand: 'GlowTech',
      rating: 4.4, reviewCount: 218,
    },
    {
      name: 'Bamboo Desk Organizer',
      slug: 'bamboo-desk-organizer',
      description: 'Sustainably sourced bamboo desktop organizer with 6 compartments. Keeps your workspace tidy and looks great doing it.',
      price: 29.99,
      images: [IMG('1588854334120-3e5f6cfab60b', 'Desk organizer')],
      category: neww, tags: ['organizer', 'bamboo', 'desk', 'sustainable', 'evergreen'],
      stock: 62, sku: 'NEW-ORG-001', brand: 'Terra Goods',
      rating: 4.6, reviewCount: 145,
    },

    // ── Sale ─────────────────────────────────────────────────────────────────
    {
      name: 'Sport Running Sneakers',
      slug: 'sport-running-sneakers',
      description: 'Lightweight mesh upper with energy-return foam midsole. Breathable, responsive and built for daily running or casual wear.',
      price: 59.99, compareAtPrice: 99.99,
      images: [IMG('1542291026-7eec264c27ff')],
      category: sale, tags: ['sneakers', 'running', 'sport', 'foam'],
      stock: 50, sku: 'SALE-SNK-001', brand: 'TrailBlaze',
      rating: 4.3, reviewCount: 287,
      variants: [{ name: 'Size (EU)', options: [
        { label: '40', price: 59.99, stock: 10 },
        { label: '41', price: 59.99, stock: 12 },
        { label: '42', price: 59.99, stock: 15 },
        { label: '43', price: 59.99, stock: 13 },
      ]}],
    },
    {
      name: 'Portable Bluetooth Speaker',
      slug: 'portable-bluetooth-speaker',
      description: '360° room-filling sound in a compact waterproof body. 24-hour battery life, outdoor-ready, and pairs with two devices simultaneously.',
      price: 49.99, compareAtPrice: 79.99,
      images: [IMG('1608043152269-52ba85e02e73')],
      category: sale, tags: ['speaker', 'bluetooth', 'portable', 'waterproof'],
      stock: 38, sku: 'SALE-SPK-001', brand: 'SoundWave',
      rating: 4.4, reviewCount: 334,
    },
  ];
};

const VOUCHERS = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minOrderAmount: 30,
    usageLimit: 500,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: true,
  },
  {
    code: 'SAVE20',
    type: 'fixed',
    value: 20,
    minOrderAmount: 100,
    usageLimit: 200,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: true,
  },
  {
    code: 'FREESHIP',
    type: 'free_shipping',
    value: 0,
    minOrderAmount: 50,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: true,
  },
  {
    code: 'FLASH30',
    type: 'percentage',
    value: 30,
    minOrderAmount: 75,
    maxDiscount: 50,
    usageLimit: 100,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2027-12-31'),
    isActive: true,
  },
];

// ─── MAIN SEED FUNCTION ────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Lumina Store — Database Seed\n' + '─'.repeat(40));
  console.log(`📡 Connecting to: ${uri}`);

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  // ── Drop existing data ──────────────────────────────────────────────────
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Voucher.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log('   Categories, Products, Vouchers, Carts, Orders, Reviews cleared.\n');

  // ── Seed Categories ─────────────────────────────────────────────────────
  console.log('📂 Seeding categories...');
  const cats = await Category.insertMany(CATEGORIES);
  cats.forEach(c => console.log(`   ✓ ${c.name}`));

  // ── Seed Products ───────────────────────────────────────────────────────
  console.log('\n🛍️  Seeding products...');
  const productData = buildProducts(cats);
  const products = await Product.insertMany(productData);
  products.forEach(p => console.log(`   ✓ ${p.name} — $${p.price}`));

  // ── Seed Vouchers ───────────────────────────────────────────────────────
  console.log('\n🎟️  Seeding vouchers...');
  const vouchers = await Voucher.insertMany(VOUCHERS);
  vouchers.forEach(v => console.log(`   ✓ ${v.code} (${v.type === 'percentage' ? v.value + '%' : v.type === 'fixed' ? '$' + v.value + ' off' : 'Free Shipping'})`));

  // ── Ensure admin user ───────────────────────────────────────────────────
  console.log('\n👤 Ensuring admin user...');
  const existing = await User.findOne({ email: 'admin@lumina.com' });
  const adminPassword = 'Admin123!';
  const hash = await bcrypt.hash(adminPassword, 10);

  if (!existing) {
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@lumina.com',
      password: hash,
      role: 'admin',
      isEmailVerified: true,
      refreshToken: null,
    });
    console.log('   ✓ Created: admin@lumina.com / Admin123!');
  } else {
    await User.updateOne(
      { email: 'admin@lumina.com' },
      {
        $set: {
          password: hash,
          role: 'admin',
          isEmailVerified: true,
          refreshToken: null,
        },
      }
    );
    console.log('   ✓ Updated: admin@lumina.com (password reset to Admin123!)');
  }

  // Demo customer for storefront login tests
  const demoEmail = 'demo@lumina.com';
  const demoExists = await User.findOne({ email: demoEmail });
  if (!demoExists) {
    await User.create({
      firstName: 'Demo',
      lastName: 'Shopper',
      email: demoEmail,
      password: await bcrypt.hash('Demo1234!', 10),
      role: 'user',
      isEmailVerified: true,
    });
    console.log('   ✓ Created: demo@lumina.com / Demo1234!');
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(40));
  console.log(`✅ Seed complete!`);
  console.log(`   📂 ${cats.length} categories`);
  console.log(`   🛍️  ${products.length} products`);
  console.log(`   🎟️  ${vouchers.length} vouchers`);
  console.log(`   👤 admin@lumina.com / Admin123!`);
  console.log('\n🚀 Your store is ready. Run npm run dev to start!\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});

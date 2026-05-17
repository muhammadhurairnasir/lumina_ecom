/**
 * Lumina Store — Blog Seed Script
 * Run with: node seedBlog.js
 * Seeds initial blog posts for SEO and content marketing.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

if (mongoose.models.BlogPost) delete mongoose.models.BlogPost;

const blogPostSchema = new mongoose.Schema({
  title: String, slug: String, excerpt: String, content: String,
  coverImage: String, author: { type: String, default: 'Lumina Editorial' },
  category: String, tags: [String], readTime: Number,
  isPublished: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  seoTitle: String, seoDescription: String,
}, { timestamps: true });

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

const POSTS = [
  {
    title: '10 Ways to Style a Minimalist Home in 2026',
    slug: '10-ways-style-minimalist-home-2026',
    category: 'Home & Living',
    excerpt: 'Discover the top minimalist home décor trends of 2026 — from intentional furniture choices to curated lighting that transforms any space into a calm sanctuary.',
    readTime: 6,
    coverImage: 'https://picsum.photos/seed/minimalist-home/1200/630',
    tags: ['home decor', 'minimalism', 'interior design', 'lifestyle'],
    seoTitle: 'Minimalist Home Styling Guide 2026 | Lumina Living',
    seoDescription: 'Learn the top 10 minimalist home décor techniques for 2026. From curated furniture to ambient lighting — transform any room into a peaceful sanctuary.',
    content: `
<h2>Why Minimalism Is the Design Trend of 2026</h2>
<p>In an era of constant digital noise, our homes have become the last refuge of calm. Minimalist design is no longer just an aesthetic choice — it's a lifestyle philosophy that prioritises quality over quantity, intention over impulse.</p>

<h2>1. Choose a Neutral, Warm Palette</h2>
<p>Forget stark whites and greys. 2026 minimalism leans into warm beige, sand, and terracotta tones. These hues create warmth and comfort without visual clutter.</p>

<h2>2. Invest in One Statement Piece Per Room</h2>
<p>A beautifully crafted ceramic lamp, a sculptural chair, or a hand-woven rug — one hero piece anchors the room and replaces the need for five mediocre pieces.</p>

<h2>3. Embrace Natural Materials</h2>
<p>Bamboo, linen, stone, and solid oak bring texture and warmth. Our <a href="/products">Bamboo Desk Organizer</a> is a perfect example of how functional items can double as décor.</p>

<h2>4. Layer Your Lighting</h2>
<p>Great lighting is the secret weapon of every beautiful room. Use three layers: ambient (ceiling), task (desk/reading), and accent (decorative). Our <a href="/products">Minimalist Table Lamp</a> is a bestseller for exactly this reason.</p>

<h2>5. Declutter Ruthlessly — Keep Only What Serves You</h2>
<p>The KonMari philosophy remains timeless: only keep items that "spark joy." A clean surface does more for a room than any accessory.</p>

<h2>6. Use Negative Space Intentionally</h2>
<p>Empty space is not wasted space — it's breathing room for the eye. Don't feel the need to fill every shelf or corner.</p>

<h2>7. Incorporate Live Plants</h2>
<p>A single fiddle leaf fig or trailing pothos adds life, oxygen, and organic texture that no print or photo can replicate.</p>

<h2>8. Go For Concealed Storage</h2>
<p>Ottomans with storage, floating shelves with doors, and under-bed solutions keep daily items hidden without sacrificing accessibility.</p>

<h2>9. Choose Multi-Functional Furniture</h2>
<p>In smaller spaces, every item must earn its place. Sofa beds, extendable dining tables, and nesting side tables are your best allies.</p>

<h2>10. Let the Seasons Rotate Your Décor</h2>
<p>Instead of buying new items constantly, rotate a small collection of textiles, cushions, and plants with the seasons. Your space will always feel fresh with minimal spending.</p>

<h2>The Bottom Line</h2>
<p>Minimalist design in 2026 is about curating a life that reflects your values. Shop our <a href="/products?category=home">Home & Living Collection</a> for pieces that blend beauty with purpose.</p>
    `
  },
  {
    title: 'The Ultimate Guide to Wireless Audio in 2026',
    slug: 'ultimate-guide-wireless-audio-2026',
    category: 'Electronics',
    excerpt: 'From noise-cancelling headphones to audiophile-grade Bluetooth speakers — everything you need to know before upgrading your wireless audio setup this year.',
    readTime: 8,
    coverImage: 'https://picsum.photos/seed/wireless-audio/1200/630',
    tags: ['headphones', 'audio', 'technology', 'buying guide'],
    seoTitle: 'Best Wireless Audio Gear 2026 | Lumina Electronics Guide',
    seoDescription: 'Explore the best wireless headphones, earbuds, and Bluetooth speakers of 2026. Our experts compare specs, battery life, and sound quality to find the perfect fit.',
    content: `
<h2>Why Wireless Audio Has Never Been Better</h2>
<p>2026 marks a pivotal year for wireless audio. Bluetooth 5.3 is now standard, codec support (LDAC, aptX Lossless) is nearly universal, and battery life has crossed the 40-hour threshold for most flagship headphones. If you've been waiting for the right moment to upgrade — it's now.</p>

<h2>Understanding the Key Specs</h2>
<h3>Bluetooth Version</h3>
<p>Look for Bluetooth 5.2 or higher. It provides faster pairing, lower latency (crucial for video), and more stable connections across larger distances.</p>

<h3>Codec Support</h3>
<p>For Android users: LDAC offers near-lossless audio quality at 990 kbps. For Apple devices: AAC is still the gold standard. If you're a serious audiophile, look for aptX Lossless compatibility.</p>

<h3>Active Noise Cancellation (ANC)</h3>
<p>Not all ANC is created equal. The best systems use hybrid ANC (both feed-forward and feedback microphones) to block a broader range of frequencies, including low rumbles and mid-range voices.</p>

<h2>Our Top Recommendation: The Pro Wireless Headphones</h2>
<p>Our <a href="/products/pro-wireless-headphones">Pro Wireless Headphones</a> hit the sweet spot of all three: Bluetooth 5.3, LDAC support, and hybrid ANC with 40 hours battery life. They're the product our editorial team uses daily.</p>

<h2>The Best Use Cases for Wireless Speakers</h2>
<p>A <a href="/products/portable-bluetooth-speaker">Portable Bluetooth Speaker</a> is the go-to for outdoor gatherings, travel, or rooms where running cable is impractical. Look for IPX7 water resistance and a battery of at least 12 hours.</p>

<h2>Final Verdict</h2>
<p>For commuters: Over-ear ANC headphones. For gym-goers: True wireless earbuds with IP55+ rating. For home use: A quality Bluetooth speaker or a wired setup if you're a purist. Explore our full <a href="/products?category=electronics">Electronics range</a> to find your perfect match.</p>
    `
  },
  {
    title: 'How to Build a Capsule Wardrobe That Actually Works',
    slug: 'build-capsule-wardrobe-that-works',
    category: 'Fashion',
    excerpt: 'Stop buying clothes you never wear. A true capsule wardrobe built on quality basics gives you more outfit options with fewer pieces — and saves you money in the long run.',
    readTime: 7,
    coverImage: 'https://picsum.photos/seed/capsule-wardrobe/1200/630',
    tags: ['fashion', 'style', 'capsule wardrobe', 'sustainable fashion'],
    seoTitle: 'How to Build a Capsule Wardrobe in 2026 | Lumina Fashion Guide',
    seoDescription: 'Build a capsule wardrobe that works. Learn which 30 core pieces to invest in, how to mix and match them, and where to shop for quality basics that last.',
    content: `
<h2>What Is a Capsule Wardrobe?</h2>
<p>A capsule wardrobe is a curated collection of timeless, versatile pieces — typically 25–50 items — that work harmoniously together. The goal is to own fewer, better things, and to always have something to wear.</p>

<h2>The Core Principle: Versatility</h2>
<p>Every item you own must be able to pair with at least three other items in your wardrobe. If it can only work with one outfit, it's a costume, not a wardrobe staple.</p>

<h2>The 30 Essential Pieces</h2>
<h3>Tops (10 pieces)</h3>
<ul>
<li>3 classic white/grey/black t-shirts</li>
<li>2 quality button-up shirts (one white, one chambray)</li>
<li>1 fine-knit crewneck sweater</li>
<li>1 quality sweatshirt or hoodie</li>
<li>2 fitted turtlenecks</li>
<li>1 blazer (navy or camel)</li>
</ul>

<h3>Bottoms (8 pieces)</h3>
<ul>
<li>2 pairs of slim-fit chinos (one khaki, one navy)</li>
<li>1 dark-wash straight-leg jeans</li>
<li>1 pair of tailored trousers</li>
<li>1 pair of casual shorts</li>
<li>1 jogger or sweatpant</li>
<li>2 versatile skirts (midi and mini)</li>
</ul>

<h3>Footwear (7 pairs)</h3>
<ul>
<li>White leather sneakers</li>
<li>Chelsea boots (tan or black)</li>
<li>Loafers</li>
<li>Running/athletic shoes</li>
<li>Sandals</li>
<li>Formal Oxford or derby</li>
<li>Ankle boots</li>
</ul>

<h2>Quality Over Quantity</h2>
<p>A $120 crewneck sweatshirt from a quality brand will outlast three $30 alternatives. Our <a href="/products/classic-crewneck-sweatshirt">Classic Crewneck Sweatshirt</a> is made from heavyweight French terry and is designed to survive years of washing without losing its shape.</p>

<h2>The Rule of Thirds for Colour</h2>
<p>Build your wardrobe in thirds: one-third neutrals (black, white, grey, beige), one-third base colours (navy, camel, olive), and one-third accent colours (just 2–3 colours you love). This ensures everything mixes and matches.</p>

<h2>Where to Start</h2>
<p>Start with a wardrobe audit. Pull everything out and ask: "Have I worn this in the last 12 months?" If not, donate it. Then shop our <a href="/products?category=fashion">Fashion Collection</a> to fill the gaps with investment pieces.</p>
    `
  },
  {
    title: 'The Complete Guide to Setting Up a Productive Home Office',
    slug: 'complete-guide-productive-home-office',
    category: 'Lifestyle',
    excerpt: 'Whether you\'re fully remote or just working from home occasionally, a well-designed workspace can dramatically improve your focus, energy, and daily output.',
    readTime: 9,
    coverImage: 'https://picsum.photos/seed/home-office/1200/630',
    tags: ['productivity', 'home office', 'work from home', 'desk setup'],
    seoTitle: 'Productive Home Office Setup Guide 2026 | Lumina',
    seoDescription: 'Set up the perfect home office in 2026. From ergonomic desks to the right monitor and ambient lighting — our complete guide covers every detail for maximum productivity.',
    content: `
<h2>Why Your Home Office Setup Matters More Than You Think</h2>
<p>Research from Stanford University shows remote workers are 13% more productive — but only when their workspace is properly set up. The biggest barriers? Poor lighting, uncomfortable seating, and disorganised desks.</p>

<h2>The 5 Pillars of a Productive Home Office</h2>

<h3>1. The Right Desk</h3>
<p>Your desk is the foundation. Ideally, use a standing desk or a fixed desk at the correct height: when seated, your forearms should be parallel to the floor when typing. Minimum width: 120cm. Minimum depth: 60cm.</p>

<h3>2. Monitor Positioning</h3>
<p>Your monitor's top edge should be at or just below eye level, about 50–70cm from your face. Using a 27" 4K display (like our <a href="/products">4K Monitor</a>) drastically reduces eye strain and allows you to have multiple windows open simultaneously.</p>

<h3>3. Lighting</h3>
<p>Never sit with a window directly behind your screen (creates glare) or directly in front of you (creates silhouette and contrast issues). Natural light from the side is ideal. Supplement with a warm-toned desk lamp and cool-toned ambient lighting.</p>
<p>Our <a href="/products/minimalist-table-lamp">Minimalist Table Lamp</a> with adjustable colour temperature is a perfect addition — warm light for video calls, cooler light for focused deep work.</p>

<h3>4. Cable and Desk Management</h3>
<p>Cable chaos is a productivity killer — it fragments attention and looks unprofessional on video calls. Our <a href="/products/bamboo-desk-organizer">Bamboo Desk Organizer</a> keeps pens, notebooks, and small items in their place, while a cable management tray hides power strips and charging cables.</p>

<h3>5. Audio Quality</h3>
<p>For video calls, your audio matters more than your video. A good pair of headphones with a built-in microphone will dramatically improve how you come across on calls. Our <a href="/products/pro-wireless-headphones">Pro Wireless Headphones</a> include a high-quality call microphone and 40 hours battery life — perfect for long call days.</p>

<h2>The Overlooked Elements</h2>
<ul>
<li><strong>Temperature:</strong> 20–22°C is the optimal temperature for sustained cognitive work.</li>
<li><strong>Scent:</strong> Peppermint and rosemary essential oils are proven to improve alertness and memory.</li>
<li><strong>Noise:</strong> Brown noise or lo-fi music at 50–60dB supports deep focus. ANC headphones create this environment anywhere.</li>
</ul>

<h2>Build Your Perfect Setup</h2>
<p>Browse our curated selection of <a href="/products?category=electronics">electronics</a> and <a href="/products?category=home">home accessories</a> to complete your home office transformation.</p>
    `
  },
  {
    title: 'Smart Shopping: How to Get More Value From Every Purchase',
    slug: 'smart-shopping-get-more-value-every-purchase',
    category: 'Guide',
    excerpt: 'Learn the expert strategies behind savvy shopping — from timing your purchases right to stacking discount codes and identifying genuine quality over marketing hype.',
    readTime: 5,
    coverImage: 'https://picsum.photos/seed/smart-shopping/1200/630',
    tags: ['shopping tips', 'savings', 'deals', 'buying guide'],
    seoTitle: 'Smart Shopping Tips 2026: Get More Value from Every Purchase | Lumina',
    seoDescription: 'Discover expert smart shopping strategies for 2026. Learn when to buy, how to use voucher codes, identify real quality, and make every purchase count.',
    content: `
<h2>The Psychology of Smart Shopping</h2>
<p>The modern retail environment is engineered to make you spend impulsively. Flash sales, countdown timers, and "limited stock" notifications create artificial urgency. The first step to smart shopping is recognising these tactics.</p>

<h2>The 48-Hour Rule</h2>
<p>Before adding any non-essential item to your cart, close the tab and wait 48 hours. You'll find that 60–70% of impulse purchases no longer feel necessary after the initial excitement fades.</p>

<h2>Use Voucher Codes Strategically</h2>
<p>Never check out without searching for a discount code. At Lumina, we regularly release voucher codes like <strong>WELCOME10</strong> (10% off your first order) and seasonal promotions. Check our <a href="/products?category=sale">Sale section</a> for ongoing deals.</p>

<h2>How to Identify Real Quality</h2>
<h3>For Clothing:</h3>
<ul>
<li>Check the fabric composition: natural fibres (cotton, wool, linen) > synthetics</li>
<li>Look at the seam allowance: premium pieces have wider seams</li>
<li>Feel the weight: quality garments have substance</li>
</ul>

<h3>For Electronics:</h3>
<ul>
<li>Read independent reviews, not just brand marketing</li>
<li>Check the warranty length — confidence in a product shows in its warranty</li>
<li>Look for standardised certifications (CE, FCC, RoHS)</li>
</ul>

<h2>The Cost Per Use Formula</h2>
<p>Don't think about price. Think about <strong>cost per use</strong>: Price ÷ Estimated uses. A £200 coat worn 150 times costs £1.33/use. A £30 fast-fashion coat worn 8 times costs £3.75/use. The expensive option is actually cheaper.</p>

<h2>When to Buy vs. When to Wait</h2>
<ul>
<li><strong>Buy Now:</strong> When it's a genuine need, at a known-low price, with a reliable warranty.</li>
<li><strong>Wait:</strong> When a newer version is expected within 3 months, or when the item is available on an upcoming sale.</li>
</ul>

<h2>Start Shopping Smarter Today</h2>
<p>Browse Lumina with this mindset and you'll build a collection of genuinely excellent items that bring you value for years. Explore our <a href="/products">full catalogue</a> and remember to check for active voucher codes at checkout.</p>
    `
  }
];

async function seedBlog() {
  console.log('\n📰 Lumina Blog Seed');
  console.log('────────────────────────────────────────');

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  await BlogPost.deleteMany({});
  console.log('🗑️  Cleared existing blog posts\n');

  for (const post of POSTS) {
    await BlogPost.create({
      ...post,
      seoTitle: post.seoTitle || `${post.title} | Lumina Blog`,
      seoDescription: post.seoDescription || post.excerpt.slice(0, 160),
    });
    console.log(`   ✓ ${post.title}`);
  }

  console.log(`\n✅ Seeded ${POSTS.length} blog posts successfully!`);
  console.log('🚀 Visit http://localhost:3000/blog to see them live.\n');
  await mongoose.disconnect();
}

seedBlog().catch(err => { console.error(err); process.exit(1); });

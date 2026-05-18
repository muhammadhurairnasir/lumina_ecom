const mongoose = require('mongoose');
require('dotenv').config();

const updates = [
  {
    slug: 'minimalist-table-lamp',
    images: [
      { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_table_lamp_1', alt: 'Minimalist Table Lamp' },
      { url: 'https://images.unsplash.com/photo-1513506003901-1e6a35549bdb?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_table_lamp_2', alt: 'Table Lamp Detail' }
    ]
  },
  {
    slug: 'linen-duvet-cover-set',
    images: [
      { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_duvet_1', alt: 'Linen Duvet Cover Set' }
    ]
  },
  {
    slug: 'canvas-tote-bag',
    images: [
      { url: 'https://images.unsplash.com/photo-1544816565-aa8c1166648f?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_tote_1', alt: 'Canvas Tote Bag' }
    ]
  },
  {
    slug: 'leather-chelsea-boots',
    images: [
      { url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_boots_1', alt: 'Leather Chelsea Boots' }
    ]
  },
  {
    slug: 'slim-leather-wallet',
    images: [
      { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_wallet_1', alt: 'Slim Leather Wallet' }
    ]
  },
  {
    slug: 'automatic-mechanical-watch',
    images: [
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_watch_1', alt: 'Automatic Mechanical Watch' },
      { url: 'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_watch_2', alt: 'Watch Detail' }
    ]
  },
  {
    slug: 'ceramic-pour-over-coffee-set',
    images: [
      { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_coffee_1', alt: 'Ceramic Pour Over Coffee Set' }
    ]
  },
  {
    slug: 'ambient-smart-light-strip',
    images: [
      { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_led_1', alt: 'Ambient Smart Light Strip' }
    ]
  },
  {
    slug: 'sport-running-sneakers',
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_sneakers_1', alt: 'Sport Running Sneakers' }
    ]
  },
  {
    slug: 'bamboo-desk-organizer',
    images: [
      { url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_desk_1', alt: 'Bamboo Desk Organizer' }
    ]
  },
  {
    slug: 'classic-crewneck-sweatshirt',
    images: [
      { url: 'https://images.unsplash.com/photo-1556821840-3a63f8550d2e?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_sweatshirt_1', alt: 'Classic Crewneck Sweatshirt' },
      { url: 'https://images.unsplash.com/photo-1503342394128-c4c338ba1830?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_sweatshirt_2', alt: 'Sweatshirt Detail' }
    ]
  },
  {
    slug: 'slim-fit-chino-trousers',
    images: [
      { url: 'https://images.unsplash.com/photo-1473966968600-fa4ef9d0b34b?w=800&q=80&auto=format&fit=crop', publicId: 'unsplash_chinos_1', alt: 'Slim Fit Chino Trousers' }
    ]
  }
];

async function updateImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    for (const update of updates) {
      const result = await collection.updateOne(
        { slug: update.slug },
        { $set: { images: update.images } }
      );
      if (result.matchedCount > 0) {
        console.log(`✅ Updated: ${update.slug}`);
      } else {
        console.log(`⚠️  Not found: ${update.slug}`);
      }
    }

    console.log('\n✅ All product images updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateImages();

import slugify from 'slugify';
import logger from '../utils/logger';

/**
 * Local AI Heuristic Dictionaries
 */
const LOCAL_KEYWORDS: Record<string, string[]> = {
  electronics: ['gadget', 'tech', 'device', 'smart', 'wireless', 'bluetooth', 'fast', 'premium', 'high-quality', 'portable', 'latest'],
  fashion: ['apparel', 'clothing', 'stylish', 'trendy', 'comfortable', 'cotton', 'design', 'fashionable', 'wear', 'modern', 'look'],
  home: ['decor', 'furniture', 'kitchen', 'living', 'comfortable', 'modern', 'elegant', 'durable', 'design', 'cozy', 'aesthetic'],
  accessories: ['jewelry', 'leather', 'stylish', 'gift', 'premium', 'accessory', 'elegant', 'fashion', 'luxury'],
  default: ['premium', 'quality', 'best price', 'buy online', 'new', 'top rated', 'exclusive', 'shop', 'best seller']
};

const STOP_WORDS = new Set(['the', 'and', 'or', 'with', 'a', 'an', 'in', 'of', 'for', 'to', 'on', 'is', 'it', 'this', 'that', 'with']);

export const generateProductSEO = async (product: {
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
}) => {
  try {
    const cat = product.category.toLowerCase();
    
    // Predict category keywords heuristically
    let baseKeywords = LOCAL_KEYWORDS.default;
    for (const [key, words] of Object.entries(LOCAL_KEYWORDS)) {
      if (cat.includes(key)) {
        baseKeywords = words;
        break;
      }
    }

    // Extract important words from name
    const nameTokens = product.name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w));

    // Combine tags, name tokens, and base keywords to form intelligent SEO tags
    const keywords = [...new Set([...product.tags, ...nameTokens, ...baseKeywords])].slice(0, 8);
    
    // Generate click-worthy Title
    const seoTitle = `Buy ${product.name} | Premium ${product.category} Online`.substring(0, 60);
    
    // Generate highly targeted Description
    const shortDesc = product.description.replace(/[^\w\s.]/gi, '').substring(0, 80).trim();
    const seoDescription = `Shop the ${product.name}. ${shortDesc}... Discover top-quality ${product.category} at amazing prices today.`.substring(0, 160);

    return { seoTitle, seoDescription, seoKeywords: keywords };
  } catch (error) {
    logger.error('Error generating local product SEO:', error);
    return {
      seoTitle: product.name.substring(0, 60),
      seoDescription: product.description.substring(0, 160),
      seoKeywords: product.tags,
    };
  }
};

export const generateProductSlug = async (name: string, existingSlugs: string[]): Promise<string> => {
  let baseSlug = slugify(name, { lower: true, strict: true });
  
  if (baseSlug.length < 3) {
    baseSlug = `product-${Date.now()}`;
  }

  let finalSlug = baseSlug;
  let counter = 2;
  
  while (existingSlugs.includes(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return finalSlug;
};

export const generateProductDescription = async (
  name: string,
  category: string,
  specs: { key: string; value: string }[]
): Promise<string> => {
  try {
    const specsString = specs.map((s) => `• ${s.key}: ${s.value}`).join('\n');
    return `Discover the incredible ${name}, designed perfectly for your lifestyle. This premium ${category} combines aesthetic design with unparalleled functionality.\n\nKey Specifications:\n${specsString}\n\nElevate your everyday experience with top-tier materials and modern craftsmanship.`;
  } catch (error) {
    logger.error('Error generating local product description:', error);
    return `Discover the incredible ${name}, designed perfectly for your needs.`;
  }
};

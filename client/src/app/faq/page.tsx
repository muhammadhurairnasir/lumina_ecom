'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShoppingBag, Truck, RotateCcw, ShieldCheck } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: any;
  items: FAQItem[];
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>('orders');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categories: FAQCategory[] = [
    {
      id: 'orders',
      name: 'Orders & Payments',
      icon: ShoppingBag,
      items: [
        {
          question: 'How can I track my order?',
          answer: 'Once your order ships, we will send you a confirmation email containing a tracking number. You can use this number on the carrier\'s website to check the real-time status of your delivery.',
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept major credit cards (Visa, MasterCard, American Express, Discover), Shopify Pay, Apple Pay, Google Pay, and secure payments via Stripe.',
        },
        {
          question: 'Can I cancel or modify my order after placing it?',
          answer: 'Because we process orders rapidly to ensure fast delivery, we can only accommodate cancellations or changes within 1 hour of placing the order. Please contact our support team immediately at support@luminastore.com.',
        },
      ],
    },
    {
      id: 'shipping',
      name: 'Shipping & Delivery',
      icon: Truck,
      items: [
        {
          question: 'What are your shipping rates and delivery times?',
          answer: 'Standard shipping takes 3-5 business days and is free for orders over $100. For orders under $100, a flat rate of $7.99 applies. Expedited shipping (1-2 business days) is available for $19.99.',
        },
        {
          question: 'Do you ship internationally?',
          answer: 'Currently, we ship to the United States, Canada, the United Kingdom, and Australia. International shipping rates and times are calculated automatically at checkout based on your delivery destination.',
        },
        {
          question: 'My tracking link shows "delivered," but I haven\'t received my package. What should I do?',
          answer: 'Occasionally, carriers mark packages as delivered prematurely or place them in a secure area. We recommend checking with your neighbors and local postal facility first. If you still cannot locate your package after 48 hours, please reach out to us.',
        },
      ],
    },
    {
      id: 'returns',
      name: 'Returns & Exchanges',
      icon: RotateCcw,
      items: [
        {
          question: 'What is your return policy?',
          answer: 'We offer a 30-day return policy for most unused items in their original packaging. Please note that sale items, gift cards, and personalized products are final sale and cannot be returned.',
        },
        {
          question: 'How do I start a return or exchange?',
          answer: 'To initiate a return, visit our online returns portal with your order number and zip code. Print out the prepaid return shipping label provided, attach it to your package, and drop it off at any carrier location.',
        },
        {
          question: 'How long does it take to process a refund?',
          answer: 'Once your returned package is received and inspected at our warehouse (typically within 3-5 business days of arrival), we will process your refund. The credit will be applied automatically to your original payment method, which may take 5-10 business days depending on your bank.',
        },
      ],
    },
    {
      id: 'products',
      name: 'Product Details & Quality',
      icon: ShieldCheck,
      items: [
        {
          question: 'Where are your products manufactured?',
          answer: 'We pride ourselves on ethical craftsmanship. Our design studio is located in New York, and we partner with certified, sustainable factories around the globe—including Portugal, Italy, and Japan—to source the finest materials and ensure premium construction.',
        },
        {
          question: 'Are your materials sustainably sourced?',
          answer: 'Yes, sustainability is at the core of Lumina. We use GOTS-certified organic cotton, recycled polyester, and biodegradable dyes. Every product is rigorously tested to meet strict environmental and durability standards.',
        },
        {
          question: 'How should I care for my Lumina items?',
          answer: 'Care instructions are printed on the label inside each item. Generally, we recommend washing in cold water on a gentle cycle and laying flat to dry. This preserves the natural fibers, extends product life, and reduces energy usage.',
        },
      ],
    },
  ];

  const currentCategory = categories.find((cat) => cat.id === activeCategory) || categories[0];

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-text-secondary">
            Find quick answers to common questions about orders, shipping, and product care.
          </p>
        </div>

        {/* Categorized Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* Sidebar Menu */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 px-3">
              Categories
            </h2>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setOpenIndex(null);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm shadow-primary/10'
                      : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary bg-surface/50 border border-border/55'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Accordion Content */}
          <div className="lg:col-span-3">
            <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span>{currentCategory.name}</span>
              </h3>
              
              <div className="space-y-4">
                {currentCategory.items.map((item, index) => {
                  const isOpen = openIndex === index;
                  return (
                    <div
                      key={index}
                      className="border border-border/60 rounded-xl overflow-hidden bg-background/30 transition-all hover:bg-background/60"
                    >
                      <button
                        onClick={() => toggleOpen(index)}
                        className="w-full flex items-center justify-between text-left px-6 py-5 focus:outline-none"
                      >
                        <span className="font-semibold text-text-primary text-base sm:text-lg">
                          {item.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-text-secondary flex-shrink-0" />
                        )}
                      </button>
                      
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isOpen ? 'max-h-[500px] border-t border-border/50' : 'max-h-0'
                        }`}
                      >
                        <div className="px-6 py-5 text-text-secondary text-sm sm:text-base leading-relaxed bg-white">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Direct support prompt */}
            <div className="mt-8 text-center bg-primary/5 rounded-2xl border border-primary/10 p-6">
              <p className="text-text-secondary text-sm">
                Still have questions? Our customer service team is standing by to help.{' '}
                <a href="/contact" className="text-primary font-semibold hover:underline">
                  Contact Us directly &rarr;
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

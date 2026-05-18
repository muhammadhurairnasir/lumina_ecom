import { Truck, RotateCcw, ShieldCheck, HelpCircle, AlertCircle } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <Truck className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-4">
            Shipping & Returns Policy
          </h1>
          <p className="text-lg text-text-secondary">
            Everything you need to know about our shipping rates, delivery timelines, and return policy.
          </p>
        </div>

        {/* Content Modules */}
        <div className="space-y-12">
          
          {/* Section 1: Shipping Policy */}
          <section className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <Truck className="w-6 h-6 text-primary" />
              <span>Shipping Information</span>
            </h2>
            
            <p className="text-text-secondary mb-6 leading-relaxed">
              We process and ship orders daily, Monday through Friday, excluding public holidays. Orders placed before 1:00 PM EST will be processed the same day. Orders placed after 1:00 PM EST will be processed the following business day.
            </p>

            {/* Shipping Rates Table */}
            <div className="overflow-x-auto border border-border rounded-xl mb-6">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Delivery Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border text-sm text-text-secondary">
                  <tr>
                    <td className="px-6 py-4 font-semibold text-text-primary">Standard Shipping</td>
                    <td className="px-6 py-4">$7.99 <span className="text-xs text-accent font-medium block">(Free over $100)</span></td>
                    <td className="px-6 py-4 font-medium">3 - 5 business days</td>
                    <td className="px-6 py-4">Standard tracking included. Ships via UPS or FedEx.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-text-primary">Expedited Shipping</td>
                    <td className="px-6 py-4">$19.99</td>
                    <td className="px-6 py-4 font-medium">1 - 2 business days</td>
                    <td className="px-6 py-4">Prioritized dispatch. Tracking link updated instantly.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-text-primary">International Shipping</td>
                    <td className="px-6 py-4 font-medium">Calculated at checkout</td>
                    <td className="px-6 py-4 font-medium">7 - 14 business days</td>
                    <td className="px-6 py-4">Available for CA, UK, and AU. DDP (Duties Paid) options available.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 bg-primary/5 border border-primary/10 rounded-xl p-4">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong>Delivery Guarantee:</strong> All Lumina packages are shipped in high-grade eco-friendly, carbon-neutral cardboard boxes. We fully guarantee all items against shipping damage.
              </p>
            </div>
          </section>

          {/* Section 2: Returns Policy */}
          <section className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <RotateCcw className="w-6 h-6 text-primary" />
              <span>Easy 30-Day Returns</span>
            </h2>
            
            <p className="text-text-secondary mb-6 leading-relaxed">
              We want you to love your Lumina items. If you are not completely satisfied with your purchase, you can return or exchange eligible products within <strong>30 days of delivery</strong> for a full refund or store credit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border border-border/80 rounded-xl p-5 bg-background/20">
                <h3 className="font-semibold text-text-primary mb-2">Return Conditions</h3>
                <ul className="list-disc pl-5 text-xs text-text-secondary space-y-2">
                  <li>Items must be unworn, unwashed, and undamaged.</li>
                  <li>Original tags and packaging must be attached.</li>
                  <li>Final sale items and gift cards are ineligible for returns.</li>
                </ul>
              </div>
              <div className="border border-border/80 rounded-xl p-5 bg-background/20">
                <h3 className="font-semibold text-text-primary mb-2">Refund Processing</h3>
                <ul className="list-disc pl-5 text-xs text-text-secondary space-y-2">
                  <li>Refunds are credited back to your original payment method.</li>
                  <li>Processing takes 3-5 business days from warehouse receipt.</li>
                  <li>Allow 5-10 business days for the credit to appear on your bank statement.</li>
                </ul>
              </div>
            </div>

            {/* How to return timeline */}
            <h3 className="font-bold text-text-primary mb-4 text-lg">How to Initiate a Return</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-text-primary text-sm">Submit Return Request</h4>
                  <p className="text-xs text-text-secondary mt-1">Visit our <a href="/faq" className="text-primary hover:underline font-medium">Help Portal</a> or email support@luminastore.com with your order number to get your return label.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-text-primary text-sm">Package & Label</h4>
                  <p className="text-xs text-text-secondary mt-1">Pack your items securely in the original packaging if possible, and attach the pre-paid UPS or FedEx shipping label provided by our support team.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-text-primary text-sm">Drop-Off & Refund</h4>
                  <p className="text-xs text-text-secondary mt-1">Drop off your package at any authorized UPS/FedEx facility. Once received and inspected, we will issue your refund.</p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Redirect */}
          <section className="bg-surface rounded-2xl border border-border p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex gap-4">
              <HelpCircle className="w-10 h-10 text-primary flex-shrink-0 hidden sm:block" />
              <div>
                <h3 className="font-bold text-text-primary text-lg">Still have questions?</h3>
                <p className="text-sm text-text-secondary mt-1">Read our comprehensive FAQ page or speak directly with our team.</p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <a href="/faq" className="flex-1 text-center bg-primary text-white text-sm font-semibold py-3 px-6 rounded-xl hover:bg-primary-light hover:text-primary transition-colors duration-300">
                View FAQs
              </a>
              <a href="/contact" className="flex-1 text-center border border-border text-text-primary text-sm font-semibold py-3 px-6 rounded-xl hover:bg-background transition-colors duration-300">
                Contact Support
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

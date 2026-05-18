import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-text-secondary">
            Have a question about an order or our products? We're here to help. 
            Reach out to our customer service team and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Information */}
          <div className="space-y-10">
            <h2 className="text-2xl font-bold text-text-primary border-b border-border pb-4">
              Get in Touch
            </h2>
            
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-6">
                  <h3 className="text-lg font-medium text-text-primary">Email Support</h3>
                  <p className="mt-2 text-text-secondary">We aim to respond to all inquiries within 24 hours.</p>
                  <a href="mailto:support@luminastore.com" className="mt-2 inline-block font-medium text-primary hover:text-primary-light transition">
                    support@luminastore.com
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-6">
                  <h3 className="text-lg font-medium text-text-primary">Phone Support</h3>
                  <p className="mt-2 text-text-secondary">Available Monday through Friday, 9AM to 5PM EST.</p>
                  <a href="tel:+18005550199" className="mt-2 inline-block font-medium text-primary hover:text-primary-light transition">
                    1-800-555-0199
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-6">
                  <h3 className="text-lg font-medium text-text-primary">Headquarters</h3>
                  <p className="mt-2 text-text-secondary">
                    Lumina Inc.<br />
                    123 Commerce Blvd, Suite 400<br />
                    New York, NY 10001
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-6">
                  <h3 className="text-lg font-medium text-text-primary">Business Hours</h3>
                  <p className="mt-2 text-text-secondary">
                    Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                    Saturday: 10:00 AM - 4:00 PM EST<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Send a Message
            </h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-text-primary mb-2">First Name</label>
                  <input type="text" id="first-name" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" placeholder="Jane" />
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-text-primary mb-2">Last Name</label>
                  <input type="text" id="last-name" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" placeholder="Doe" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">Email Address</label>
                <input type="email" id="email" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" placeholder="jane@example.com" />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-2">Subject</label>
                <select id="subject" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition">
                  <option>Order Inquiry</option>
                  <option>Product Question</option>
                  <option>Returns & Refunds</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">Message</label>
                <textarea id="message" rows={5} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none" placeholder="How can we help you?"></textarea>
              </div>

              <button type="button" className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary-light hover:text-primary transition-colors duration-300">
                Send Message
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

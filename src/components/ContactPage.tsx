/* Jonathan Torres wrote the original version of this file */
/* Jonathan Torres updated the UI styling and condensed the layout */
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Mail, Send, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner@2.0.3";

/* API URL */
const API_URL = import.meta.env.VITE_API_URL;

//remove later
console.log("API_URL =", API_URL);

interface FaqItem {
  q: string;
  a: string;
}

// FAQ entries will be added here
const faqs: FaqItem[] = [];

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [expandFaq, setExpandFaq] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    console.log("Contact form submitted:", formData);
    toast.success("Thank you for contacting us! We'll get back to you soon.");

    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-teal-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl text-teal-900 mb-3">Contact Us</h1>
          <div className="w-16 h-1 bg-teal-500 mx-auto rounded-full mb-3" />
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Have a question or feedback? We'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Contact Info + FAQ */}
          <div className="space-y-5">
            <Card className="p-6 border-l-4 border-l-teal-400">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Email</h3>
              </div>
              <p className="text-sm text-gray-600 ml-[52px]">support@calcura.com</p>
              <p className="text-sm text-gray-600 ml-[52px]">hello@calcura.com</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border-l-4 border-l-teal-400">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Quick Response</h3>
              </div>
              <p className="text-sm text-gray-600 ml-[52px]">
                We typically respond within 24 hours on business days.
              </p>
            </Card>

            {/* Collapsible FAQ */}
            <Card className="p-6">
              <button
                onClick={() => setExpandFaq(!expandFaq)}
                className="flex items-center justify-between w-full"
              >
                <h3 className="text-sm font-semibold text-gray-900">FAQ</h3>
                {expandFaq ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </button>
              {expandFaq && (
                <div className="mt-3 space-y-3">
                  {faqs.length > 0 ? (
                    faqs.map((faq) => (
                      <div key={faq.q}>
                        <h4 className="text-xs font-medium text-gray-900">{faq.q}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">{faq.a}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">FAQ entries coming soon.</p>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl text-gray-900 mb-6">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    className="mt-1 min-h-[150px]"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 gap-2"
                  >
                    <Send size={16} />
                    Send Message
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ name: "", email: "", phone: "", message: "" })}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

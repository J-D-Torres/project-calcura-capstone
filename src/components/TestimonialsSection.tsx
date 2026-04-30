/* Jaren Schneider wrote the original version of this file */
/* Jonathan Torres updated the UI styling */
import { Card } from "./ui/card";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote: "Calcura changed my relationship with money. I feel in control!",
    author: "Sarah K.",
    rating: 5,
  },
  {
    id: 2,
    quote: "The AI insights helped me save $500 a month. Incredible!",
    author: "Michael T.",
    rating: 5,
  },
  {
    id: 3,
    quote: "Best budgeting app I've ever used. Simple and powerful.",
    author: "Jessica M.",
    rating: 5,
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">What Our Users Say</h2>
          <div className="w-16 h-1 bg-green-500 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="p-6 bg-white border-t-4 border-t-green-400">
              <Quote className="w-8 h-8 text-green-500 mb-3" />
              <p className="text-sm text-gray-700 mb-4 italic leading-relaxed">"{testimonial.quote}"</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">— {testimonial.author}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

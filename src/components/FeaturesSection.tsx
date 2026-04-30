/* Jaren Schneider wrote the original version of this file */
/* Jonathan Torres updated the UI styling */
import { Card } from "./ui/card";
import { BarChart3, Calendar, Search } from "lucide-react";

/* API URL */
const API_URL = import.meta.env.VITE_API_URL;

//remove later
console.log("API_URL =", API_URL);

const features = [
  {
    icon: BarChart3,
    title: "Smart Budgeting",
    description: "Automatically categorize expenses and create intelligent budgets based on your spending patterns",
    color: "bg-blue-600",
  },
  {
    icon: Calendar,
    title: "Expense Tracking",
    description: "Track every dollar with ease and see where your money goes in real-time",
    color: "bg-green-600",
  },
  {
    icon: Search,
    title: "Financial Insights",
    description: "Get insights and recommendations to optimize your financial health",
    color: "bg-purple-600",
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-blue-900 mb-3">Features</h2>
          <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="p-8 text-center hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.color} rounded-2xl mb-5`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

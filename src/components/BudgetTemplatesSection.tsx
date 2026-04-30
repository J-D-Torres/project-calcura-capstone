/* Joseph St.John wrote the original version of this file */
/* Jonathan Torres updated the UI styling */
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Sparkles, Briefcase, Palmtree } from "lucide-react";

//* API URL */
const API_URL = import.meta.env.VITE_API_URL;

//remove later
console.log("API_URL =", API_URL);

const templates = [
  {
    id: 1,
    icon: Sparkles,
    title: "Young Adult",
    description: "Start your financial journey with simple budgeting and savings goals",
    services: [
      "Basic expense tracking",
      "Savings goals",
      "Educational resources",
      "Spending insights"
    ],
    color: "bg-blue-600"
  },
  {
    id: 2,
    icon: Briefcase,
    title: "Career",
    description: "Advanced tools for managing income, investments, and career growth",
    services: [
      "Advanced budgeting tools",
      "Investment tracking",
      "Tax planning assistance",
      "What-if analysis"
    ],
    color: "bg-green-600"
  },
  {
    id: 3,
    icon: Palmtree,
    title: "Retirement",
    description: "Comprehensive planning for a secure and comfortable retirement",
    services: [
      "Retirement income planning",
      "Healthcare cost tracking",
      "Estate planning tools",
      "Social Security optimizer"
    ],
    color: "bg-purple-600"
  }
];

interface BudgetTemplatesSectionProps {
  onSelectTemplate?: () => void;
}

export function BudgetTemplatesSection({ onSelectTemplate }: BudgetTemplatesSectionProps) {
  return (
    <section id="templates" className="py-20 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-green-900 mb-3">Budget Templates</h2>
          <div className="w-16 h-1 bg-green-500 mx-auto rounded-full mb-4" />
          <p className="text-gray-600 text-lg">
            Choose the template that matches your life stage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="p-8 bg-white hover:shadow-lg transition-shadow">
                <div className={`inline-flex items-center justify-center w-14 h-14 ${template.color} rounded-xl mb-5`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{template.title}</h3>
                <p className="text-gray-600 mb-5">{template.description}</p>

                <ul className="space-y-2 mb-6">
                  {template.services.map((service, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onSelectTemplate}
                >
                  Get Started
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

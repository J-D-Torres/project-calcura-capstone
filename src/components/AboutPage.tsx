/* Jaren Schneider wrote the original version of this file */
/* Jonathan Torres updated the UI styling and condensed the layout */
import { Card } from "./ui/card";
import { Target, Users, Heart, TrendingUp, Shield, Lightbulb, BarChart3, Calculator, Zap, CreditCard } from "lucide-react";
import logoImage from "../assets/logoImage.png";

/* API URL */
const API_URL = import.meta.env.VITE_API_URL;

//remove later
console.log("API_URL =", API_URL);

const features = [
  { icon: BarChart3, label: "Life Stage Templates" },
  { icon: Zap, label: "AI-Powered Insights" },
  { icon: Calculator, label: "What-If Analysis" },
  { icon: CreditCard, label: "100% Free" },
  { icon: TrendingUp, label: "Comprehensive Tracking" },
  { icon: Heart, label: "User-Friendly Interface" },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <img src={logoImage} alt="Calcura Logo" className="w-24 h-24 object-contain mx-auto mb-5" />
          <h1 className="text-4xl text-purple-900 mb-4">About Calcura</h1>
          <div className="w-16 h-1 bg-purple-500 mx-auto rounded-full mb-4" />
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Smart budgeting for every stage of life
          </p>
        </div>

        {/* What We Do + Mission — side by side */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="p-8 border-l-4 border-l-purple-400">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <Lightbulb className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl text-gray-900">What We Do</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Calcura helps individuals take control of their finances through intelligent budgeting and personalized insights. Our platform combines AI-driven recommendations with templates tailored to three life stages: Youth, Career, and Retirement.
            </p>
          </Card>

          <Card className="p-8 border-l-4 border-l-purple-400">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Democratize financial planning by providing accessible, intelligent budgeting tools that empower everyone to achieve their financial goals — completely free of charge.
            </p>
          </Card>
        </div>

        {/* Core Values */}
        <div className="mb-12">
          <h2 className="text-2xl text-gray-900 mb-8 text-center">Core Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 !gap-0 items-center text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Accessibility</h3>
              <p className="text-sm text-gray-600">Free financial tools for everyone, regardless of income or expertise.</p>
            </Card>

            <Card className="p-8 !gap-0 items-center text-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Privacy & Security</h3>
              <p className="text-sm text-gray-600">Industry-leading protection for your sensitive financial data.</p>
            </Card>

            <Card className="p-8 !gap-0 items-center text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Empowerment</h3>
              <p className="text-sm text-gray-600">Knowledge and insights to help you make informed financial decisions.</p>
            </Card>
          </div>
        </div>

        {/* Who We Are */}
        <Card className="p-8 border-l-4 border-l-purple-400 mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl text-gray-900">Who We Are</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Calcura was built by a team of financial experts, developers, and designers who believe everyone deserves smart money management tools. We combine expertise in finance, AI, and human-centered design to create a platform that's powerful yet approachable — and we're constantly improving based on user feedback.
          </p>
        </Card>

        {/* Why Choose Calcura */}
        <Card className="p-8 border-l-4 border-l-purple-400">
          <h2 className="text-2xl text-purple-900 mb-6 text-center">Why Choose Calcura?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-center gap-3 p-4 rounded-lg bg-purple-50/50">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{feature.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

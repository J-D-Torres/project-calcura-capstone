/*Jonathan Torres wrote 87 lines of code for this file*/
import { Button } from "./ui/button";
import { User } from "lucide-react";
import logoImage from "../assets/logoImage.png";

/* API URL */
const API_URL = import.meta.env.VITE_API_URL;

//remove later
console.log("API_URL =", API_URL);

type ActivePage = "features" | "template" | "manageTemplate" | "about" | "contact" | "dashboard" | null;

const pageTabColors: Record<string, { bg: string; text: string; border: string }> = {
  features: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-400" },
  template: { bg: "bg-green-50", text: "text-green-700", border: "border-green-400" },
  manageTemplate: { bg: "bg-green-50", text: "text-green-700", border: "border-green-400" },
  about: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-400" },
  contact: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-400" },
  dashboard: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-400" },
};

function navClass(page: string, activePage: ActivePage) {
  if (activePage === page) {
    const c = pageTabColors[page];
    return `${c.bg} ${c.text} border ${c.border} border-b-0 rounded-t-lg px-4 py-2 -mb-[1px] relative z-10 font-medium`;
  }
  return "text-gray-700 hover:text-gray-900 px-4 py-2";
}

interface HeaderProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  onHomeClick?: () => void;
  onAccountClick?: () => void;
  onDashboardClick?: () => void;
  onAboutClick?: () => void;
  onContactClick?: () => void;
  onTemplatesClick?: () => void;
  onFeaturesClick?: () => void;
  isLoggedIn?: boolean;
  username?: string;
  onAdminClick?: () => void;
  activePage?: ActivePage;
}

export function Header({ onLoginClick, onSignUpClick, onHomeClick, onAccountClick, onDashboardClick, onTemplatesClick, onAboutClick, onContactClick, onFeaturesClick, isLoggedIn = false, username = "", onAdminClick, activePage = null }: HeaderProps) {
  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onHomeClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src={logoImage}
              alt="Calcura Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="text-xl text-gray-900">Calcura</span>
          </button>

          <nav className="hidden md:flex items-center gap-2">
            {isLoggedIn && (
              <button
                onClick={onDashboardClick}
                className={navClass("dashboard", activePage)}
              >
                Dashboard
              </button>
            )}
            <button
                onClick={onFeaturesClick}
                className={navClass("features", activePage)}
              >
              Features
            </button>

            <button
              onClick={onTemplatesClick}
              className={navClass("manageTemplate", activePage)}
            >
              Templates
            </button>

            <button
              onClick={onAboutClick}
              className={navClass("about", activePage)}
            >
              About
            </button>
            <button
              onClick={onContactClick}
              className={navClass("contact", activePage)}
            >
              Contact
            </button>
            {username === "admin" && (
              <button
                onClick={onAdminClick}
                className="text-gray-700 hover:text-gray-900 px-4 py-2"
              >
                Admin
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button
                variant="outline"
                onClick={onAccountClick}
                className="gap-2"
              >
                <User size={18} />
                Account
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={onLoginClick}>
                  Login
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={onSignUpClick}>
                  Sign Up Free
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

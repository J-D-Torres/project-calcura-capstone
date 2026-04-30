/*Jaren Schneider wrote 79 lines of code for this file */
import { Twitter, Facebook, Instagram } from "lucide-react";

/* API URL */
const API_URL = import.meta.env.VITE_API_URL;

//remove later
console.log("API_URL =", API_URL);

interface FooterProps {
  onAboutClick?: () => void;
  onContactClick?: () => void;
}

export function Footer({ onAboutClick, onContactClick }: FooterProps) {
  return (
    <footer className="bg-white border-t py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-gray-900 mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-600 hover:text-gray-900">Features</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Updates</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={onAboutClick}
                  className="text-gray-600 hover:text-gray-900"
                >
                  About
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={onContactClick}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Contact Us
                </button>
              </li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">FAQs</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-gray-900 mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-blue-600">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600">
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-gray-600">
          <p>© 2025 Calcura. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

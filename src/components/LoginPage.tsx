/* Jaren Schneider wrote all 140 lines of code for this file */
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import logoImage from "../assets/logoImage.png";

/* API URL */
const API_URL = import.meta.env.VITE_API_URL;

//remove later
console.log("API_URL =", API_URL);

interface LoginPageProps {
  onClose?: () => void;
  onCreateAccount?: () => void;
  onContinueAsGuest?: () => void;
  onHomeClick?: () => void;
  onLoginSuccess?: () => void;
  onForgotPassword?: () => void;
}

export function LoginPage({
  onClose,
  onCreateAccount,
  onContinueAsGuest,
  onHomeClick,
  onLoginSuccess,
  onForgotPassword,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      //const response = await fetch(`${API_URL}/sessions/login`, { method: "POST",
      const response = await fetch(`${API_URL}/users/login`, { method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Login failed:", errorData);
        alert("Invalid email or password. Please try again.");
        return;
      }

      const data = await response.json();
      console.log("Login successful:", data);

      //Store session tokens here? 
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("email", data.email);
      localStorage.setItem("username", data.name ?? "");

      onLoginSuccess?.();

    } catch (error) {
      console.error("Network error:", error);
      alert("Unable to reach the server");
    }
    
    // Commenting the following out as it will override the actual login logic

   /* console.log("Login attempt with:", email);
    // Call the success handler to navigate to dashboard
    if (onLoginSuccess) {
      onLoginSuccess();
    }*/
  };

  const handleForgotPassword = () => {
    onForgotPassword?.();
    // Handle forgot password logic
    console.log("Forgot password clicked");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Logo */}
      <div className="hidden md:flex md:w-1/2 bg-[#F5F1E8] items-center justify-center relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-white/30 flex items-center justify-center">
            <div className="w-[500px] h-[500px] rounded-full bg-white/50 flex items-center justify-center">
              <div className="w-[400px] h-[400px] rounded-full bg-white flex items-center justify-center">
                <img
                  src={logoImage}
                  alt="Calcura Logo"
                  className="w-80 h-80 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onHomeClick}
          className="absolute bottom-16 text-center hover:opacity-80 transition-opacity"
        >
          <img
            src={logoImage}
            alt="Calcura"
            className="w-24 h-24 mx-auto mb-2 object-contain"
          />
          <div className="text-3xl text-[#4A7BA7]">Calcura</div>
          <div className="text-gray-600">
            Smart budgeting for every stage of life
          </div>
        </button>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full md:w-1/2 bg-[#D4E5F7] flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-900">
          <h1 className="text-3xl text-center mb-8 text-gray-900">
            Hello!
          </h1>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-6 border-2 border-gray-900 rounded-xl"
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-6 border-2 border-gray-900 rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#A8D5A8] hover:bg-[#96C796] text-gray-900 py-6 rounded-xl border-2 border-gray-900"
            >
              Login
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Forgot Password
              </button>
            </div>
          </form>

          <div className="my-6 border-t-2 border-gray-900"></div>

          <div className="space-y-3 text-center">
            <button
              onClick={onContinueAsGuest}
              className="block w-full text-gray-700 hover:text-gray-900"
            >
              Continue as a Guest
            </button>
            <button
              onClick={onCreateAccount}
              className="block w-full text-gray-700 hover:text-gray-900"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

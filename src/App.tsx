import { useState, useEffect } from "react"; // Jaren Schneider lines 1-170
/* Jonathan Torres added browser history navigation */
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { FeaturesSection as FeaturesPage } from "./components/FeaturesPage";
import { BudgetTemplatesSection } from "./components/BudgetTemplatesSection";
import { Footer } from "./components/Footer";
import { FeedbackButton } from "./components/FeedbackButton";
import { TemplatePage } from "./components/TemplatePage";
import { TemplatePage as ManageTemplatePage } from "./components/ManageTemplate";
import { LoginPage } from "./components/LoginPage";
import { AccountPage } from "./components/AccountPage";
import { DashboardPage } from "./components/DashboardPage";
import { AboutPage } from "./components/AboutPage";
import { ContactPage } from "./components/ContactPage";
import { SignUpPage } from "./components/SignUpPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { RecommendBudgetPage } from "./components/RecommendBudgetPage";
import { AdminPage } from "./components/AdminPage";
import { GoalSetPage } from "./components/GoalSetPage";
import { GoalBudget } from "./components/GoalBudget";

type PageView = "landing" | "template" | "manageTemplate" | "login" | "account" | "dashboard" | "recommendBudget" | "about" | "contact" | "signup" | "forgotPassword" | "features" | "admin" | "goalSet" | "goalBudget";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const navigate = (page: PageView) => {
    window.history.pushState({ page }, "", `/${page === "landing" ? "" : page}`);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    window.history.replaceState({ page: "landing" }, "", "/");

    const handlePopState = (e: PopStateEvent) => {
      const page: PageView = e.state?.page ?? "landing";
      setCurrentPage(page);
      window.scrollTo(0, 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setUsername(localStorage.getItem("username") ?? "");
    navigate("dashboard");
  };

  if (currentPage === "login") {
    return (
      <LoginPage
        onClose={() => navigate("landing")}
        onCreateAccount={() => navigate("signup")}
        onContinueAsGuest={() => {
          // Handle continue as guest
          navigate("landing");
        }}
        onHomeClick={() => navigate("landing")}
        onLoginSuccess={handleLogin}
        onForgotPassword={() => navigate("forgotPassword")}

      />
    );
  }

  if (currentPage === "signup") {
    return (
      <SignUpPage
        onClose={() => navigate("landing")}
        onCreateAccount={() => navigate("login")}
        onContinueAsGuest={() => navigate("landing")}
        onHomeClick={() => navigate("landing")}
        onLoginSuccess={handleLogin}
      />
    );
  }

  if (currentPage === "forgotPassword") {
    return (
      <ForgotPasswordPage
        onBackToLogin={() => navigate("login")}
        onHomeClick={() => navigate("landing")}
      />
    );
  }

  const headerProps = {
    onLoginClick: () => navigate("login"),
    onSignUpClick: () => navigate("signup"),
    onHomeClick: () => navigate("landing"),
    onTemplatesClick: () => navigate("manageTemplate"),
    onAccountClick: () => navigate("account"),
    onDashboardClick: () => navigate("dashboard"),
    onAboutClick: () => navigate("about"),
    onContactClick: () => navigate("contact"),
    onFeaturesClick: () => navigate("features"),
    isLoggedIn,
    username,
    onAdminClick: () => navigate("admin"),
  };

  const footerProps = {
    onAboutClick: () => navigate("about"),
    onContactClick: () => navigate("contact"),
  };

  if (currentPage === "dashboard") {
    return (
      <div className="min-h-screen bg-white">
        <Header {...headerProps} activePage="dashboard" />
        <DashboardPage
          onCreateBudget={() => navigate("template")}
          onFinancialGoals={() => navigate("recommendBudget")}
          onManageBudgets={() => navigate("manageTemplate")}
        />
        <Footer {...footerProps} />
      </div>
    );
  }

  if (currentPage === "account") {
    return (
      <div className="min-h-screen bg-white">
        <Header {...headerProps} />
        <AccountPage />
        <Footer {...footerProps} />
      </div>
    );
  }

  if (currentPage === "recommendBudget") {
    return (
      <div className="min-h-screen bg-white">
        <Header {...headerProps} />
        <RecommendBudgetPage onCreateBudget={() => navigate("template")} />
        <Footer {...footerProps} />
      </div>
    );
  }

  if (currentPage === "about") {
    return (
      <div className="min-h-screen bg-purple-50">
        <Header {...headerProps} activePage="about" />
        <AboutPage />
        <Footer {...footerProps} />
      </div>
    );
  }

  if (currentPage === "contact") {
    return (
      <div className="min-h-screen bg-teal-50">
        <Header {...headerProps} activePage="contact" />
        <ContactPage />
        <Footer {...footerProps} />
      </div>
    );
  }

  if (currentPage === "template") {
    return (
      <div className="min-h-screen bg-green-50">
        <Header {...headerProps} activePage="template" />
        <TemplatePage onTemplateSaved={() => navigate("dashboard")} />
        <Footer {...footerProps} />
      </div>
    );
  }

  if (currentPage === "manageTemplate") {
    return (
      <div className="min-h-screen bg-green-50">
        <Header {...headerProps} activePage="manageTemplate" />
        <ManageTemplatePage onTemplateSaved={() => navigate("dashboard")} onCreateTemplate={() => navigate("template")} />
        <Footer {...footerProps} />
      </div>
    );
  }

  if (currentPage === "features") {
    return (
      <div className="min-h-screen bg-blue-50">
        <Header {...headerProps} activePage="features" />
        <FeaturesPage onRecommendBudgetClick={() => navigate("recommendBudget")} onGoalSettingClick={() => navigate("goalSet")} onGoalSeekClick={() => navigate("goalBudget")} />
        <Footer {...footerProps} />
      </div>
    );
  }

  if (currentPage === "goalSet") {
    return (
      <div className="min-h-screen bg-white">
        <Header {...headerProps} />
        <GoalSetPage onGoalSaved={() => navigate("goalBudget")} />
        <Footer {...footerProps} />
      </div>
    );
  }

  if (currentPage === "goalBudget") {
    return (
      <div className="min-h-screen bg-white">
        <Header {...headerProps} />
        <GoalBudget onCreateBudget={() => navigate("template")} />
        <Footer {...footerProps} />
      </div>
    );
  }

  if (currentPage === "admin") {
    return (
      <div className="min-h-screen bg-white">
        <Header {...headerProps} />
        <AdminPage />
        <Footer {...footerProps} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header {...headerProps} />
      <HeroSection />
      <FeaturesSection />
      <BudgetTemplatesSection onSelectTemplate={() => navigate("template")} />
      <Footer {...footerProps} />
      <FeedbackButton />
    </div>
  );
}

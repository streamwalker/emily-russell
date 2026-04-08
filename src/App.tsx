import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Component, ErrorInfo, ReactNode } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TRECDisclosures from "./pages/TRECDisclosures.tsx";
import ClientLogin from "./pages/ClientLogin.tsx";
import ClientPortal from "./pages/ClientPortal.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import ChangeEmail from "./pages/ChangeEmail.tsx";
import PortalDashboard from "./pages/PortalDashboard.tsx";
import BuyerRepAgreement from "./pages/BuyerRepAgreement.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-heading text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">Please refresh the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/trec" element={<TRECDisclosures />} />
            <Route path="/portal/login" element={<ClientLogin />} />
            <Route path="/portal/reset-password" element={<ResetPassword />} />
            <Route path="/portal/change-email" element={<ProtectedRoute><ChangeEmail /></ProtectedRoute>} />
            <Route path="/portal/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/portal/dashboard" element={<ProtectedRoute><PortalDashboard /></ProtectedRoute>} />
            <Route path="/portal/agreement" element={<ProtectedRoute><BuyerRepAgreement /></ProtectedRoute>} />
            <Route path="/portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

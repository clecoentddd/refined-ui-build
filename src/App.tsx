import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import HomePage from "./pages/HomePage";
import PlatformLoginPage from "./pages/PlatformLoginPage";
import OrganizationLoginPage from "./pages/OrganizationLoginPage";
import PlatformDashboardPage from "./pages/PlatformDashboardPage";
import OrganizationDashboardPage from "./pages/OrganizationDashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login/platform" element={<PlatformLoginPage />} />
            <Route path="/login/organization" element={<OrganizationLoginPage />} />
            <Route path="/dashboard/platform" element={<PlatformDashboardPage />} />
            <Route path="/dashboard/organization" element={<OrganizationDashboardPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";
import Import from "./pages/Import";
import Attendance from "./pages/Attendance";
import InstituteSettings from "./pages/InstituteSettings";
import SettingsHeaders from "./pages/SettingsHeaders";
import Automation from "./pages/Automation";
import Migration from "./pages/Migration";
import Permissions from "./pages/Permissions";
import Auth from "./pages/Auth";
import Mfa from "./pages/Mfa";
import Staff from "./pages/Staff";
import Fees from "./pages/Fees";
import Library from "./pages/Library";
import Hostel from "./pages/Hostel";
import Transport from "./pages/Transport";
import Certificates from "./pages/Certificates";
import GenericModule, { moduleConfigs } from "./pages/GenericModule";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();
const dedicated = new Set(["attendance","staff","fees","library","hostel","transport","certificates"]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/mfa" element={<Mfa />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/new" element={<AddStudent />} />
              <Route path="/admissions" element={<AddStudent />} />
              <Route path="/import" element={<Import />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/migration" element={<Migration />} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/settings/institute" element={<InstituteSettings />} />
              <Route path="/settings/headers" element={<SettingsHeaders />} />
              {Object.keys(moduleConfigs)
                .filter((s) => !dedicated.has(s))
                .map((slug) => (
                  <Route key={slug} path={`/${slug}`} element={<GenericModule slug={slug} />} />
                ))}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

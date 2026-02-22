import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MentorProvider } from "@/contexts/MentorContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SkillMap from "./pages/SkillMap";
import WeeklyReviews from "./pages/WeeklyReviews";
import Projects from "./pages/Projects";
import DailyLog from "./pages/DailyLog";
import Resources from "./pages/Resources";
import LearningPlan from "./pages/LearningPlan";
import MentorManage from "./pages/MentorManage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!session) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/skills" element={<ProtectedRoute><SkillMap /></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute><WeeklyReviews /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/daily-log" element={<ProtectedRoute><DailyLog /></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
      <Route path="/plan" element={<ProtectedRoute><LearningPlan /></ProtectedRoute>} />
      <Route path="/manage" element={<ProtectedRoute><MentorManage /></ProtectedRoute>} />
      <Route path="/mentor" element={<Navigate to="/manage" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MentorProvider>
            <AppRoutes />
          </MentorProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

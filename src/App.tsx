import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import LearningPaths from "./pages/LearningPaths";
import InterviewNew from "./pages/InterviewNew";
import InterviewSession from "./pages/InterviewSession";
import VideoInterview from "./pages/VideoInterview";
import VideoInterviewResults from "./pages/VideoInterviewResults";
import VideoPracticeHistory from "./pages/VideoPracticeHistory";
import ProgressAnalytics from "./pages/ProgressAnalytics";
import JobMarketInsights from "./pages/JobMarketInsights";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/learning-paths" element={<LearningPaths />} />
          <Route path="/interview/new" element={<InterviewNew />} />
          <Route path="/interview/:id" element={<InterviewSession />} />
        <Route path="/video-interview" element={<VideoInterview />} />
        <Route path="/video-interview/:id/results" element={<VideoInterviewResults />} />
        <Route path="/video-practice" element={<VideoPracticeHistory />} />
        <Route path="/progress-analytics" element={<ProgressAnalytics />} />
        <Route path="/job-market" element={<JobMarketInsights />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

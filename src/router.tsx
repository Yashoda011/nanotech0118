import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/shell/AppLayout";
import AuthPage from "@/pages/Auth";
import DashboardPage from "@/pages/Dashboard";
import ActivityPage from "@/pages/Activity";
import ExplorePage from "@/pages/Explore";
import MaterialDetailPage from "@/pages/MaterialDetail";
import SimulationPage from "@/pages/Simulation";
import ModelingPage from "@/pages/Modeling";
import LearnPage from "@/pages/Learn";
import AiPlatformPage from "@/pages/AiPlatform";
import BusinessPage from "@/pages/Business";
import LabToolsPage from "@/pages/LabTools";
import AnalysisPage from "@/pages/Analysis";
import ProjectsPage from "@/pages/Projects";
import ResourcesPage from "@/pages/Resources";
import { ResearchIndexPage, ResearchArticlePage } from "@/pages/Research";
import DocsPage from "@/pages/Docs";
import CommunityPage from "@/pages/Community";
import PricingPage from "@/pages/Pricing";
import ContactPage from "@/pages/Contact";
import AdminPage from "@/pages/Admin";
import SettingsPage from "@/pages/Settings";
import NotFoundPage from "@/pages/NotFound";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createBrowserRouter(
  [
  {
    path: "/login",
    element: <AuthPage mode="login" />,
  },
  {
    path: "/signup",
    element: <AuthPage mode="signup" />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "explore", element: <ExplorePage /> },
      { path: "materials/:id", element: <MaterialDetailPage /> },
      { path: "simulation", element: <SimulationPage /> },
      { path: "modeling", element: <ModelingPage /> },
      { path: "learn", element: <LearnPage /> },
      { path: "ai", element: <AiPlatformPage /> },
      { path: "business", element: <BusinessPage /> },
      { path: "lab-tools", element: <LabToolsPage /> },
      { path: "analysis", element: <AnalysisPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "resources", element: <ResourcesPage /> },
      { path: "research", element: <ResearchIndexPage /> },
      { path: "research/:id", element: <ResearchArticlePage /> },
      { path: "docs", element: <DocsPage /> },
      { path: "community", element: <CommunityPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  ],
  { basename },
);

import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider.jsx";
import "./App.css";
import AppLayout from "./layouts/app-layout.jsx";
import LandingPage from "./pages/landing.jsx";
import FractionalJobListing from "./pages/jobs/fractional-job-listing.jsx";
import FractionalJobDetail from "./pages/jobs/fractional-job-detail.jsx";
import PostJob from "./pages/jobs/post-job.jsx";
import SavedJobs from "./pages/jobs/saved-jobs.jsx";
import MyJobs from "./pages/my-jobs.jsx";
import ServiceProviderListing from "./pages/service/service-provider-listing.jsx";
import BrandOnboarding from "./pages/brand/brand-onboarding.jsx";
import ServiceOnboarding from "./pages/service/service-onboarding.jsx";
import ServiceProviderDetail from "./pages/service/service-provider-detail.jsx";
import FractionalTalentListing from "./pages/talent/fractional-talent-listing.jsx";
import FractionalTalentDetail from "./pages/talent/fractional-talent-detail.jsx";
import TalentOnboarding from "./pages/talent/talent-onboarding.jsx";
import ProtectedRoute from "./components/protected-route.jsx";
import TalentEditProfile from "./pages/talent/edit-fractional-talent.jsx";
import EditJobPage from "./pages/jobs/edit-job.jsx";
import EditServicePage from "./pages/service/edit-service.jsx";
import FeedbackForm from "./pages/feedback-form.jsx";
import RolesDashboard from "./pages/analytics/roles-dashboard.jsx";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/onboarding/brand",
        element: <BrandOnboarding />,
      },
      {
        path: "/onboarding/service",
        element: <ServiceOnboarding />,
      },
      {
        path: "/onboarding/talent",
        element: <TalentOnboarding />,
      },
      {
        path: "/jobs",
        element: <FractionalJobListing />,
      },
      {
        path: "/job/:id",
        element: <FractionalJobDetail />,
      },
      {
        path: "/edit-job/:id",
        element: <EditJobPage />,
      },
      {
        path: "/services",
        element: <ServiceProviderListing />,
      },
      {
        path: "/services/:id",
        element: <ServiceProviderDetail />,
      },
      {
        path: "/edit-service/:id",
        element: <EditServicePage />,
      },
      {
        path: "/talents",
        element: <FractionalTalentListing />,
      },
      {
        path: "/talents/:id",
        element: <FractionalTalentDetail />,
      },
      {
        path: "/edit-talent",
        element: <TalentEditProfile />,
      },
      {
        path: "/post-job",
        element: <PostJob />,
      },
      {
        path: "/saved-jobs",
        element: <SavedJobs />,
      },
      {
        path: "/my-jobs",
        element: <MyJobs />,
      },
      {
        path: "/feedback",
        element: <FeedbackForm />,
      },
      {
        path: "/user-analytics",
        element: <RolesDashboard />,
      },
    ],
  },
]);

function App() {
  useEffect(() => {
    if (window.location.hash.startsWith("#/sso-callback")) {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;

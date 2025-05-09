import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider.jsx";
import "./App.css";
import AppLayout from "./layouts/app-layout.jsx";
import LandingPage from "./pages/landing.jsx";
import Onboarding from "./pages/onboarding.jsx";
import FractionalJobListing from "./pages/fractional-job-listing.jsx";
import FractionalJobDetail from "./pages/fractional-job-detail.jsx";
import PostJob from "./pages/post-job.jsx";
import SavedJobs from "./pages/saved-jobs.jsx";
import MyJobs from "./pages/my-jobs.jsx";
import ServiceProviderListing from "./pages/service-provider-listing.jsx";
import BrandOnboarding from "./pages/brand-onboarding.jsx";
import ServiceOnboarding from "./pages/service-onboarding.jsx";
import ServiceProviderDetail from "./pages/service-provider-detail.jsx";
import FractionalTalentListing from "./pages/fractional-talent-listing.jsx";
import FractionalTalentDetail from "./pages/fractional-talent-detail.jsx";
import TalentOnboarding from "./pages/talent-onboarding.jsx";
import ProtectedRoute from "./components/protected-route.jsx";
import TalentEditProfile from "./pages/edit-fractional-talent.jsx";
import EditJobPage from "./pages/edit-job.jsx";

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
        element: <ServiceProviderDetail />,
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
    ],
  },
]);

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <RouterProvider router={router} />;
    </ThemeProvider>
  );
}

export default App;

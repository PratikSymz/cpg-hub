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
import FractionalTalentListing from "./pages/fractional-talent.jsx";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/onboarding",
        element: <Onboarding />,
      },
      {
        path: "/jobs",
        element: <FractionalJobListing />,
      },
      {
        path: "/services",
        element: <ServiceProviderListing />,
      },
      {
        path: "/talent",
        element: <FractionalTalentListing />,
      },
      {
        path: "/job/:id",
        element: <FractionalJobDetail />,
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

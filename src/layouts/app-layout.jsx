import CoincentricCircles from "@/components/CoincentricCircles.jsx";
import NavBar from "@/components/nav-bar.jsx";
import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { Toaster } from "sonner";

const AppLayout = () => {
  return (
    <div>
      <Toaster position="bottom-left" richColors />
      {/* Header and Body */}
      <main className="min-h-screen min-w-screen container">
        <NavBar />
        <Outlet />
      </main>
      {/* Footer */}
      {/* Feedback Section */}
      {/* Feedback Section */}
      <footer className="text-center mt-14 max-w-2xl mx-auto px-4 pb-10">
        <div className="h-0.5 bg-cpg-teal/80 rounded-full mb-8" />
        <h2 className="text-base sm:text-lg font-semibold text-cpg-brown">
          Feedback
        </h2>
        <p className="text-sm sm:text-base text-gray-700 my-2 leading-relaxed">
          Welcome to the beta version of CPG HUB! Thank you for being here.
          Please{" "}
          <Link
            to="/feedback"
            className="text-cpg-brown underline underline-offset-4 hover:text-cpg-teal transition"
          >
            click here
          </Link>{" "}
          to send any feedback on how we can improve the user experience and
          make this an even better tool for our CPG community.
        </p>
      </footer>
    </div>
  );
};

export default AppLayout;

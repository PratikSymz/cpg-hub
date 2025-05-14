import CoincentricCircles from "@/components/CoincentricCircles.jsx";
import NavBar from "@/components/nav-bar.jsx";
import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";

const AppLayout = () => {
  return (
    <div>
      {/* Header and Body */}
      <main className="min-h-screen min-w-screen container">
        <NavBar />
        <Outlet />
      </main>
      {/* Footer */}
      {/* Feedback Section */}
      <div className="text-center mt-14 max-w-2xl mx-auto">
        <div className="px-8 h-0.5 bg-cpg-teal/80 rounded-full mb-8" />
        <h2 className="text-lg font-semibold text-cpg-brown">Feedback</h2>
        <p className="text-sm text-gray-700 mt-2">
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
      </div>
    </div>
  );
};

export default AppLayout;

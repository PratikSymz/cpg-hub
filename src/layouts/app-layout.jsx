import CoincentricCircles from "@/components/CoincentricCircles.jsx";
import NavBar from "@/components/nav-bar.jsx";
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useUser } from "@clerk/clerk-react";
import ShowLoginDialog from "@/components/show-login-dialog.jsx";

const AppLayout = () => {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

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
          Welcome to the <span className="font-semibold">beta version</span> of
          CPG HUB! Thank you for being here. Please{" "}
          <button
            onClick={() => {
              if (!isSignedIn || !user) {
                setShowLoginDialog(true);
              } else {
                navigate("/feedback");
              }
            }}
            className="text-cpg-brown underline underline-offset-4 hover:text-cpg-brown/90 transition-colors cursor-pointer"
          >
            click here
          </button>{" "}
          to share your feedback on how we can improve the user experience and
          make this an even better tool for our CPG community.
        </p>
        <ShowLoginDialog open={showLoginDialog} setOpen={setShowLoginDialog} />
      </footer>
    </div>
  );
};

export default AppLayout;

import NavBar from "@/components/nav-bar.jsx";
import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useUser } from "@clerk/clerk-react";
import ShowLoginDialog from "@/components/show-login-dialog.jsx";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";

const AppLayout = () => {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleFeedbackClick = () => {
    if (!isSignedIn || !user) {
      setShowLoginDialog(true);
    } else {
      navigate("/feedback");
    }
  };

  return (
    <div>
      <Toaster position="bottom-left" richColors />
      {/* Header and Body */}
      <main className="min-h-screen min-w-screen container">
        <NavBar />
        <Outlet />
      </main>

      {/* Footer / Feedback Section */}
      <footer className="mt-16 pb-10">
        <div className="w-5/6 max-w-2xl mx-auto">
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-cpg-teal/40 to-transparent mb-10" />

          {/* Feedback Card */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 sm:p-8 hover:border-cpg-teal/20 transition-colors">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Icon */}
              <div className="bg-cpg-teal/10 rounded-xl p-4 flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-cpg-teal" />
              </div>

              {/* Content */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Share Your Feedback
                </h2>
                <p className="text-sm text-muted-foreground">
                  Help us improve CPG Hub! We'd love to hear your thoughts on how we can make this an even better tool for our community.
                </p>
              </div>

              {/* Button */}
              <Button
                onClick={handleFeedbackClick}
                className="bg-cpg-brown hover:bg-cpg-brown/90 rounded-xl px-6 group flex-shrink-0"
              >
                Give Feedback
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} CPG Hub. All rights reserved.
          </p>
        </div>

        <ShowLoginDialog open={showLoginDialog} setOpen={setShowLoginDialog} />
      </footer>
    </div>
  );
};

export default AppLayout;

import React from "react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  SignIn,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";

import { Button } from "./ui/button.jsx";
import { BriefcaseBusiness, Heart, PenBox } from "lucide-react";
import { ROLE_TALENT } from "@/constants/roles.js";

const NavBar = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [search, setSearch] = useSearchParams();
  const { user } = useUser();

  useEffect(() => {
    if (search.get("sign-in")) {
      setShowSignIn(true);
    }
  }, [search]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSignIn(false);
      setSearch({});
    }
  };

  return (
    <header className="px-6 py-4 border-0">
      <nav className="p-8 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to={"/"}>
            <img
              src={"/CPG_HUB_Logo.png"}
              alt="CPG Hub Logo"
              className="h-26 w-auto"
            />
          </Link>
          <p className="text-lg font-medium text-[#613f1b]">
            The spot for CPG brands, fractional talent, and services to connect.
          </p>
        </div>

        <div className="flex gap-8">
          {/* When signed out */}
          <SignedOut>
            <Button
              variant="default"
              size="default"
              className="bg-cpg-teal text-white hover:bg-cpg-teal/90"
              onClick={() => setShowSignIn(true)}
            >
              Login
            </Button>
          </SignedOut>

          {/* When signed in */}
          <SignedIn>
            {user?.unsafeMetadata?.role !== ROLE_TALENT && (
              <Link to="/post-job">
                <Button
                  variant="default"
                  size="default"
                  className="bg-cpg-teal text-white hover:bg-cpg-teal/90"
                >
                  <PenBox size={20} /> Post a Job
                </Button>
              </Link>
            )}

            <UserButton
              appearance={{
                elements: {
                  userButtonTrigger: "w-16 h-16", // outer clickable wrapper
                  userButtonAvatarBox: "w-16 h-16", // avatar container
                  userButtonAvatarImage: "w-16 h-16", // actual image
                },
                layout: {
                  shimmer: false,
                },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Link
                  label="My Jobs"
                  labelIcon={<BriefcaseBusiness size={15} />}
                  href="/my-jobs"
                />
                <UserButton.Link
                  label="Saved Jobs"
                  labelIcon={<Heart size={15} />}
                  href="/saved-jobs"
                />
                <UserButton.Action label="manageAccount" />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
        </div>
      </nav>

      {showSignIn && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleOverlayClick}
        >
          <SignIn
            signUpForceRedirectUrl="/onboarding"
            fallbackRedirectUrl="/onboarding"
          />
        </div>
      )}
    </header>
  );
};

export default NavBar;

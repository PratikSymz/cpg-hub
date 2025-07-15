import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { BriefcaseBusiness, PenBox, X, Menu } from "lucide-react";
import { Button } from "./ui/button.jsx";
import { ROLE_BRAND, ROLE_SERVICE, ROLE_TALENT } from "@/constants/roles.js";

const NavBar = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [search, setSearch] = useSearchParams();
  const { user, isLoaded } = useUser();

  const [authMode, setAuthMode] = useState("sign-in");

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

  const role = user?.unsafeMetadata?.role;

  const getGreeting = () => {
    if (!user) return null;
    const name = user.firstName;
    const roleLabel =
      typeof role === "string"
        ? `(${role.charAt(0).toUpperCase() + role.slice(1)})`
        : "";
    return name ? `Hi, ${name} ${roleLabel}` : null;
  };

  return (
    <header className="w-full px-4 py-8 shadow-none">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <img
              src="/og-image.png"
              alt="CPG Hub Logo"
              className="h-36 w-auto"
            />
          </Link>
          <p className="hidden lg:block text-sm md:text-base font-medium text-[#613f1b]">
            The spot for CPG brands, fractional talent, and services to connect.
          </p>
        </div>

        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-4">
          <Link to="/jobs">
            <Button
              size="default"
              variant="ghost"
              className="text-sm font-medium hover:text-cpg-teal"
            >
              Jobs
            </Button>
          </Link>
          <Link to="/talents">
            <Button
              size="default"
              variant="ghost"
              className="text-sm font-medium hover:text-cpg-teal"
            >
              Talent
            </Button>
          </Link>
          <Link to="/services">
            <Button
              size="default"
              variant="ghost"
              className="text-sm font-medium hover:text-cpg-teal"
            >
              Services
            </Button>
          </Link>

          <SignedOut>
            <Button
              size="default"
              variant="default"
              className="bg-cpg-teal text-white hover:bg-cpg-teal/90"
              onClick={() => setShowSignIn(true)}
            >
              Login
            </Button>
          </SignedOut>

          <SignedIn>
            {role === ROLE_BRAND && (
              <Link to="/post-job">
                <Button
                  size="default"
                  variant="default"
                  className="bg-cpg-teal text-white hover:bg-cpg-teal/90"
                >
                  <PenBox size={20} className="mr-2" />
                  Post a Job
                </Button>
              </Link>
            )}
            <UserButton
              showName={false}
              appearance={{
                elements: {
                  userButtonTrigger: "w-10 h-10",
                  userButtonAvatarBox: "w-10 h-10",
                  userButtonAvatarImage: "w-10 h-10",
                },
              }}
            />
          </SignedIn>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="sm:hidden">
          <Button
            className=""
            size="default"
            variant="ghost"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="sm:hidden mt-4 px-4 space-y-4">
          <Link to="/jobs">
            <Button
              variant="ghost"
              size="default"
              className="w-full justify-start"
            >
              Jobs
            </Button>
          </Link>
          <Link to="/talents">
            <Button
              variant="ghost"
              size="default"
              className="w-full justify-start"
            >
              Talent
            </Button>
          </Link>
          <Link to="/services">
            <Button
              variant="ghost"
              size="default"
              className="w-full justify-start"
            >
              Services
            </Button>
          </Link>

          <SignedOut>
            <Button
              size="default"
              variant="default"
              className="w-full mt-4 bg-cpg-teal text-white hover:bg-cpg-teal/90"
              onClick={() => {
                setShowSignIn(true);
                setShowMobileMenu(false);
              }}
            >
              Login
            </Button>
          </SignedOut>

          <SignedIn>
            {role === ROLE_BRAND && (
              <Link to="/post-job">
                <Button
                  variant="default"
                  size="default"
                  className="w-full bg-cpg-teal text-white hover:bg-cpg-teal/90"
                >
                  <PenBox size={20} className="mr-2" />
                  Post a Job
                </Button>
              </Link>
            )}
          </SignedIn>
        </div>
      )}

      {/* Sign-In Modal */}
      {showSignIn && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={handleOverlayClick}
        >
          <div
            className="relative bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-700 hover:text-black"
              onClick={() => {
                setShowSignIn(false);
                setSearch({});
              }}
            >
              <X size={20} />
            </button>
            {authMode === "sign-in" ? (
              <SignIn forceRedirectUrl="/" />
            ) : (
              <SignUp forceRedirectUrl="/" />
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;

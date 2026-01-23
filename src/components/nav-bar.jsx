import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import {
  BriefcaseBusiness,
  PenBox,
  X,
  Menu,
  Briefcase,
  Users,
  Building2,
  BarChart3,
} from "lucide-react";
import { Button } from "./ui/button.jsx";
import { ROLE_BRAND, ROLE_SERVICE, ROLE_TALENT } from "@/constants/roles.js";
import { isAdminEmail } from "@/constants/admins.js";

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
  const roles = Array.isArray(user?.unsafeMetadata?.roles)
    ? user.unsafeMetadata.roles
    : [];

  return (
    <header className="w-full px-4 sm:px-6 py-6">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex-shrink-0">
            <img
              src="/og-image_transparent.png"
              alt="CPG Hub Logo"
              className="h-24 sm:h-32 lg:h-36 w-auto"
            />
          </Link>
          <p className="hidden lg:block text-sm font-medium text-cpg-brown/80 max-w-xs">
            The spot for CPG brands, fractional talent, and services to connect.
          </p>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/jobs">
            <Button
              size="default"
              variant="ghost"
              className="text-sm font-medium text-gray-700 hover:text-cpg-teal hover:bg-cpg-teal/5 rounded-xl px-4"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Jobs
            </Button>
          </Link>
          <Link to="/talents">
            <Button
              size="default"
              variant="ghost"
              className="text-sm font-medium text-gray-700 hover:text-cpg-teal hover:bg-cpg-teal/5 rounded-xl px-4"
            >
              <Users className="h-4 w-4 mr-2" />
              Talent
            </Button>
          </Link>
          <Link to="/services">
            <Button
              size="default"
              variant="ghost"
              className="text-sm font-medium text-gray-700 hover:text-cpg-teal hover:bg-cpg-teal/5 rounded-xl px-4"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Services
            </Button>
          </Link>

          <div className="w-px h-6 bg-gray-200 mx-2" />

          <SignedOut>
            <Button
              size="default"
              variant="default"
              className="bg-cpg-teal text-white hover:bg-cpg-teal/90 rounded-xl px-6"
              onClick={() => setShowSignIn(true)}
            >
              Login
            </Button>
          </SignedOut>

          <SignedIn>
            <Link to="/post-job">
              <Button
                size="default"
                variant="default"
                className="bg-cpg-brown text-white hover:bg-cpg-brown/90 rounded-xl px-5"
              >
                <PenBox size={18} className="mr-2" />
                Post Job
              </Button>
            </Link>
            {isAdminEmail(user?.primaryEmailAddress?.emailAddress) && (
                <Link to="/user-analytics">
                  <Button
                    size="default"
                    variant="ghost"
                    className="text-sm font-medium text-gray-700 hover:text-cpg-teal hover:bg-cpg-teal/5 rounded-xl px-4"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
              )}
            <UserButton
              showName={false}
              appearance={{
                elements: {
                  userButtonTrigger:
                    "w-10 h-10 rounded-full border-2 border-gray-100 hover:border-cpg-teal/30 transition-colors",
                  userButtonAvatarBox: "w-10 h-10",
                  userButtonAvatarImage: "w-10 h-10",
                },
              }}
            >
              <UserButton.MenuItems>
                {role === ROLE_BRAND && (
                  <UserButton.Link
                    label="View Brand Profile"
                    labelIcon={<BriefcaseBusiness size={16} />}
                    href="/profile/brand"
                  />
                )}
                {role === ROLE_TALENT && (
                  <UserButton.Link
                    label="View Talent Profile"
                    labelIcon={<BriefcaseBusiness size={16} />}
                    href="/talents/:id"
                  />
                )}
                {role === ROLE_SERVICE && (
                  <UserButton.Link
                    label="View Service Profile"
                    labelIcon={<BriefcaseBusiness size={16} />}
                    href="/profile/service"
                  />
                )}

                {isAdminEmail(user?.primaryEmailAddress?.emailAddress) && (
                    <UserButton.Link
                      label="Analytics"
                      labelIcon={<BarChart3 size={16} />}
                      href="/user-analytics"
                    />
                  )}
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center gap-3">
          <SignedIn>
            <UserButton
              showName={false}
              appearance={{
                elements: {
                  userButtonTrigger: "w-9 h-9",
                  userButtonAvatarBox: "w-9 h-9",
                  userButtonAvatarImage: "w-9 h-9",
                },
              }}
            />
          </SignedIn>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-xl"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden mt-4 bg-white border-2 border-gray-100 rounded-2xl p-4 mx-2 space-y-2">
          <Link to="/jobs" onClick={() => setShowMobileMenu(false)}>
            <Button
              variant="ghost"
              size="default"
              className="w-full justify-start rounded-xl hover:bg-cpg-teal/5 hover:text-cpg-teal"
            >
              <Briefcase className="h-4 w-4 mr-3" />
              Jobs
            </Button>
          </Link>
          <Link to="/talents" onClick={() => setShowMobileMenu(false)}>
            <Button
              variant="ghost"
              size="default"
              className="w-full justify-start rounded-xl hover:bg-cpg-teal/5 hover:text-cpg-teal"
            >
              <Users className="h-4 w-4 mr-3" />
              Talent
            </Button>
          </Link>
          <Link to="/services" onClick={() => setShowMobileMenu(false)}>
            <Button
              variant="ghost"
              size="default"
              className="w-full justify-start rounded-xl hover:bg-cpg-teal/5 hover:text-cpg-teal"
            >
              <Building2 className="h-4 w-4 mr-3" />
              Services
            </Button>
          </Link>

          <div className="h-px bg-gray-100 my-3" />

          <SignedOut>
            <Button
              size="default"
              variant="default"
              className="w-full bg-cpg-teal text-white hover:bg-cpg-teal/90 rounded-xl"
              onClick={() => {
                setShowSignIn(true);
                setShowMobileMenu(false);
              }}
            >
              Login
            </Button>
          </SignedOut>

          <SignedIn>
            <Link to="/post-job" onClick={() => setShowMobileMenu(false)}>
              <Button
                variant="default"
                size="default"
                className="w-full bg-cpg-brown text-white hover:bg-cpg-brown/90 rounded-xl"
              >
                <PenBox size={18} className="mr-2" />
                Post Job
              </Button>
            </Link>
          </SignedIn>
        </div>
      )}

      {/* Sign-In Modal */}
      {showSignIn && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleOverlayClick}
        >
          <div
            className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
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

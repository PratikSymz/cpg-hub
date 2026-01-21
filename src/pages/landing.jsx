// landing.jsx
import React, { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button.jsx";
import { products } from "@/constants/products.js";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Briefcase,
  Users,
  Building2,
  ArrowRight,
  Search,
  Plus,
} from "lucide-react";
import OnboardingPromptDialog from "@/components/onboarding-prompt-dialog.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import { syncUserProfile } from "@/api/apiUsers.js";
import { ROLE_BRAND, ROLE_TALENT, ROLE_SERVICE } from "@/constants/roles.js";
import { getMyBrands } from "@/api/apiBrands.js";

// Icon mapping for each product
const productIcons = {
  1: Briefcase, // Fractional Job Board
  2: Users,     // Directory of Talent
  3: Building2, // Directory of Services
};

const LandingPage = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { redirectToSignUp } = useClerk();
  const roles = Array.isArray(user?.unsafeMetadata?.roles)
    ? user.unsafeMetadata.roles
    : [];
  const onboarded = roles.length > 0;

  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  const handleSecondarySubmit = (product) => {
    // Wait for Clerk to load before checking auth status
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      // Use Clerk's built-in redirect which works in both dev and prod
      redirectToSignUp();
      return;
    }

    const targetRole = product.secondaryButton.role;
    const alreadyHasTargetRole = roles.includes(targetRole);

    if (targetRole === ROLE_BRAND && alreadyHasTargetRole) {
      navigate(product.secondaryButton.link);
      return;
    }

    setSelectedProduct(product);
  };

  const { func: updateUserProfile } = useFetch(syncUserProfile);
  const { func: fetchBrands } = useFetch(getMyBrands);

  useEffect(() => {
    if (isSignedIn && isLoaded && user) {
      updateUserProfile({
        user_id: user?.id,
        full_name: user?.fullName || "",
        email: user?.primaryEmailAddress?.emailAddress || "",
        profile_picture_url: user?.imageUrl || "",
      });

      // Sync brand role if user has brands but role is missing
      const syncBrandRole = async () => {
        const existingRoles = Array.isArray(user?.unsafeMetadata?.roles)
          ? user.unsafeMetadata.roles
          : [];

        // Only check if user doesn't have brand role
        if (!existingRoles.includes(ROLE_BRAND)) {
          const result = await fetchBrands({ user_id: user.id });
          const brandsData = result?.data || [];

          if (brandsData.length > 0) {
            await user.update({
              unsafeMetadata: { roles: [...existingRoles, ROLE_BRAND] },
            });
          }
        }
      };

      syncBrandRole();
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <main className="py-10">
      {/* Hero Section */}
      <section className="w-5/6 mx-auto mb-12">
        <h1 className="gradient-title font-extrabold text-4xl sm:text-5xl lg:text-6xl text-center">
          Your CPG Community
        </h1>
        <p className="text-center text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
          Connect with fractional talent, discover services, and find your next opportunity in the CPG industry.
        </p>
      </section>

      {/* Products Grid */}
      <section className="w-5/6 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const targetRole = product.secondaryButton.role;
            const alreadyHasTargetRole = roles.includes(targetRole);
            const IconComponent = productIcons[product.id] || Briefcase;
            const isLocked = !onboarded || !alreadyHasTargetRole;

            return (
              <div
                key={product.id}
                className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-cpg-teal/30 hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* Icon */}
                <div className="bg-cpg-teal/10 rounded-xl p-4 w-fit mb-6">
                  <IconComponent className="h-8 w-8 text-cpg-teal" />
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {product.title}
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-sm flex-1 mb-6">
                  {product.description}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {/* Primary Button - Explore */}
                  <Button
                    asChild
                    variant="default"
                    className="w-full bg-cpg-teal hover:bg-cpg-teal/90 rounded-xl h-12 text-base group"
                  >
                    <Link
                      to={product.primaryButton.link}
                      className="flex items-center justify-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      {product.primaryButton.label}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>

                  {/* Secondary Button - Post/Add */}
                  <Button
                    variant="outline"
                    className={`w-full rounded-xl h-12 text-base border-2 ${
                      isLocked
                        ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                        : "border-cpg-brown text-cpg-brown hover:bg-cpg-brown/5"
                    }`}
                    onClick={() => handleSecondarySubmit(product)}
                  >
                    {isLocked ? (
                      <Lock className="h-4 w-4 mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {product.secondaryButton.label}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <OnboardingPromptDialog
        open={!!selectedProduct}
        setOpen={() => setSelectedProduct(null)}
        role={selectedProduct?.secondaryButton.role}
      />
    </main>
  );
};

export default LandingPage;

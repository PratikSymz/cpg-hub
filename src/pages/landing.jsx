// landing.jsx
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { products } from "@/constants/products.js";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import OnboardingPromptDialog from "@/components/onboarding-prompt-dialog.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import { syncUserProfile } from "@/api/apiUsers.js";
import { ROLE_BRAND } from "@/constants/roles.js";

const LandingPage = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const roles = Array.isArray(user?.unsafeMetadata?.roles)
    ? user.unsafeMetadata.roles
    : [];
  const onboarded = roles.length > 0;

  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  const handleSecondarySubmit = (product) => {
    if (!isSignedIn) {
      window.location.href = "https://accounts.mycpghub.com/sign-up";
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

  useEffect(() => {
    if (isSignedIn && isLoaded && user) {
      updateUserProfile({
        user_id: user?.id,
        full_name: user?.fullName || "",
        email: user?.primaryEmailAddress?.emailAddress || "",
        profile_picture_url: user?.imageUrl || "",
      });
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <main>
      <section className="w-full py-10 px-4">
        <div className="text-center mb-10 bg-cpg-brown/5 rounded-lg">
          <h1 className="text-xl sm:text-2xl md:text-3xl text-cpg-brown font-bold py-6">
            Welcome to your professional CPG Community
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center max-w-6xl mx-auto">
          {products.map((product, index) => {
            const targetRole = product.secondaryButton.role;
            const alreadyHasTargetRole = roles.includes(targetRole);

            return (
              <Card
                key={index}
                className="w-full max-w-xs flex flex-col justify-between p-6 rounded-2xl border border-cpg-brown bg-cpg-brown/5 shadow-sm"
              >
                <CardHeader className="gap-2">
                  <CardTitle className="h-40 sm:h-52 md:h-64 text-center grid place-items-center text-cpg-teal font-semibold text-xl sm:text-2xl">
                    {product.title}
                  </CardTitle>
                </CardHeader>

                <div className="p-0 font-[400] text-neutral-600 text-sm sm:text-base">
                  {product.description}
                </div>

                <CardFooter className="flex flex-col sm:flex-row px-0 mt-6 gap-3 w-full">
                  <div className="w-full">
                    <Button
                      asChild
                      size="lg"
                      variant="default"
                      className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-base px-5 py-2"
                    >
                      <Link to={product.primaryButton.link}>
                        {product.primaryButton.label}
                      </Link>
                    </Button>
                  </div>
                  <div className="w-full">
                    <Button
                      size="lg"
                      variant="default"
                      className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-base px-5 py-2"
                      onClick={() => handleSecondarySubmit(product)}
                    >
                      {(!onboarded || !alreadyHasTargetRole) && (
                        <Lock size={20} className="inline-block mr-2" />
                      )}
                      {product.secondaryButton.label}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <OnboardingPromptDialog
          open={!!selectedProduct}
          setOpen={() => setSelectedProduct(null)}
          role={selectedProduct?.secondaryButton.role}
        />
      </section>
    </main>
  );
};

export default LandingPage;

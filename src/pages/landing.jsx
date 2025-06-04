import React, { useEffect, useState } from "react";
import { SignIn, useUser } from "@clerk/clerk-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { products } from "@/constants/products.js";
import { Link, useNavigate } from "react-router-dom";
import CoincentricCircles from "@/components/CoincentricCircles.jsx";
import { Lock } from "lucide-react";
import OnboardingPromptDialog from "@/components/onboarding-prompt-dialog.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import { syncUserProfile } from "@/api/apiUsers.js";
import { ROLE_BRAND } from "@/constants/roles.js";

const LandingPage = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const role = user?.unsafeMetadata?.role;
  const onboarded = role !== undefined;

  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  const handleSecondarySubmit = (product) => {
    if (!isSignedIn) {
      // Not signed in — redirect to sign-up first
      window.location.href = "https://accounts.mycpghub.com/sign-up";
      return;
    }

    const isFirstTime = !onboarded;
    const isSameRole = role === product.secondaryButton.role;
    const isDifferentRole = onboarded && !isSameRole;

    if (isFirstTime || isDifferentRole) {
      setSelectedProduct(product); // show dialog
    } else if (role === ROLE_BRAND) {
      // Allow brands to proceed with posting jobs
      navigate(product.secondaryButton.link);
    } else {
      // Block talents/services from re-onboarding
      setSelectedProduct(product);
    }
  };

  const { func: updateUserProfile, data } = useFetch(syncUserProfile);

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
      <section className="w-full py-16">
        {/* Heading */}
        {/* <div className="text-center mb-10 bg-cpg-brown/5">
          <h1 className="text-2xl text-cpg-brown font-bold p-5 mb-24">
            Welcome to your professional CPG Community
          </h1>
        </div> */}

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 max-w-6xl mx-auto px-4">
          {products.map((product, index) => (
            <Card
              key={index}
              className="flex flex-col justify-between p-6 rounded-2xl border border-cpg-brown bg-cpg-brown/5 shadow-sm"
            >
              <CardHeader className="gap-2">
                <CardTitle className="h-64 text-center content-center place-items-center text-cpg-teal font-semibold text-2xl">
                  {product.title}
                </CardTitle>
              </CardHeader>

              {/* <div className="flex items-center gap-3 text-sm font-bold">
                  <span className="rounded bg-[#F5D04E] px-2 py-1 shadow-[1px_1px_1px_0_rgba(0,0,0,.2)]">
                    {"lol"}
                  </span>
                </div> */}

              <div className="p-0 font-[400] text-neutral-600 text-base">
                {product.description}
              </div>

              <CardFooter className="flex flex-row px-0 mt-6 gap-4">
                <div className="flex-1">
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
                <div className="flex-1">
                  <Button
                    size="lg"
                    variant="default"
                    className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-base px-5 py-2"
                    onClick={() => handleSecondarySubmit(product)}
                    disabled={
                      onboarded &&
                      role !== ROLE_BRAND &&
                      role === product.secondaryButton.role
                    }
                    // disabled={
                    //   role && product.secondaryButton.role !== role
                    //     ? true
                    //     : false
                    // }
                  >
                    {(!onboarded || role !== product.secondaryButton.role) && (
                      <Lock size={20} />
                    )}
                    {product.secondaryButton.label}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Dialog */}
        <OnboardingPromptDialog
          open={!!selectedProduct}
          setOpen={() => setSelectedProduct(null)}
          role={selectedProduct && selectedProduct.secondaryButton.role}
          currentRole={role}
          isFirstTime={!onboarded}
        />
      </section>
    </main>
  );
};

export default LandingPage;

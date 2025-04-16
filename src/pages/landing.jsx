import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
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

const LandingPage = () => {
  const { user } = useUser();
  const role = user?.unsafeMetadata?.role;
  const onboarded = role !== undefined;

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSecondarySubmit = (product) => {
    if (!onboarded || role !== product.secondaryButton.role) {
      setOpen(true);
    } else {
      navigate(product.secondaryButton.link);
    }
  };

  // to={
  //   role === product.secondaryButton.role &&
  //   product.secondaryButton.link
  // }

  return (
    <main>
      <section className="w-full py-12">
        {/* Heading */}
        <div className="text-center mb-10 bg-cpg-brown/5">
          <h1 className="text-xl text-cpg-brown font-bold p-2 mb-24">
            Welcome to your professional CPG Community
          </h1>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
          {products.map((product, index) => (
            <Card
              key={index}
              className="flex flex-col justify-between p-6 rounded-2xl border border-cpg-brown bg-cpg-brown/5 shadow-sm"
            >
              <CardHeader className="gap-2">
                <CardTitle className="h-64 text-center content-center place-items-center text-cpg-teal font-semibold text-xl">
                  {product.title}
                </CardTitle>
              </CardHeader>

              {/* <div className="flex items-center gap-3 text-sm font-bold">
                  <span className="rounded bg-[#F5D04E] px-2 py-1 shadow-[1px_1px_1px_0_rgba(0,0,0,.2)]">
                    {"lol"}
                  </span>
                </div> */}

              <div className="p-0 font-[400] text-neutral-600">
                {product.description}
              </div>

              <CardFooter className="flex flex-row px-0 mt-6 gap-4">
                <Link to={product.primaryButton.link} className="flex-1">
                  <Button
                    size="lg"
                    variant="default"
                    className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-5 py-2"
                  >
                    {product.primaryButton.label}
                  </Button>
                </Link>
                <div className="flex-1">
                  <OnboardingPromptDialog
                    open={open}
                    setOpen={setOpen}
                    product={product.secondaryButton}
                  />
                  <Button
                    size="lg"
                    variant="default"
                    className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-5 py-2"
                    onClick={() => handleSecondarySubmit(product)}
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
      </section>
    </main>
  );
};

export default LandingPage;

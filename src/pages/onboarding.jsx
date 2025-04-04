import { Button } from "@/components/ui/button.jsx";
import { ROLE_BRAND, ROLE_SERVICE, ROLE_TALENT } from "@/constants/roles.js";
import { useUser } from "@clerk/clerk-react";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";

function Onboarding() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const navigateUser = (currRole) => {
    navigate(currRole !== ROLE_TALENT ? "/post-job" : "/jobs");
  };

  const handleRoleSelection = async (role) => {
    await user
      .update({ unsafeMetadata: { role } })
      .then(() => {
        console.log(`Role updated to: ${role}`);
        navigateUser(role);
      })
      .catch((err) => {
        console.error("Error updating role:", err);
      });
  };

  useEffect(() => {
    if (user?.unsafeMetadata?.role) {
      navigateUser(user.unsafeMetadata.role);
    }
  }, [user]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"90%"} color="#00A19A" />;
  }

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h2 className="font-extrabold text-3xl sm:text-4xl -tracking-normal">
        I am a...
      </h2>
      <div className="mt-12 grid grid-cols-3 gap-4 w-full md:px-40">
        <Button
          variant="default"
          size="default"
          className="h-32 text-2xl bg-cpg-brown hover:bg-cpg-brown/90"
          onClick={() => handleRoleSelection(ROLE_BRAND)}
        >
          Brand
        </Button>
        <Button
          variant="default"
          size="default"
          className="h-32 text-2xl bg-cpg-brown hover:bg-cpg-brown/90"
          onClick={() => handleRoleSelection(ROLE_TALENT)}
        >
          Fractional Talent
        </Button>
        <Button
          variant="default"
          size="default"
          className="h-32 text-2xl bg-cpg-brown hover:bg-cpg-brown/90"
          onClick={() => handleRoleSelection(ROLE_SERVICE)}
        >
          Service
        </Button>
      </div>
    </div>
  );
}

export default Onboarding;

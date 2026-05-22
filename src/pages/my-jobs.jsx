import React from "react";
import { ROLE_TALENT } from "@/constants/roles.js";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import CreatedApplications from "@/components/created-applications.jsx";
import CreatedJobs from "@/components/created-jobs.jsx";
import { useUserRoles } from "@/hooks/use-user-roles.jsx";

const MyJobs = () => {
  const { isLoaded } = useUser();
  const isTalent = useUserRoles().includes(ROLE_TALENT);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div>
      <h1 className="gradient-title font-extrabold text-5xl sm:text-7xl text-center pb-8">
        {isTalent ? "My Applications" : "My Jobs"}
      </h1>
      {isTalent ? <CreatedApplications /> : <CreatedJobs />}
    </div>
  );
};

export default MyJobs;

import React from "react";
import { getSavedJobs } from "@/api/apiFractionalJobs.js";
import JobCard from "@/components/job-card.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { BarLoader } from "react-spinners";

const SavedJobs = () => {
  const { isLoaded } = useUser();

  const {
    loading: loadingSavedJobs,
    data: savedJobs,
    func: funcSavedJobs,
  } = useFetch(getSavedJobs);

  useEffect(() => {
    if (isLoaded) {
      funcSavedJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  if (!isLoaded || loadingSavedJobs) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="w-full px-4 sm:px-6 py-10 max-w-6xl mx-auto flex flex-col gap-10">
      <h1 className="gradient-title font-extrabold text-5xl lg:text-6xl text-center pb-8">
        Saved Jobs
      </h1>

      {loadingSavedJobs === false && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedJobs?.length ? (
            savedJobs?.map((saved) => {
              // console.log(saved);
              return (
                <JobCard
                  key={saved.id}
                  job={saved?.job}
                  onJobAction={funcSavedJobs}
                  isMySubmission={true}
                />
              );
            })
          ) : (
            <div>No Saved Jobs 👀</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;

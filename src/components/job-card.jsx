import React, { useEffect, useState } from "react";
import { Heart, MapPinIcon, Trash2Icon } from "lucide-react";
import { Button } from "./ui/button.jsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card.jsx";
import { Link } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { deleteJob, saveJob } from "@/api/apiFractionalJobs.js";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";

const JobCard = ({
  job,
  isMySubmission = false,
  isSaved = false,
  onJobAction = () => {},
}) => {
  const [saved, setSaved] = useState(isSaved);
  const { user } = useUser();
  
  // Saving jobs
  const {
    loading: loadingSavedJob,
    data: savedJob,
    func: funcSavedJob,
  } = useFetch(saveJob);

  const handleSaveJob = async () => {
    await funcSavedJob({
      user_id: user.id,
      job_id: job.id,
    });
    onJobAction();
  };

  // Deleting job
  const { loading: loadingDeleteJob, func: funcDeleteJob } = useFetch(
    deleteJob,
    {
      job_id: job.id,
    }
  );

  const handleDeleteJob = async () => {
    await funcDeleteJob();
    onJobAction();
  };

  useEffect(() => {
    if (savedJob !== undefined) setSaved(savedJob?.length > 0);
  }, [savedJob]);

  return (
    <Card className="flex flex-col">
      {loadingDeleteJob && (
        <BarLoader className="mt-4" width={"100%"} color="#36d7b7" />
      )}

      <CardHeader className="flex">
        <CardTitle className="flex justify-between font-bold text-black/90">
          {job.job_title}
          {isMySubmission && (
            <Trash2Icon
              fill="red"
              size={18}
              className="text-red-300 cursor-pointer"
              onClick={handleDeleteJob}
            />
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 flex-1">
        <div className="flex justify-between">
          <div className="flex flex-row gap-4">
            {job.brand && <img src={job.brand.logo_url} className="h-6" />}
            {job.brand && job.brand.brand_name}
          </div>
          <div className="flex gap-2 items-center text-black/90">
            <MapPinIcon size={15} /> {job.brand && job.brand.brand_hq}
          </div>
        </div>
        <hr />
        {/* <p className="text-black/80">
          {job.preferred_experience.substring(
            0,
            job.preferred_experience.indexOf(".")
          )}
          .
        </p> */}
        <div className="flex justify-between">
          <div className="flex gap-2 items-center text-black/90">
            {"Scope of Work: "} {job.scope_of_work}
          </div>
          <div className="flex gap-2 items-center text-black/90">
            {"Area of Specialization: "}{" "}
            {JSON.parse(job.area_of_specialization).join(", ")}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Link to={`/job/${job.id}`} className="flex-1">
          <Button
            variant="secondary"
            size="default"
            className="w-full text-black/90"
          >
            More Details
          </Button>
        </Link>
        {/* Handle save */}
        {!isMySubmission && (
          <Button
            variant="outline"
            size="default"
            className="w-15"
            onClick={handleSaveJob}
            disabled={loadingSavedJob}
          >
            {saved ? (
              <Heart size={20} fill="red" stroke="red" />
            ) : (
              <Heart size={20} />
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default JobCard;

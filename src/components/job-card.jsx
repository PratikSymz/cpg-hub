import React, { useEffect, useState } from "react";
import { Heart, MapPinIcon, Trash, Trash2, Trash2Icon } from "lucide-react";
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
import { FaGlobe, FaLinkedin } from "react-icons/fa";

const JobCard = ({
  job,
  isMySubmission = false,
  isSaved = false,
  onJobAction = () => {},
}) => {
  const [saved, setSaved] = useState(isSaved);
  const { user } = useUser();

  // Job Info
  const { scope_of_work, job_title, area_of_specialization } = job || {};

  // Brand info
  const { brand_name, website, linkedin_url, brand_hq, logo_url, user_id } =
    job.brand || {};

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

      <CardHeader className="flex flex-col">
        <CardTitle className="flex justify-between items-center text-lg font-normal w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
            <div className="flex items-center gap-4 w-full">
              {job.brand && (
                <img
                  src={logo_url}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              )}
              <div className="flex flex-col w-full">
                <div className="flex flex-row justify-between items-center w-full">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {job.brand && brand_name}
                    </h1>
                  </div>
                  <div className="flex flex-row gap-2 items-center text-black/90">
                    <MapPinIcon size={15} /> {job.brand && brand_hq}
                  </div>
                </div>

                <div className="flex flex-row gap-4 mt-2">
                  {/* {linkedin_url && (
                    <Link to={linkedin_url}>
                      <FaLinkedin
                        className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110"
                        style={{ color: "#0072b1" }}
                      />
                    </Link>
                  )} */}
                  {job.brand && (
                    <Link to={website}>
                      <FaGlobe className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardTitle>

        <div className="flex flex-row justify-between items-center font-bold mt-4 w-full">
          {job_title}
          {isMySubmission && (
            <Trash2Icon
              fill="red"
              size={20}
              className="text-red-200 cursor-pointer"
              onClick={handleDeleteJob}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 text-sm text-black/90">
        <hr />
        <p>
          <strong>Scope of Work:</strong>{" "}
          <span className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 mx-1 rounded-full">
            {scope_of_work || "N/A"}
          </span>
        </p>
        <p>
          <strong>Area of Specialization:</strong>{" "}
          {JSON.parse(area_of_specialization).map((level, idx) => (
            <span
              key={idx}
              className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 mx-1 rounded-full"
            >
              {level}
            </span>
          )) || "N/A"}
        </p>
      </CardContent>

      <CardFooter className="flex gap-6">
        <Button
          variant="default"
          size="default"
          className="flex-1 bg-cpg-brown hover:bg-cpg-brown/90"
          asChild
        >
          <Link to={`/job/${job.id}`}>More Details</Link>
        </Button>

        {/* Handle save */}
        {!isMySubmission && (
          <Button
            variant="outline"
            size="default"
            className="flex-none w-16"
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

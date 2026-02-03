import React, { useEffect, useState } from "react";
import { MapPin, Clock, Briefcase, Building2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button.jsx";
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

  // Job Info
  const {
    scope_of_work,
    job_title,
    area_of_specialization,
    work_location,
    estimated_hrs_per_wk,
    is_open,
  } = job || {};

  // Poster info - prefer live profile data, fall back to stored snapshot
  const poster_name = job?.poster_profile?.full_name || job?.poster_name || job?.brand?.brand_name || "Unknown";
  const poster_logo = job?.poster_profile?.profile_picture_url || job?.poster_logo || job?.brand?.logo_url;
  const poster_location = job?.poster_location || job?.brand?.brand_hq;

  // Saving jobs
  const {
    loading: loadingSavedJob,
    data: savedJob,
    func: funcSavedJob,
  } = useFetch(saveJob);

  const handleSaveJob = async () => {
    await funcSavedJob({
      user_id: user.id,
      job_id: job?.id,
    });
    onJobAction();
  };

  // Deleting job
  const { loading: loadingDeleteJob, func: funcDeleteJob } = useFetch(
    deleteJob,
    {
      job_id: job?.id,
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
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-cpg-teal/30 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {loadingDeleteJob && (
        <BarLoader className="mb-4" width={"100%"} color="#00A19A" />
      )}

      {/* Job Title - Primary Headline */}
      <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
        {job_title}
      </h2>

      {/* Posted By - Secondary Info */}
      <div className="flex items-center gap-2 mb-4">
        {poster_logo ? (
          <div className="h-8 w-8 rounded-full border border-gray-100 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src={poster_logo}
              alt={poster_name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            <span className="text-gray-500">Posted by </span>
            <span className="font-medium text-gray-700">{poster_name}</span>
            {poster_location && (
              <span className="text-gray-400"> · {poster_location}</span>
            )}
          </p>
        </div>
      </div>

      {/* Job Meta */}
      <div className="flex flex-wrap gap-2 mb-4">
        {scope_of_work && (
          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <Briefcase className="h-3 w-3" />
            {scope_of_work}
          </span>
        )}
        {work_location && (
          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {work_location}
          </span>
        )}
        {estimated_hrs_per_wk && (
          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            {estimated_hrs_per_wk} hrs/wk
          </span>
        )}
      </div>

      {/* Specializations */}
      {area_of_specialization && area_of_specialization.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {area_of_specialization.slice(0, 3).map((spec, idx) => (
            <span
              key={idx}
              className="bg-cpg-teal/10 text-cpg-teal text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {spec}
            </span>
          ))}
          {area_of_specialization.length > 3 && (
            <span className="text-xs text-muted-foreground px-2 py-1">
              +{area_of_specialization.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Status Badge */}
      {is_open === false && (
        <div className="mb-4">
          <span className="bg-red-50 text-red-600 text-xs font-medium px-2.5 py-1 rounded-full">
            Closed
          </span>
        </div>
      )}

      {/* Spacer to push button to bottom */}
      <div className="flex-1" />

      {/* Action Button */}
      <Button
        variant="default"
        className="w-full bg-cpg-brown hover:bg-cpg-brown/90 rounded-xl mt-4 group"
        asChild
      >
        <Link to={`/job/${job?.id}`} className="flex items-center justify-center gap-2">
          View Details
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
};

export default JobCard;

import React, { useEffect } from "react";
import { BarLoader } from "react-spinners";
import MDEditor from "@uiw/react-md-editor";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Briefcase, DoorClosed, DoorOpen, MapPinIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { ApplyJobDrawer } from "@/components/apply-job.jsx";
import ApplicationCard from "@/components/application-card.jsx";
import useFetch from "@/hooks/use-fetch.jsx";

import { getSingleJob, updateHiringStatus } from "@/api/apiFractionalJobs.js";

const FractionalJobDetail = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();

  // Load job
  const {
    loading: loadingJob,
    data: job,
    func: funcJob,
  } = useFetch(getSingleJob, {
    job_id: id,
  });

  useEffect(() => {
    if (isLoaded) funcJob();
  }, [isLoaded]);

  // Load hiring status
  const { loading: loadingHiringStatus, func: funcHiringStatus } = useFetch(
    updateHiringStatus,
    { job_id: id }
  );

  // Update hiring status and re-fetch job details
  const handleStatusChange = (value) => {
    const isOpen = value === "open";
    funcHiringStatus(isOpen).then(() => funcJob());
  };

  if (!isLoaded || loadingJob) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="flex flex-col gap-8 mt-5">
      <div className="flex flex-col-reverse gap-6 md:flex-row justify-between items-center">
        <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-6xl">
          {job?.job_title}
        </h1>
        <img
          src={job?.company?.brand_logo_url}
          className="h-12"
          alt={job?.job_title}
        />
      </div>

      <div className="flex justify-between ">
        <div className="flex gap-2">
          <MapPinIcon /> {job?.company_hq}
        </div>
        <div className="flex gap-2">
          <Briefcase /> {job?.applications?.length} Applicants
        </div>
        <div className="flex gap-2">
          {job?.isOpen ? (
            <>
              <DoorOpen /> Open
            </>
          ) : (
            <>
              <DoorClosed /> Closed
            </>
          )}
        </div>
      </div>

      {/* Scope of Work and Level of Exp */}
      <div className="flex justify-between ">
        <div className="flex gap-2">
          <MapPinIcon /> {job?.company_hq}
        </div>
        <div className="flex gap-2">
          <Briefcase /> {job?.applications?.length} Applicants
        </div>
        <div className="flex gap-2">
          {job?.isOpen ? (
            <>
              <DoorOpen /> Open
            </>
          ) : (
            <>
              <DoorClosed /> Closed
            </>
          )}
        </div>
      </div>

      {/* Work Location and Hrs per week */}
      <div className="flex justify-between ">
        <div className="flex gap-2">
          {job?.work_location}
        </div>
        <div className="flex gap-2">
          {job?.estimated_hrs_per_wk} hrs/wk
        </div>
      </div>

      {/* Hiring Status */}
      {job?.recruiter_id === user?.id && (
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`w-full ${job?.isOpen ? "bg-green-950" : "bg-red-950"}`}
          >
            <SelectValue
              placeholder={
                "Hiring Status " + (job?.isOpen ? "( Open )" : "( Closed )")
              }
            />
          </SelectTrigger>
          <SelectContent className="">
            <SelectItem className="" value="open">
              Open
            </SelectItem>
            <SelectItem className="" value="closed">
              Closed
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      <h2 className="text-2xl sm:text-3xl font-bold">Area of Specialization</h2>
      <div className="flex flex-wrap gap-2 mt-2">
        {job?.area_of_specialization.map((area, idx) => (
          <span key={idx}
            className="inline-block bg-teal-100 text-cpg-teal text-xs font-medium px-3 py-1 rounded-full"
          >
            {area}
          </span>
        ))}
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold">Preferred Experience</h2>
      <MDEditor.
// @ts-ignore
      Markdown
        source={job?.preferred_experience}
        className="bg-transparent sm:text-lg" // add global ul styles - tutorial
      />
      {job?.recruiter_id !== user?.id && (
        <ApplyJobDrawer
          job={job}
          user={user}
          fetchJob={funcJob}
          applied={job?.applications?.find((ap) => ap.candidate_id === user.id)}
        />
      )}

      {/* Applications */}
      {loadingHiringStatus && <BarLoader width={"100%"} color="#36d7b7" />}
      {job?.applications?.length > 0 && job?.recruiter_id === user?.id && (
        <div className="flex flex-col gap-2">
          <h2 className="font-bold mb-4 text-xl ml-1">Applications</h2>
          {job?.applications.map((application) => {
            return (
              <ApplicationCard key={application.id} application={application} />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FractionalJobDetail;

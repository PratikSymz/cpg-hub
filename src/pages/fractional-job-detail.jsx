import React, { useEffect } from "react";
import { BarLoader } from "react-spinners";
import MDEditor from "@uiw/react-md-editor";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { DoorClosed, DoorOpen } from "lucide-react";
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
import { Label } from "@radix-ui/react-label";
import { FaGlobe, FaLinkedin } from "react-icons/fa";
import { Button } from "@/components/ui/button.jsx";

const className = "";
const FractionalJobDetail = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();

  // Load job
  const {
    loading: loadingJob,
    data: job,
    func: funcJob,
  } = useFetch(getSingleJob);

  useEffect(() => {
    if (isLoaded) funcJob({ job_id: id });
  }, [isLoaded]);

  // Job Info
  const {
    preferred_experience,
    level_of_experience,
    work_location,
    scope_of_work,
    job_title,
    estimated_hrs_per_wk,
    area_of_specialization,
    is_open,
  } = job || {};

  // Brand info
  const { brand_name, website, linkedin_url, brand_hq, logo_url, user_id } =
    (job && job.brand) || {};

  // Load hiring status
  const { loading: loadingHiringStatus, func: funcHiringStatus } =
    useFetch(updateHiringStatus);

  // Update hiring status and re-fetch job details
  const handleStatusChange = (value) => {
    const isOpen = value === "open";
    funcHiringStatus({ is_open: isOpen, job_id: id }).then(() =>
      funcJob({ job_id: id })
    );
  };

  if (!isLoaded || loadingJob) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    // <div className="flex flex-col gap-8 mt-5">
    //   <div className="flex flex-col-reverse gap-6 md:flex-row justify-between items-center">
    //     <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-6xl">
    //       {job?.job_title}
    //     </h1>
    //     <img src={job?.brand?.logo_url} className="h-12" alt={job?.job_title} />
    //   </div>

    //   <div className="flex justify-between ">
    //     <div className="flex gap-2">
    //       <MapPinIcon /> {job?.brand?.brand_hq}
    //     </div>
    //     <div className="flex gap-2">
    //       <Briefcase /> {job?.applications?.length} Applicants
    //     </div>
    //     <div className="flex gap-2">
    //       {job?.is_open ? (
    //         <>
    //           <DoorOpen /> Open
    //         </>
    //       ) : (
    //         <>
    //           <DoorClosed /> Closed
    //         </>
    //       )}
    //     </div>
    //   </div>

    //   {/* Scope of Work and Level of Exp */}
    //   <div className="flex justify-between ">
    //     <div className="flex gap-2">
    //       <MapPinIcon /> {job?.brand?.brand_hq}
    //     </div>
    //     <div className="flex gap-2">
    //       <Briefcase /> {job?.applications?.length} Applicants
    //     </div>
    //     <div className="flex gap-2">
    //       {job?.is_open ? (
    //         <>
    //           <DoorOpen /> Open
    //         </>
    //       ) : (
    //         <>
    //           <DoorClosed /> Closed
    //         </>
    //       )}
    //     </div>
    //   </div>

    //   {/* Work Location and Hrs per week */}
    //   <div className="flex justify-between ">
    //     <div className="flex gap-2">{job?.work_location}</div>
    //     <div className="flex gap-2">{job?.estimated_hrs_per_wk} hrs/wk</div>
    //   </div>

    //   {/* Hiring Status */}
    //   {job?.brand_id === user?.id && (
    //     <Select onValueChange={handleStatusChange}>
    //       <SelectTrigger
    //         className={`w-full ${job?.is_open ? "bg-green-950" : "bg-red-950"}`}
    //       >
    //         <SelectValue
    //           placeholder={
    //             "Hiring Status " + (job?.is_open ? "( Open )" : "( Closed )")
    //           }
    //         />
    //       </SelectTrigger>
    //       <SelectContent className="">
    //         <SelectItem className="" value="open">
    //           Open
    //         </SelectItem>
    //         <SelectItem className="" value="closed">
    //           Closed
    //         </SelectItem>
    //       </SelectContent>
    //     </Select>
    //   )}

    //   <h2 className="text-2xl sm:text-3xl font-bold">Area of Specialization</h2>
    //   <div className="flex flex-wrap gap-2 mt-2">
    //     {job && JSON.parse(job.area_of_specialization).map((area, idx) => (
    //       <span
    //         key={idx}
    //         className="inline-block bg-teal-100 text-cpg-teal text-xs font-medium px-3 py-1 rounded-full"
    //       >
    //         {area}
    //       </span>
    //     ))}
    //   </div>

    //   <h2 className="text-2xl sm:text-3xl font-bold">Preferred Experience</h2>
    //   <MDEditor.Markdown
    //     source={job?.preferred_experience}
    //     className="bg-transparent sm:text-lg" // add global ul styles - tutorial
    //   />
    //   {job?.brand_id !== user?.id && (
    //     <ApplyJobDrawer
    //       job={job}
    //       user={user}
    //       fetchJob={funcJob}
    //       applied={job?.applications?.find((ap) => ap.user_id === user.id)}
    //     />
    //   )}

    //   {/* Applications */}
    //   {loadingHiringStatus && <BarLoader width={"100%"} color="#36d7b7" />}
    //   {job?.applications?.length > 0 && job?.brand_id === user?.id && (
    //     <div className="flex flex-col gap-2">
    //       <h2 className="font-bold mb-4 text-xl ml-1">Applications</h2>
    //       {job?.applications.map((application) => {
    //         return (
    //           <ApplicationCard key={application.id} application={application} />
    //         );
    //       })}
    //     </div>
    //   )}
    // </div>
    <div className="flex flex-col gap-10 mt-10 px-10">
      {/* New Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={job?.brand && logo_url}
            alt="Profile"
            className="h-22 w-22 rounded-full border object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold">{job?.brand && brand_name}</h1>
            <div className="flex flex-row gap-4 mt-2">
              {job?.brand && linkedin_url && (
                <Link to={linkedin_url}>
                  <FaLinkedin
                    className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110"
                    style={{ color: "#0072b1" }}
                  />
                </Link>
              )}
              {job?.brand && (
                <Link to={website}>
                  <FaGlobe className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* {job?.brand && user_id !== user.id && (
          <div className="flex flex-col gap-2 text-sm">
            <Button
              variant="outline"
              size="lg"
              className="rounded-3xl px-7 py-5"
              onClick={() => setDialogOpen(true)}
              disabled={!!connection?.status}
            >
              {labelByStatus[connection?.status] || "Connect"}
            </Button>
            <ConnectDialog
              open={dialogOpen}
              setOpen={setDialogOpen}
              onSend={handleSendRequest}
            />
          </div>
        )} */}
      </div>

      {/* Section: Summary Info */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-muted rounded-md p-4">
          <Label className="text-xs text-muted-foreground uppercase">
            Location
          </Label>
          <p className="text-sm font-medium mt-1">{brand_hq || "Remote"}</p>
        </div>
        {/* <div className="bg-muted rounded-md p-4">
          <Label className="text-xs text-muted-foreground uppercase">
            Applicants
          </Label>
          <p className="text-sm font-medium mt-1">
            {job?.applications?.length} total
          </p>
        </div>
        <div className="bg-muted rounded-md p-4">
          <Label className="text-xs text-muted-foreground uppercase">
            Status
          </Label>
          <div className="mt-1 flex items-center gap-2">
            {job && is_open ? (
              <>
                <DoorOpen className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Open</span>
              </>
            ) : (
              <>
                <DoorClosed className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-600">Closed</span>
              </>
            )}
          </div>
        </div> */}
      </div>

      {/* Section: Details */}
      <h1 className="text-4xl font-extrabold">{job?.job_title}</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-semibold block mb-2">
            Scope of Work
          </Label>
          <span className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full">
            {job && scope_of_work}
          </span>
        </div>
        <div>
          <Label className="text-sm font-semibold block mb-2">
            Work Location
          </Label>
          <span className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full">
            {job && work_location}
          </span>
        </div>
        <div>
          <Label className="text-sm font-semibold block mb-2">
            Weekly Hours
          </Label>
          <span className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full">
            {job && estimated_hrs_per_wk} hrs/week
          </span>
        </div>
        <div>
          <Label className="text-sm font-semibold block mb-2">
            Experience Level
          </Label>
          <div className="flex flex-wrap gap-2">
            {job &&
              JSON.parse(level_of_experience).map((level, idx) => (
                <span
                  key={idx}
                  className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full"
                >
                  {level}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Section: Specialization Tags */}
      <div>
        <Label className="text-sm font-semibold block mb-2">
          Area of Specialization
        </Label>
        <div className="flex flex-wrap gap-2">
          {job?.area_of_specialization &&
            JSON.parse(job.area_of_specialization).map((area, idx) => (
              <span
                key={idx}
                className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full"
              >
                {area}
              </span>
            ))}
        </div>
      </div>

      {/* Section: Preferred Experience */}
      <div>
        <Label className="text-sm font-semibold block mb-2">
          Preferred Experience
        </Label>
        <div
          data-color-mode="light"
          className="prose prose-sm sm:prose-base bg-white p-4 rounded-lg"
        >
          <MDEditor.Markdown
            className="bg-white"
            source={job?.preferred_experience}
          />
        </div>
      </div>

      {/* Hiring Status Control */}
      {/* {job?.brand_id === user?.id && (
        <div>
          <Label className="text-sm font-semibold block mb-2">
            Hiring Status
          </Label>
          <Select onValueChange={handleStatusChange}>
            <SelectTrigger
              className={`w-full sm:w-64 ${
                job?.is_open ? "bg-green-950" : "bg-red-950"
              } text-white`}
            >
              <SelectValue
                placeholder={`Currently ${job?.is_open ? "Open" : "Closed"}`}
              />
            </SelectTrigger>
            <SelectContent className={className}>
              <SelectItem className={className} value="open">
                Open
              </SelectItem>
              <SelectItem className={className} value="closed">
                Closed
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )} */}

      {/* Apply or Manage */}
      {/* {job?.brand_id !== user?.id && (
        <ApplyJobDrawer
          job={job}
          user={user}
          fetchJob={funcJob}
          applied={job?.applications?.find((ap) => ap.user_id === user.id)}
        />
      )} */}

      {/* Section: Applications (if user owns job) */}
      {/* {loadingHiringStatus && <BarLoader width="100%" color="#36d7b7" />}

      {job?.brand_id === user?.id && job?.applications?.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Applications</h2>
          <div className="flex flex-col gap-4">
            {job.applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
};

export default FractionalJobDetail;

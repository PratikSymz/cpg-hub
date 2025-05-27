import React, { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import MDEditor from "@uiw/react-md-editor";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch.jsx";
import { getSingleJob } from "@/api/apiFractionalJobs.js";
import { Label } from "@radix-ui/react-label";
import { FaGlobe, FaLinkedin } from "react-icons/fa";
import { Button } from "@/components/ui/button.jsx";
import ConnectEmailDialog from "@/components/connect-email-dialog.jsx";
import { toast } from "sonner";
import { getUser } from "@/api/apiUsers.js";
import clsx from "clsx";

const FractionalJobDetail = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();

  // Load Job and Brand info
  const {
    loading: loadingJob,
    data: job,
    func: funcJob,
  } = useFetch(getSingleJob);

  // Load brand owner profile
  const {
    loading: loadingBrand,
    data: brandProfile,
    func: fetchBrand,
  } = useFetch(getUser);

  useEffect(() => {
    if (isLoaded) {
      funcJob({ job_id: id });
    }
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
    brand_id,
  } = job || {};

  // Brand info
  const { brand_name, brand_desc, website, linkedin_url, brand_hq, logo_url } =
    (job && job?.brand) || {};

  useEffect(() => {
    if (brand_id) {
      fetchBrand({ user_id: brand_id });
    }
  });

  // Brand user profile
  const { full_name, email, profile_picture_url } = brandProfile || {};

  // // Load hiring status
  // const { loading: loadingHiringStatus, func: funcHiringStatus } =
  //   useFetch(updateHiringStatus);

  // // Update hiring status and re-fetch job details
  // const handleStatusChange = (value) => {
  //   const isOpen = value === "open";
  //   funcHiringStatus({ is_open: isOpen, job_id: id }).then(() =>
  //     funcJob({ job_id: id })
  //   );
  // };

  const handleEmailSend = async (message) => {
    try {
      const res = await fetch(
        "https://yddcboiyncaqmciytwjx.supabase.co/functions/v1/send-connection-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_email: email,
            sender_email: user?.primaryEmailAddress?.emailAddress,
            target_name: full_name,
            sender_name: user?.fullName,
            message,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Email send failed:", errorText);
        throw new Error("Failed to send email.");
      }

      toast.success("Email sent!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send email.");
    }
  };

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const connectButton =
    brand_id && user && brand_id !== user.id ? (
      <div className="flex flex-col text-sm mt-10">
        <ConnectEmailDialog
          open={connectDialogOpen}
          setOpen={setConnectDialogOpen}
          targetUser={brandProfile}
          senderUser={user}
          onSend={handleEmailSend}
        />
      </div>
    ) : (
      <></>
    );

  if (!isLoaded || loadingJob) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="flex flex-col gap-10 mt-10 px-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={job?.brand && logo_url}
            alt="Profile"
            className="h-22 w-22 rounded-full border object-cover"
          />
          <div>
            <h1
              className={clsx(
                "text-3xl font-bold",
                website && "hover:underline"
              )}
            >
              {job?.brand &&
                (website ? (
                  <Link to={website}>{brand_name}</Link>
                ) : (
                  <span>{brand_name}</span>
                ))}
            </h1>
            <div className="flex flex-row gap-4 mt-2">
              {/* {job?.brand && linkedin_url && (
                <Link to={linkedin_url}>
                  <FaLinkedin
                    className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110"
                    style={{ color: "#0072b1" }}
                  />
                </Link>
              )} */}
            </div>
          </div>
        </div>

        {user && brand_id && brand_id === user.id && (
          <Button
            className="rounded-full cursor-pointer"
            variant="outline"
            size="lg"
            asChild
          >
            <Link to={`/edit-job/${id}`}>Edit Job</Link>
          </Button>
        )}
      </div>

      {/* Section: Summary Info */}
      {brand_desc && (
        <div className="bg-muted rounded-md p-4">
          <Label className="text-xs text-muted-foreground uppercase">
            About
          </Label>
          <p className="text-sm font-medium mt-1">{job?.brand && brand_desc}</p>
        </div>
      )}

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
              level_of_experience.map((level, idx) => (
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
          {area_of_specialization &&
            area_of_specialization.map((area, idx) => (
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

      <div>{connectButton}</div>

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

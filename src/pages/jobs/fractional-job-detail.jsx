import React, { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import MDEditor from "@uiw/react-md-editor";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch.jsx";
import { getSingleJob } from "@/api/apiFractionalJobs.js";
import { Button } from "@/components/ui/button.jsx";
import ConnectEmailDialog from "@/components/connect-email-dialog.jsx";
import { toast } from "sonner";
import { getUser } from "@/api/apiUsers.js";
import BackButton from "@/components/back-button.jsx";
import {
  MapPin,
  Clock,
  Briefcase,
  Globe,
  Building2,
  FileText,
  Mail,
  Pencil,
} from "lucide-react";
import clsx from "clsx";

const FractionalJobDetail = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();
  const [activeTab, setActiveTab] = useState("about");

  // Load Job info
  const {
    loading: loadingJob,
    data: job,
    func: funcJob,
  } = useFetch(getSingleJob);

  // Load poster's user profile for contact
  const {
    loading: loadingPoster,
    data: posterProfile,
    func: fetchPoster,
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
    poster_id,
  } = job || {};

  // Poster info (inline on job) - with fallback for legacy data
  const poster_name = job?.poster_name || job?.brand?.brand_name || "Unknown";
  const poster_logo = job?.poster_logo || job?.brand?.logo_url;
  const poster_location = job?.poster_location || job?.brand?.brand_hq;
  const poster_type = job?.poster_type || "brand";

  useEffect(() => {
    const posterId = poster_id || job?.brand_id;
    if (posterId) {
      fetchPoster({ user_id: posterId });
    }
  }, [poster_id, job?.brand_id]);

  // Poster user profile (for contact)
  const { full_name, email, profile_picture_url } = posterProfile || {};

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
  const currentPosterId = poster_id || job?.brand_id;
  const canContact = currentPosterId && user && currentPosterId !== user.id;
  const isOwner = currentPosterId && user && currentPosterId === user.id;

  if (!isLoaded || loadingJob) {
    return <BarLoader className="mb-4" width={"100%"} color="#00A19A" />;
  }

  return (
    <div className="py-10">
      {/* Header */}
      <div className="w-5/6 mx-auto mb-8">
        <BackButton />
        <h1 className="gradient-title font-extrabold text-4xl sm:text-5xl lg:text-6xl text-center mt-6">
          {job_title || "Job Details"}
        </h1>
        {is_open === false && (
          <div className="flex justify-center mt-4">
            <span className="bg-red-100 text-red-700 text-sm font-medium px-4 py-1.5 rounded-full">
              This position is no longer accepting applications
            </span>
          </div>
        )}
      </div>

      <div className="w-5/6 mx-auto">
        {/* Poster Card */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Logo */}
            {poster_logo ? (
              <div className="h-20 w-20 rounded-full border-2 border-gray-100 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img
                  src={poster_logo}
                  alt={poster_name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full border-2 border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{poster_name}</h2>
              {poster_location && (
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{poster_location}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-shrink-0">
              {canContact && (
                <ConnectEmailDialog
                  open={connectDialogOpen}
                  setOpen={setConnectDialogOpen}
                  targetUser={posterProfile}
                  senderUser={user}
                  onSend={handleEmailSend}
                />
              )}
              {isOwner && (
                <Button
                  variant="outline"
                  className="border-2 border-cpg-teal text-cpg-teal hover:bg-cpg-teal/5 rounded-xl"
                  asChild
                >
                  <Link to={`/edit-job/${id}`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Job
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("about")}
            className={clsx(
              "px-6 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === "about"
                ? "bg-cpg-teal text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            About
          </button>
          {job?.job_description && (
            <button
              onClick={() => setActiveTab("description")}
              className={clsx(
                "px-6 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === "description"
                  ? "bg-cpg-teal text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Job Description
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "about" && (
          <div className="space-y-8">
            {/* Job Overview Card */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-6">Job Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Scope of Work */}
                <div className="flex items-start gap-3">
                  <div className="bg-cpg-teal/10 rounded-lg p-2.5 flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-cpg-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Scope of Work
                    </p>
                    <p className="font-medium mt-1">{scope_of_work || "N/A"}</p>
                  </div>
                </div>

                {/* Work Location */}
                <div className="flex items-start gap-3">
                  <div className="bg-cpg-teal/10 rounded-lg p-2.5 flex-shrink-0">
                    <Globe className="h-5 w-5 text-cpg-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Work Location
                    </p>
                    <p className="font-medium mt-1">{work_location || "N/A"}</p>
                  </div>
                </div>

                {/* Weekly Hours */}
                <div className="flex items-start gap-3">
                  <div className="bg-cpg-teal/10 rounded-lg p-2.5 flex-shrink-0">
                    <Clock className="h-5 w-5 text-cpg-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Weekly Hours
                    </p>
                    <p className="font-medium mt-1">
                      {estimated_hrs_per_wk ? `${estimated_hrs_per_wk} hrs/week` : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-3">
                  <div className="bg-cpg-teal/10 rounded-lg p-2.5 flex-shrink-0">
                    <Mail className="h-5 w-5 text-cpg-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Status
                    </p>
                    <p className="font-medium mt-1">
                      {is_open !== false ? (
                        <span className="text-green-600">Accepting Applications</span>
                      ) : (
                        <span className="text-red-600">Closed</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Experience Level */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Experience Level</h3>
              <div className="flex flex-wrap gap-2">
                {(level_of_experience || []).length > 0 ? (
                  level_of_experience.map((level, idx) => (
                    <span
                      key={idx}
                      className="bg-cpg-teal text-white text-sm font-medium px-4 py-2 rounded-full"
                    >
                      {level}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">Not specified</span>
                )}
              </div>
            </div>

            {/* Area of Specialization */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Area of Specialization</h3>
              <div className="flex flex-wrap gap-2">
                {(area_of_specialization || []).length > 0 ? (
                  area_of_specialization.map((area, idx) => (
                    <span
                      key={idx}
                      className="bg-cpg-teal/10 text-cpg-teal text-sm font-medium px-4 py-2 rounded-full"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">Not specified</span>
                )}
              </div>
            </div>

            {/* Preferred Experience */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Preferred Experience</h3>
              {preferred_experience ? (
                <div
                  data-color-mode="light"
                  className="prose prose-sm sm:prose-base max-w-none"
                >
                  <MDEditor.Markdown
                    className="bg-transparent"
                    source={preferred_experience}
                  />
                </div>
              ) : (
                <span className="text-muted-foreground">Not specified</span>
              )}
            </div>

            {/* Contact CTA for non-owners */}
            {canContact && (
              <div className="bg-gradient-to-r from-cpg-teal/10 to-cpg-brown/10 border-2 border-cpg-teal/20 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">
                  Interested in this opportunity?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Reach out to {poster_name} to express your interest and learn more about the role.
                </p>
                <ConnectEmailDialog
                  open={connectDialogOpen}
                  setOpen={setConnectDialogOpen}
                  targetUser={posterProfile}
                  senderUser={user}
                  onSend={handleEmailSend}
                  triggerClassName="bg-cpg-teal hover:bg-cpg-teal/90 text-white px-8 py-3 rounded-xl text-base font-medium"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "description" && job?.job_description && (
          <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
            <iframe
              src={job.job_description}
              title="Job Description"
              width="100%"
              height="800px"
              className="border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FractionalJobDetail;

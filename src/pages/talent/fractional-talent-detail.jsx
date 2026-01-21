import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { getTalent } from "@/api/apiTalent.js";
import { BarLoader } from "react-spinners";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button.jsx";
import { toast } from "sonner";
import ConnectEmailDialog from "@/components/connect-email-dialog.jsx";
import { FaLinkedin } from "react-icons/fa";
import {
  getAllEndorsements,
  createEndorsement,
} from "@/api/apiConnections.js";
import EndorsementDialog from "@/components/endorsement-dialog.jsx";
import EndorsementEditDialog from "@/components/endorsement-edit-dialog.jsx";
import TalentExperienceSection from "@/components/experience-section.jsx";
import BackButton from "@/components/back-button.jsx";
import ShowLoginDialog from "@/components/show-login-dialog.jsx";
import { ADMIN_USER_IDS } from "@/constants/admins.js";
import {
  Pencil,
  Globe,
  Briefcase,
  Award,
  FileText,
  Users,
  Mail,
} from "lucide-react";
import clsx from "clsx";

const isAdmin = (userId) => ADMIN_USER_IDS.includes(userId);

const FractionalTalentDetail = () => {
  const { id } = useParams();
  const { isLoaded, user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("about");

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [endorseDialogOpen, setEndorseDialogOpen] = useState(false);
  const [endorseTargetId, setEndorseTargetId] = useState(null);
  const [activeEndorsement, setActiveEndorsement] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Load talent
  const {
    func: funcTalent,
    data: talent,
    loading: loadingTalent,
    error,
  } = useFetch(getTalent);

  useEffect(() => {
    if (isLoaded && id) {
      funcTalent({ talent_id: id });
    }
  }, [isLoaded, id]);

  const {
    level_of_experience = [],
    area_of_specialization = [],
    industry_experience,
    linkedin_url,
    portfolio_url,
    resume_url,
    user_info,
  } = talent || {};

  const email = user_info?.email || "";
  const image_url = user_info?.profile_picture_url || "";
  const full_name = user_info?.full_name || "";

  // Get all endorsements to this talent
  const {
    func: fetchEndorsements,
    data: endorsements,
    loading: loadingEndorsements,
    error: errorEndorsements,
  } = useFetch(getAllEndorsements);

  // Create endorsement message
  const { func: funcCreateEndorsement, loading: loadingCreateEndorsement } =
    useFetch(createEndorsement);

  useEffect(() => {
    if (isLoaded && user_info) {
      fetchEndorsements({ user_id: user_info.user_id });
    }
  }, [isLoaded, user, user_info]);

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

  const handleEndorsementSubmit = async (message) => {
    if (!isLoaded || !user?.id || !user_info?.user_id) return;
    try {
      await funcCreateEndorsement(message, {
        endorser_id: user.id,
        target_id: user_info.user_id,
      });

      if (isLoaded && user_info) {
        await fetchEndorsements({ user_id: user_info.user_id });
      }

      toast.success("Endorsement added!");
    } catch (error) {
      toast.error("Something went wrong.");
    }
  };

  const hasEndorsed = endorsements?.some(
    (e) => e.endorser?.user_id === user?.id
  );

  // Current user's endorsement first
  const sortedEndorsements = [...(endorsements || [])].sort((a, b) => {
    const isCurrentUser = (e) => e.endorser?.user_id === user?.id;
    return Number(isCurrentUser(b)) - Number(isCurrentUser(a));
  });

  const canContact = user_info && user_info.user_id !== user?.id;
  const isOwner = user_info?.user_id === user?.id || isAdmin(user?.id);

  if (!isLoaded || loadingTalent) {
    return <BarLoader className="mb-4" width={"100%"} color="#00A19A" />;
  }

  if (error || !talent) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-500">Error loading profile.</p>
      </div>
    );
  }

  return (
    <div className="py-10">
      {/* Header */}
      <div className="w-5/6 mx-auto mb-8">
        <BackButton />
        <h1 className="gradient-title font-extrabold text-4xl sm:text-5xl lg:text-6xl text-center mt-6">
          {full_name || "Talent Profile"}
        </h1>
      </div>

      <div className="w-5/6 mx-auto">
        {/* Profile Card */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            {image_url ? (
              <div className="h-20 w-20 rounded-full border-2 border-gray-100 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img
                  src={image_url}
                  alt={full_name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full border-2 border-gray-100 bg-cpg-teal/10 flex items-center justify-center flex-shrink-0">
                <span className="text-cpg-teal font-bold text-2xl">
                  {full_name?.charAt(0) || "?"}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{full_name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                {linkedin_url && (
                  <Link
                    to={linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0072b1] hover:scale-110 transition-transform"
                  >
                    <FaLinkedin className="h-5 w-5" />
                  </Link>
                )}
                {portfolio_url && (
                  <Link
                    to={portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-cpg-teal hover:scale-110 transition-transform"
                  >
                    <Globe className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-shrink-0">
              {canContact && (
                <ConnectEmailDialog
                  open={connectDialogOpen}
                  setOpen={setConnectDialogOpen}
                  targetUser={user_info}
                  senderUser={user}
                  onSend={handleEmailSend}
                  data-umami-event="Talent Connection"
                />
              )}
              {isOwner && (
                <Button
                  variant="outline"
                  className="border-2 border-cpg-teal text-cpg-teal hover:bg-cpg-teal/5 rounded-xl"
                  onClick={() => navigate(`/edit-talent/${id}`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Profile
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
          {resume_url && (
            <button
              onClick={() => setActiveTab("resume")}
              className={clsx(
                "px-6 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === "resume"
                  ? "bg-cpg-teal text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Resume
            </button>
          )}
          <button
            onClick={() => setActiveTab("endorsements")}
            className={clsx(
              "px-6 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === "endorsements"
                ? "bg-cpg-teal text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Endorsements
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "about" && (
          <div className="space-y-8">
            {/* Overview Card */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-6">Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Specializations Count */}
                <div className="flex items-start gap-3">
                  <div className="bg-cpg-teal/10 rounded-lg p-2.5 flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-cpg-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Specializations
                    </p>
                    <p className="font-medium mt-1">
                      {area_of_specialization?.length || 0} areas
                    </p>
                  </div>
                </div>

                {/* Experience Levels */}
                <div className="flex items-start gap-3">
                  <div className="bg-cpg-teal/10 rounded-lg p-2.5 flex-shrink-0">
                    <Award className="h-5 w-5 text-cpg-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Experience Level
                    </p>
                    <p className="font-medium mt-1">
                      {level_of_experience?.length > 0
                        ? level_of_experience.join(", ")
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Endorsements Count */}
                <div className="flex items-start gap-3">
                  <div className="bg-cpg-teal/10 rounded-lg p-2.5 flex-shrink-0">
                    <Users className="h-5 w-5 text-cpg-teal" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Endorsements
                    </p>
                    <p className="font-medium mt-1">
                      {endorsements?.length || 0} endorsements
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Industry Experience */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Industry Experience</h3>
              {industry_experience ? (
                <p className="text-muted-foreground whitespace-pre-line">
                  {industry_experience}
                </p>
              ) : (
                <span className="text-muted-foreground">Not specified</span>
              )}
            </div>

            {/* Brand Experience */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
              <TalentExperienceSection
                user_id={user_info?.user_id}
                showEdit={false}
              />
            </div>

            {/* Experience Level */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Experience Level</h3>
              <div className="flex flex-wrap gap-2">
                {level_of_experience.length > 0 ? (
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
                {area_of_specialization.length > 0 ? (
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

            {/* Contact CTA for non-owners */}
            {canContact && (
              <div className="bg-gradient-to-r from-cpg-teal/10 to-cpg-brown/10 border-2 border-cpg-teal/20 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">
                  Interested in working with {full_name?.split(" ")[0]}?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Reach out to discuss potential opportunities and collaborations.
                </p>
                <Button
                  onClick={() => {
                    if (!isSignedIn || !user) {
                      setShowLoginDialog(true);
                    } else {
                      setConnectDialogOpen(true);
                    }
                  }}
                  className="bg-cpg-teal hover:bg-cpg-teal/90 text-white px-8 py-3 rounded-xl text-base font-medium"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Connect
                </Button>
                <ShowLoginDialog open={showLoginDialog} setOpen={setShowLoginDialog} />
              </div>
            )}
          </div>
        )}

        {/* Resume Tab */}
        {activeTab === "resume" && resume_url && (
          <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
            <iframe
              src={resume_url}
              title="Resume"
              width="100%"
              height="800px"
              className="border-0"
            />
          </div>
        )}

        {/* Endorsements Tab */}
        {activeTab === "endorsements" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Endorsements</h2>
              {isSignedIn &&
                user_info?.user_id !== user?.id &&
                !hasEndorsed && (
                  <EndorsementDialog
                    open={endorseDialogOpen}
                    setOpen={setEndorseDialogOpen}
                    onSend={handleEndorsementSubmit}
                  />
                )}
            </div>

            {loadingEndorsements && (
              <BarLoader width="100%" color="#00A19A" />
            )}
            {errorEndorsements && (
              <p className="text-red-500">Error loading endorsements.</p>
            )}
            {(!endorsements || endorsements?.length === 0) && (
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No endorsements yet.</p>
              </div>
            )}

            <div className="space-y-4">
              {sortedEndorsements?.map((endorsement) => {
                const endorserId = endorsement.endorser?.user_id;
                const endorsedBack = endorsements.some(
                  (rev) =>
                    rev.from_user_id === user?.id &&
                    rev.to_user_id === endorserId
                );

                return (
                  <div
                    key={endorsement.id}
                    className="bg-white border-2 border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row justify-between gap-4"
                  >
                    {/* Profile + Message */}
                    <div className="flex gap-4">
                      <img
                        src={endorsement.endorser?.profile_picture_url}
                        alt={endorsement.endorser?.full_name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                      />
                      <div>
                        <p className="font-semibold">
                          {endorsement.endorser?.full_name}
                        </p>
                        <p className="text-gray-600 mt-1">
                          {endorsement.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-center self-center gap-4">
                      {/* Edit my own endorsement */}
                      {isSignedIn && endorserId === user?.id && (
                        <Button
                          className="bg-cpg-brown text-white rounded-xl hover:bg-cpg-brown/90"
                          variant="default"
                          size="default"
                          onClick={() => {
                            setActiveEndorsement(endorsement);
                            setEndorseTargetId(user_info.user_id);
                            setEditDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      )}

                      {/* Endorse back */}
                      {isSignedIn &&
                        !endorsedBack &&
                        endorserId !== user?.id && (
                          <Button
                            className="bg-cpg-brown text-white rounded-xl hover:bg-cpg-brown/90"
                            variant="default"
                            size="default"
                            onClick={() => {
                              if (!isSignedIn || !user) {
                                setShowLoginDialog(true);
                                return;
                              }
                              setEndorseTargetId(endorserId);
                              setEndorseDialogOpen(true);
                            }}
                          >
                            Endorse back
                          </Button>
                        )}
                    </div>
                  </div>
                );
              })}
              {activeEndorsement && (
                <EndorsementEditDialog
                  open={editDialogOpen}
                  setOpen={(open) => {
                    setEditDialogOpen(open);
                    if (!open) setActiveEndorsement(null);
                  }}
                  initialMessage={activeEndorsement.message}
                  onSave={async (newMessage) => {
                    await handleEndorsementSubmit(newMessage);
                    setEditDialogOpen(false);
                    setActiveEndorsement(null);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FractionalTalentDetail;

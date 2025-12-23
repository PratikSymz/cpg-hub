import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { getTalent } from "@/api/apiTalent.js"; // <- fetch talent_profiles by ID
import { BarLoader } from "react-spinners";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.jsx";
import { toast } from "sonner";
import ConnectDialog from "@/components/endorsement-dialog.jsx";
import { FaGlobe, FaLinkedin } from "react-icons/fa";
import ComposeEmailDialog from "@/components/connect-email-dialog.jsx";
import ConnectEmailDialog from "@/components/connect-email-dialog.jsx";
import {
  getAllEndorsements,
  createEndorsement,
  updateEndorsement,
} from "@/api/apiConnections.js";
import EndorsementDialog from "@/components/endorsement-dialog.jsx";
import EndorsementEditDialog from "@/components/endorsement-edit-dialog.jsx";
import TalentExperienceSection from "@/components/experience-section.jsx";
import clsx from "clsx";
import BackButton from "@/components/back-button.jsx";
import ShowLoginDialog from "@/components/show-login-dialog.jsx";
import { ADMIN_USER_IDS } from "@/constants/admins.js";

const tabs = [
  {
    name: "About",
    value: "about",
    content: "",
  },
  {
    name: "Resume",
    value: "resume",
    content: "",
  },
  {
    name: "About",
    value: "about_2",
    content: "",
  },
];

const isAdmin = (userId) => ADMIN_USER_IDS.includes(userId);

const FractionalTalentDetail = () => {
  const { id } = useParams();
  const { isLoaded, user, isSignedIn } = useUser();
  const role = user?.unsafeMetadata?.role;
  const navigate = useNavigate();

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  const [endorseDialogOpen, setEndorseDialogOpen] = useState(false);
  const [endorseTargetId, setEndorseTargetId] = useState(null);
  // ^ who we’re endorsing: either the profile owner OR a specific endorser (for endorse‑back)

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
      // Load talent
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
  const { func: funcCreateEndorsement, loading: loadingUpdateEndorsement } =
    useFetch(createEndorsement);

  useEffect(() => {
    // Load endorsements for this talent
    if (isLoaded && user_info) {
      fetchEndorsements({ user_id: user_info.user_id });
    }
  }, [isLoaded, user, user_info]);

  // const handleUpdateRequest = async (requester_id, updated_status) => {
  //   if (!isLoaded || !user?.id) return;
  //   await funcUpdateStatus({
  //     requester_id: requester_id,
  //     target_id: user.id,
  //     new_status: updated_status,
  //   });

  //   if (errorUpdateStatus) {
  //     toast.error("Failed to update connection request.");
  //   }
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

  const handleEndorsementSubmit = async (message) => {
    if (!isLoaded || !user?.id || !user_info?.user_id) return;
    try {
      await funcCreateEndorsement(message, {
        endorser_id: user.id,
        target_id: user_info.user_id,
      });

      // Load endorsements for this talent
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

  const connectButton =
    user_info && user_info.user_id !== user?.id ? (
      <div className="flex flex-col text-sm mt-10">
        <Button
          className={"bg-cpg-brown hover:bg-cpg-brown/90"}
          variant="default"
          size="lg"
          onClick={() => {
            if (!isSignedIn || !user) {
              setShowLoginDialog(true);
            } else {
              setConnectDialogOpen(true);
            }
          }}
        >
          Connect
        </Button>

        <ConnectEmailDialog
          open={connectDialogOpen}
          setOpen={setConnectDialogOpen}
          targetUser={user_info}
          senderUser={user}
          onSend={handleEmailSend}
          data-umami-event="Talent Connection"
        />
        <ShowLoginDialog open={showLoginDialog} setOpen={setShowLoginDialog} />
      </div>
    ) : null;

  if (loadingTalent || !talent) {
    return <BarLoader width="100%" color="#36d7b7" />;
  }

  if (error) {
    return <p className="text-red-500 text-center">Error loading profile.</p>;
  }

  // Only showing key layout changes — assumes logic from your file remains unchanged
  return (
    <>
      <div className="px-4 sm:px-6 py-10">
        <BackButton />
      </div>

      <div className="flex flex-col gap-10 px-4 sm:px-6 pb-16 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={image_url}
              alt="Profile"
              className="h-24 w-24 rounded-full border object-cover"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold break-words hover:underline">
                {portfolio_url ? (
                  <Link to={portfolio_url}>{full_name}</Link>
                ) : (
                  <span>{full_name}</span>
                )}
              </h1>
              {linkedin_url && (
                <div className="mt-2">
                  <Link to={linkedin_url}>
                    <FaLinkedin className="text-[#0072b1] h-5 w-5 inline-block hover:scale-110 transition" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Edit button for self */}
          {(user_info?.user_id === user?.id || isAdmin(user?.id)) && (
            <Button
              className="rounded-full cursor-pointer w-full sm:w-auto"
              variant="outline"
              size="lg"
              onClick={() => navigate(`/edit-talent/${id}`)}
            >
              Edit profile
            </Button>
          )}
        </div>

        {/* Divider */}
        <div className="bg-gray-100 rounded-2xl h-0.5 w-full" />

        {/* Tabs */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="flex overflow-x-auto whitespace-nowrap gap-2 sm:justify-center mb-8 bg-transparent">
            <TabsTrigger
              value="about"
              className="rounded-full px-5 py-3 text-sm font-medium"
            >
              About
            </TabsTrigger>
            {resume_url && (
              <TabsTrigger
                value="resume"
                className="rounded-full px-5 py-3 text-sm font-medium"
              >
                Resume
              </TabsTrigger>
            )}
            <TabsTrigger
              value="endorsements"
              className="rounded-full px-5 py-3 text-sm font-medium"
            >
              Endorsements
            </TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about">
            <div className="flex flex-col gap-10">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Industry Experience
                </h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {industry_experience}
                </p>
              </div>

              <div>
                <TalentExperienceSection
                  user_id={user_info.user_id}
                  showEdit={false}
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Level of Experience
                </h2>
                <div className="flex flex-wrap gap-2">
                  {level_of_experience.map((level, idx) => (
                    <span
                      key={idx}
                      className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Area of Specialization
                </h2>
                <div className="flex flex-wrap gap-2">
                  {area_of_specialization.map((area, idx) => (
                    <span
                      key={idx}
                      className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {connectButton}
            </div>
          </TabsContent>

          {/* Resume Tab */}
          {resume_url && (
            <TabsContent value="resume">
              <div className="w-full overflow-x-auto">
                <iframe
                  src={resume_url}
                  title="Resume"
                  width="100%"
                  height="600px"
                  className="rounded-lg border"
                />
              </div>
            </TabsContent>
          )}

          {/* Endorsements Tab */}
          <TabsContent value="endorsements">
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
                <p className="text-gray-500">No endorsements yet.</p>
              )}

              <ul className="space-y-4">
                {sortedEndorsements?.map((endorsement) => {
                  const endorserId = endorsement.endorser?.user_id; // who endorsed the owner
                  const endorsedBack = endorsements.some(
                    // Has the current user already endorsed this endorser? (reciprocal)
                    (rev) =>
                      rev.from_user_id === user?.id &&
                      rev.to_user_id === endorserId
                  );

                  return (
                    <li
                      key={endorsement.id}
                      className="border rounded-lg p-4 bg-white shadow-sm flex flex-col sm:flex-row justify-between gap-4"
                    >
                      {/* Profile + Message */}
                      <div className="flex gap-4">
                        <img
                          src={endorsement.endorser?.profile_picture_url}
                          alt={endorsement.endorser?.full_name}
                          className="w-14 h-14 rounded-full object-cover border"
                        />
                        <div>
                          <p className="font-semibold">
                            {endorsement.endorser?.full_name}
                          </p>
                          <p className="text-gray-700 mt-1">
                            {endorsement.message}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-center self-center gap-4">
                        {/* Edit my own endorsement on the owner */}
                        {isSignedIn && endorserId === user?.id && (
                          <Button
                            className="bg-cpg-brown text-white rounded-full hover:bg-cpg-brown/90 hover:text-white w-full sm:w-auto cursor-pointer"
                            variant="outline"
                            size="lg"
                            onClick={() => {
                              setActiveEndorsement(endorsement);
                              setEndorseTargetId(user_info.user_id); // editing endorsement TO the owner
                              setEditDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        )}

                        {/* Endorse back the endorser (reciprocal) */}
                        {isSignedIn &&
                          !endorsedBack &&
                          endorserId !== user?.id && (
                            <Button
                              className="bg-cpg-brown text-white rounded-full hover:bg-cpg-brown/90 hover:text-white w-full sm:w-auto cursor-pointer"
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                if (!isSignedIn || !user) {
                                  setShowLoginDialog(true);
                                  return;
                                }
                                setEndorseTargetId(endorserId); // <-- target is the original endorser
                                setEndorseDialogOpen(true);
                                // optionally track target
                              }}
                            >
                              Endorse back
                            </Button>
                          )}
                      </div>
                    </li>
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
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default FractionalTalentDetail;

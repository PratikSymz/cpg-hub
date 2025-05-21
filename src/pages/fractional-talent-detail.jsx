import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { getTalent } from "@/api/apiTalent.js"; // <- fetch talent_profiles by ID
import { Copy, ExternalLink } from "lucide-react";
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
import { getAllEndorsements, updateEndorsement } from "@/api/apiConnections.js";
import EndorsementDialog from "@/components/endorsement-dialog.jsx";
import EndorsementEditDialog from "@/components/endorsement-edit-dialog.jsx";

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

const FractionalTalentDetail = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();
  const role = user?.unsafeMetadata?.role;
  const navigate = useNavigate();

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [endorseDialogOpen, setEndorseDialogOpen] = useState(false);
  const [activeEndorsement, setActiveEndorsement] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  // Update endorsement message
  const { func: funcUpdateEndorsement, loading: loadingUpdateEndorsement } =
    useFetch(updateEndorsement);

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
      console.log(email);
      console.log(user?.primaryEmailAddress?.emailAddress);
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
      await funcUpdateEndorsement(message, {
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
    user_info && user && user_info.user_id !== user.id ? (
      <div className="flex flex-col text-sm mt-10">
        <ConnectEmailDialog
          open={connectDialogOpen}
          setOpen={setConnectDialogOpen}
          targetUser={user_info}
          senderUser={user}
          onSend={handleEmailSend}
        />
      </div>
    ) : (
      <></>
    );

  if (loadingTalent || !talent) {
    return <BarLoader width="100%" color="#36d7b7" />;
  }

  if (error) {
    return <p className="text-red-500 text-center">Error loading profile.</p>;
  }

  return (
    <div className="flex flex-col gap-10 mt-10 px-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
        <div className="flex flex-row items-center gap-4">
          <img
            src={image_url}
            alt="Profile"
            className="h-22 w-22 rounded-full border object-cover"
          />
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">
              {portfolio_url ? (
                <Link to={portfolio_url} className="hover:underline">
                  {full_name}
                </Link>
              ) : (
                full_name
              )}
            </h1>
            <div className="flex flex-row gap-4 mt-2">
              {linkedin_url && (
                <Link to={linkedin_url}>
                  <FaLinkedin
                    className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110"
                    style={{ color: "#0072b1" }}
                  />
                </Link>
              )}
              {/* {portfolio_url && (
                <Link to={portfolio_url}>
                  <FaGlobe className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110" />
                </Link>
              )} */}
            </div>
          </div>
        </div>

        {user_info && user && user_info.user_id === user.id && (
          <Button
            className="rounded-full cursor-pointer"
            variant="outline"
            size="lg"
            onClick={() => navigate("/edit-talent")}
          >
            Edit profile
          </Button>
        )}
      </div>

      {/* Horizontal divider */}
      <div className="flex bg-gray-100 rounded-2xl h-0.5 mt-4"></div>

      {/* Profile Summary tabs */}
      <div className="flex flex-col gap-2 text-sm">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="flex justify-center gap-4 mb-8 bg-transparent">
            <TabsTrigger
              value="about"
              className="rounded-3xl border px-7 py-5 text-sm font-medium data-[state=active]:bg-black/5 data-[state=active]:text-black data-[state=active]:shadow-none"
            >
              About
            </TabsTrigger>
            <TabsTrigger
              value="resume"
              className="rounded-3xl border px-7 py-5 text-sm font-medium data-[state=active]:bg-black/5 data-[state=active]:text-black data-[state=active]:shadow-none"
            >
              Resume
            </TabsTrigger>
            <TabsTrigger
              value="endorsements"
              className="rounded-3xl border px-7 py-5 text-sm font-medium data-[state=active]:bg-black/5 data-[state=active]:text-black data-[state=active]:shadow-none"
            >
              Endorsements
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent className={"ms-2"} value="about">
            <div className="flex flex-col gap-10 mt-4">
              {/* Experience Section */}
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-semibold">Industry Experience</h2>
                <p className="text-muted-foreground text-base whitespace-pre-line">
                  {industry_experience}
                </p>
              </div>

              {/* Tags */}
              <div>
                <h2 className="text-2xl font-semibold mb-2">
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
                <h2 className="text-2xl font-semibold mb-2">
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

              <div>{connectButton}</div>
            </div>
          </TabsContent>

          <TabsContent className={"ms-6"} value="resume">
            {resume_url ? (
              <iframe
                src={resume_url}
                title="Resume"
                width="100%"
                height="800px"
                className="rounded-lg border"
              />
            ) : (
              <p className="text-gray-600">No resume uploaded.</p>
            )}
          </TabsContent>

          <TabsContent className={"ms-4"} value="endorsements">
            <div className="">
              <div className="flex flex-row justify-between">
                <h2 className="text-2xl font-semibold mb-6">Endorsements</h2>
                {user_info &&
                  user &&
                  user_info.user_id !== user.id &&
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

              <ul className="space-y-4 mt-6">
                {sortedEndorsements?.map((endorsement) => (
                  <li
                    key={endorsement.id}
                    className="border rounded-lg p-4 bg-white shadow-sm flex justify-between items-center"
                  >
                    {/* Left side: Profile picture and message */}
                    <div className="flex items-start gap-4">
                      {/* Profile Picture */}
                      <img
                        src={endorsement.endorser?.profile_picture_url}
                        alt={endorsement.endorser?.full_name}
                        className="w-16 h-16 rounded-full object-cover border"
                      />

                      {/* Name, Email, Message */}
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {endorsement.endorser?.full_name}
                        </p>
                        {/* <p className="text-sm text-gray-500 mb-1">
                          {endorsement.endorser?.email}
                        </p> */}
                        <p className="text-gray-700 mt-1">
                          {endorsement.message}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    {endorsement.endorser?.user_id === user?.id && (
                      <Button
                        className="bg-cpg-brown text-white rounded-full hover:bg-cpg-brown/90 hover:text-white cursor-pointer"
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setActiveEndorsement(endorsement);
                          setEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </li>
                ))}
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
    </div>
  );
};

export default FractionalTalentDetail;

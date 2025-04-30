import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import {
  updateConnectionStatus,
  deleteConnection,
  sendConnectionRequest,
  getConnectionStatus,
} from "@/api/apiConnections.js";
import { toast } from "sonner";
import ConnectDialog from "@/components/connect-dialog.jsx";
import { FaGlobe, FaLinkedin } from "react-icons/fa";

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState(null); // 'pending', 'accepted', etc

  const labelByStatus = {
    pending: "Pending",
    accepted: "Connected",
    rejected: "Rejected",
  };

  // Load talent
  const {
    func: funcTalent,
    data: talent,
    loading: loadingTalent,
    error,
  } = useFetch(getTalent);

  // Send connection request
  const { func: funcSendRequest, error: errorSendRequest } = useFetch(
    sendConnectionRequest
  );

  // Get connection status
  const {
    func: funcRequestStatus,
    data: connectionStatus,
    error: errorRequestStatus,
  } = useFetch(getConnectionStatus);

  useEffect(() => {
    if (isLoaded && id) {
      // Load talent
      funcTalent({ talent_id: id });
    }
  }, [isLoaded, id]);

  useEffect(() => {
    if (isLoaded && talent?.user_info?.user_id && user?.id) {
      funcRequestStatus({
        requester_id: user.id,
        target_id: talent.user_info.user_id,
      });
    }
  }, [isLoaded, talent, user]);
  console.log()

  if (loadingTalent || !talent) {
    return <BarLoader width="100%" color="#36d7b7" />;
  }

  if (error) {
    return <p className="text-red-500 text-center">Error loading profile.</p>;
  }

  const {
    level_of_experience = [],
    area_of_specialization = [],
    industry_experience,
    linkedin_url,
    portfolio_url,
    resume_url,
    user_info,
  } = talent;

  const email = user_info.email;
  const image_url = user_info.profile_picture_url;
  const full_name = user_info.full_name;

  const handleSendRequest = async (message) => {
    if (!isLoaded || !user?.id || !user_info?.user_id) return;
    await funcSendRequest({
      requester_id: user.id,
      target_id: user_info.user_id,
      message,
    });

    if (!errorSendRequest) {
      setStatus(labelByStatus.pending); // Update UI state
    } else {
      toast.error("Failed to send connection request.");
    }
  };

  return (
    <div className="flex flex-col gap-10 mt-10 px-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={image_url}
            alt="Profile"
            className="h-22 w-22 rounded-full border object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold">{full_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fractional Talent
            </p>
            <div className="flex flex-row gap-4 mt-2">
              {linkedin_url && (
                <Link to={linkedin_url}>
                  <FaLinkedin
                    className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110"
                    style={{ color: "#0072b1" }}
                  />
                </Link>
              )}
              {portfolio_url && (
                <Link to={portfolio_url}>
                  <FaGlobe className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {user_info.user_id !== user.id && (
          <div className="flex flex-col gap-2 text-sm">
            <Button
              variant="outline"
              size="lg"
              className="rounded-3xl px-7 py-5"
              onClick={() => setDialogOpen(true)}
              disabled={!!status}
            >
              {status ? labelByStatus[status] : "Contact"}
            </Button>
            <ConnectDialog
              open={dialogOpen}
              setOpen={setDialogOpen}
              onSend={handleSendRequest}
            />
          </div>
        )}

        {/* <div className="flex flex-col gap-2 text-sm">
          {linkedin_url && (
            <a
              href={linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline flex items-center gap-1"
            >
              LinkedIn <ExternalLink size={14} />
            </a>
          )}
          {portfolio_url && (
            <a
              href={portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline flex items-center gap-1"
            >
              Portfolio <ExternalLink size={14} />
            </a>
          )}
          {resume_url && (
            <a
              href={resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline flex items-center gap-1"
            >
              Resume <ExternalLink size={14} />
            </a>
          )}
        </div> */}
      </div>

      <div className="flex bg-gray-100 rounded-2xl h-0.5 mt-4"></div>

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
          </TabsList>

          {/* Tab Contents */}
          <TabsContent className={""} value="about">
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
                  {JSON.parse(level_of_experience).map((level, idx) => (
                    <span
                      key={idx}
                      className="bg-green-100 text-green-800 text-sm font-medium px-4 py-1 rounded-full"
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
                  {JSON.parse(area_of_specialization).map((area, idx) => (
                    <span
                      key={idx}
                      className="bg-teal-100 text-teal-800 text-sm font-medium px-4 py-1 rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent className={""} value="resume">
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
        </Tabs>
      </div>
    </div>
  );
};

export default FractionalTalentDetail;

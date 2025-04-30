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
  sendConnectionRequest,
  getConnectionStatus,
  getRequestsForTalent,
  updateConnectionStatus,
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

  // Send connection request
  const { func: funcSendRequest, error: errorSendRequest } = useFetch(
    sendConnectionRequest
  );

  // Get connection status
  const {
    func: funcRequestStatus,
    data: connection,
    error: errorRequestStatus,
  } = useFetch(getConnectionStatus);

  // Update connection status
  const {
    func: funcUpdateStatus,
    loading: loadingUpdateStatus,
    error: errorUpdateStatus,
  } = useFetch(updateConnectionStatus);

  // Get all connection requests to this talent
  const {
    func: fetchRequests,
    data: requests,
    loading: loadingRequests,
    error: errorRequests,
  } = useFetch(getRequestsForTalent);

  useEffect(() => {
    if (isLoaded && id) {
      // Load talent
      funcTalent({ talent_id: id });
    }
  }, [isLoaded, id]);

  useEffect(() => {
    // Only load the connection status for users other than yourself
    if (
      isLoaded &&
      talent?.user_info?.user_id &&
      user?.id &&
      user.id !== user_info?.user_id
    ) {
      funcRequestStatus({
        requester_id: user.id,
        target_id: user_info.user_id,
      });
    }
  }, [isLoaded, talent, user]);

  useEffect(() => {
    // Only load connection requests for the logged in user
    if (isLoaded && user?.id && user.id === user_info?.user_id) {
      fetchRequests({ target_id: user.id });
    }
  }, [isLoaded, user, user_info]);

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

  const handleUpdateRequest = async (requester_id, updated_status) => {
    if (!isLoaded || !user?.id) return;
    await funcUpdateStatus({
      requester_id: requester_id,
      target_id: user.id,
      new_status: updated_status,
    });

    if (errorUpdateStatus) {
      toast.error("Failed to update connection request.");
    }
  };

  // if (connection) {
  //   setStatus(labelByStatus[connection.status]);
  // }

  if (loadingTalent || !talent) {
    return <BarLoader width="100%" color="#36d7b7" />;
  }

  if (error) {
    return <p className="text-red-500 text-center">Error loading profile.</p>;
  }

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
        )}
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
            <TabsTrigger
              value="connections"
              className="rounded-3xl border px-7 py-5 text-sm font-medium data-[state=active]:bg-black/5 data-[state=active]:text-black data-[state=active]:shadow-none"
            >
              Connections
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
                  {JSON.parse(level_of_experience).map((level, idx) => (
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
                  {JSON.parse(area_of_specialization).map((area, idx) => (
                    <span
                      key={idx}
                      className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
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

          <TabsContent className={"ms-4"} value="connections">
            {user?.id === user_info?.user_id && (
              <div className="">
                <h2 className="text-2xl font-semibold mb-6">
                  Connection Requests
                </h2>
                {loadingRequests && <BarLoader width="100%" color="#00A19A" />}
                {errorRequests && (
                  <p className="text-red-500">Error loading requests.</p>
                )}

                {requests?.length === 0 && (
                  <p className="text-gray-500">No connection requests yet.</p>
                )}

                <ul className="space-y-4">
                  {requests?.map((req) => (
                    <li
                      key={req.id}
                      className="border rounded-lg p-4 bg-white shadow-sm flex justify-between items-center"
                    >
                      {/* Left side: Profile picture and message */}
                      <div className="flex items-start gap-4">
                        {/* Profile Picture */}
                        <img
                          src={req.requester?.profile_picture_url}
                          alt={req.requester?.full_name}
                          className="w-16 h-16 rounded-full object-cover border"
                        />

                        {/* Name, Email, Message */}
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {req.requester?.full_name}
                          </p>
                          <p className="text-sm text-gray-500 mb-1">
                            {req.requester?.email}
                          </p>
                          <p className="text-gray-700 mt-1">{req.message}</p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-row items-end gap-4">
                        {req.status === "pending" ? (
                          <>
                            <Button
                              variant="default"
                              size="default"
                              className="px-4 py-1 bg-cpg-brown text-white text-sm rounded hover:bg-cpg-brown/90"
                              onClick={() =>
                                handleUpdateRequest(req.id, "accepted")
                              }
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="default"
                              className="px-4 py-1 text-sm rounded"
                              onClick={() =>
                                handleUpdateRequest(req.id, "rejected")
                              }
                            >
                              Deny
                            </Button>
                          </>
                        ) : (
                          <span
                            className={`px-3 py-1 text-sm rounded-full font-medium ${
                              req.status === "connected"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {req.status.charAt(0).toUpperCase() +
                              req.status.slice(1)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FractionalTalentDetail;

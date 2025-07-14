import React, { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch.jsx";
import { getSingleService } from "@/api/apiServices.js";
import { toast } from "sonner";
import ConnectEmailDialog from "@/components/connect-email-dialog.jsx";
import { FaGlobe } from "react-icons/fa";
import { Button } from "@/components/ui/button.jsx";
import { Label } from "@/components/ui/label.jsx";
import clsx from "clsx";
import BackButton from "@/components/back-button.jsx";

const ServiceProviderDetail = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();

  // Load service
  const {
    loading: loadingService,
    data: service,
    func: funcService,
    error,
  } = useFetch(getSingleService);

  useEffect(() => {
    if (isLoaded) funcService({ broker_id: id });
  }, [isLoaded]);

  const {
    company_name,
    company_website,
    logo_url,
    num_employees,
    area_of_specialization,
    category_of_service,
    is_broker,
    type_of_broker_service,
    markets_covered,
    customers_covered,
    service_desc,
    user_info,
  } = service || {};

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const email = user_info?.email || "";
  const image_url = user_info?.profile_picture_url || "";
  const full_name = user_info?.full_name || "";

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

  if (!isLoaded || loadingService) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  if (error) {
    return <p className="text-red-500 text-center">Error loading profile.</p>;
  }

  return (
    <>
      <div className="px-6 py-10">
        <BackButton />
      </div>
      <div className="w-full px-6 sm:px-6 py-10 max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 w-full">
          <div className="flex flex-row items-center gap-4">
            <img
              src={logo_url}
              alt={`${company_name} logo`}
              className="h-24 w-24 rounded-full border object-cover"
            />
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold hover:underline">
                {company_website ? (
                  <a href={company_website} target="_blank" rel="noreferrer">
                    {company_name}
                  </a>
                ) : (
                  company_name
                )}
              </h1>
              <p className="text-muted-foreground">{user_info?.email}</p>
            </div>
          </div>

          {user_info?.user_id === user?.id && (
            <Button
              className="rounded-full cursor-pointer w-full sm:w-auto"
              variant="outline"
              size="lg"
              asChild
            >
              <Link to={`/edit-service/${id}`}>Edit profile</Link>
            </Button>
          )}
        </div>

        {/* Description */}
        {customers_covered && (
          <div>
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {customers_covered}
            </p>
          </div>
        )}

        {/* Category Tags */}
        {category_of_service?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Categories of Service
            </h2>
            <div className="flex flex-wrap gap-2">
              {category_of_service.map((category, i) => (
                <span
                  key={i}
                  className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Broker Services */}
        {is_broker && type_of_broker_service?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Broker Services</h2>
            <div className="flex flex-wrap gap-2">
              {type_of_broker_service.map((tag, i) => (
                <span
                  key={i}
                  className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Markets Covered */}
        {markets_covered?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Markets Covered</h2>
            <div className="flex flex-wrap gap-2">
              {markets_covered.map((market, i) => (
                <span
                  key={i}
                  className="bg-cpg-teal text-white text-sm px-4 py-1 rounded-full"
                >
                  {market}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ServiceProviderDetail;

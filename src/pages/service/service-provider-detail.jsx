import React, { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch.jsx";
import { getSingleService } from "@/api/apiServices.js";
import { toast } from "sonner";
import ConnectEmailDialog from "@/components/connect-email-dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import BackButton from "@/components/back-button.jsx";
import { isAdminEmail } from "@/constants/admins.js";
import { Briefcase, Building2, Globe, Users, MapPin } from "lucide-react";

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
    user_info,
  } = service || {};

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const email = user_info?.email || "";
  const image_url = user_info?.profile_picture_url || "";
  const full_name = user_info?.full_name || "";

  // Check if current user can edit (owner or admin)
  const canEdit =
    user_info?.user_id === user?.id || isAdminEmail(user?.primaryEmailAddress?.emailAddress);

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

  if (!isLoaded || loadingService) {
    return <BarLoader className="mb-4" width={"100%"} color="#00A19A" />;
  }

  if (error) {
    return <p className="text-red-500 text-center py-10">Error loading profile.</p>;
  }

  if (!service) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500">Service profile not found.</p>
      </div>
    );
  }

  return (
    <main className="py-10">
      {/* Back Button */}
      <section className="w-5/6 max-w-5xl mx-auto mb-6">
        <BackButton />
      </section>

      {/* Header Card */}
      <section className="w-5/6 max-w-5xl mx-auto mb-6">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {logo_url ? (
                <div className="h-20 w-20 rounded-xl border-2 border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={logo_url}
                    alt={`${company_name} logo`}
                    className="max-h-full max-w-full object-contain p-1"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-xl bg-cpg-teal/10 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-cpg-teal" />
                </div>
              )}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {company_website ? (
                    <a
                      href={company_website}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-cpg-teal transition-colors"
                    >
                      {company_name}
                    </a>
                  ) : (
                    company_name
                  )}
                </h1>
                <p className="text-muted-foreground">{email}</p>
                {company_website && (
                  <a
                    href={company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cpg-teal hover:underline text-sm inline-flex items-center gap-1 mt-1"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {company_website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>

            {canEdit && (
              <Button
                className="rounded-xl cursor-pointer w-full sm:w-auto"
                variant="outline"
                size="lg"
                asChild
              >
                <Link to={`/edit-service/${id}`}>Edit Profile</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      {num_employees && (
        <section className="w-5/6 max-w-5xl mx-auto mb-6">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="bg-cpg-teal/10 rounded-lg p-2">
                <Users className="h-5 w-5 text-cpg-teal" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Size</p>
                <p className="font-semibold text-gray-900">{num_employees} employees</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {customers_covered && (
        <section className="w-5/6 max-w-5xl mx-auto mb-6">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-cpg-teal" />
              About
            </h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {customers_covered}
            </p>
          </div>
        </section>
      )}

      {/* Area of Specialization */}
      {area_of_specialization && (
        <section className="w-5/6 max-w-5xl mx-auto mb-6">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Area of Specialization
            </h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {area_of_specialization}
            </p>
          </div>
        </section>
      )}

      {/* Categories & Services */}
      <section className="w-5/6 max-w-5xl mx-auto mb-6">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 space-y-6">
          {/* Category Tags */}
          {category_of_service?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Categories of Service
              </h2>
              <div className="flex flex-wrap gap-2">
                {category_of_service.map((category, i) => (
                  <span
                    key={i}
                    className="bg-cpg-teal text-white text-sm px-4 py-1.5 rounded-full font-medium"
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
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Broker Services
              </h2>
              <div className="flex flex-wrap gap-2">
                {type_of_broker_service.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-cpg-brown text-white text-sm px-4 py-1.5 rounded-full font-medium"
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
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cpg-teal" />
                Markets Covered
              </h2>
              <div className="flex flex-wrap gap-2">
                {markets_covered.map((market, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 text-gray-700 text-sm px-4 py-1.5 rounded-full font-medium"
                  >
                    {market}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Connect Button */}
      {user_info && user && user_info.user_id !== user.id && (
        <section className="w-5/6 max-w-5xl mx-auto">
          <ConnectEmailDialog
            open={connectDialogOpen}
            setOpen={setConnectDialogOpen}
            targetUser={user_info}
            senderUser={user}
            onSend={handleEmailSend}
          />
        </section>
      )}
    </main>
  );
};

export default ServiceProviderDetail;

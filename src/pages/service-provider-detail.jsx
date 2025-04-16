import React, { useEffect } from "react";
import { BarLoader } from "react-spinners";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch.jsx";
import { ExternalLink } from "lucide-react";
import { getSingleService } from "@/api/apiServices.js";

const ServiceProviderDetail = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();

  // Load service
  const {
    loading: loadingService,
    data: service,
    func: funcService,
  } = useFetch(getSingleService, { broker_id: id });

  useEffect(() => {
    if (isLoaded) funcService();
  }, [isLoaded]);

  if (!isLoaded || loadingService) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  const {
    company_name,
    company_website,
    logo_url,
    num_employees,
    area_of_specialization,
    category_of_service,
    type_of_broker_service,
    markets_covered,
    customers_covered,
  } = service;

  return (
    <div className="flex flex-col gap-10 mt-10">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold">{company_name}</h1>
          {company_website && (
            <a
              href={company_website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground text-sm flex items-center gap-1 hover:underline"
            >
              {company_website}
              <ExternalLink size={14} />
            </a>
          )}
        </div>
        {logo_url && (
          <img
            src={logo_url}
            alt={`${company_name} logo`}
            className="h-16 w-auto object-contain rounded-md shadow-sm"
          />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm sm:text-base text-muted-foreground">
        <div className="bg-muted p-4 rounded-md">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Employees
          </p>
          <p className="font-medium">{num_employees ?? "N/A"}</p>
        </div>
        <div className="bg-muted p-4 rounded-md">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Specialization
          </p>
          <p className="font-medium">{area_of_specialization}</p>
        </div>
        <div className="bg-muted p-4 rounded-md">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Customers Covered
          </p>
          <p className="font-medium">{customers_covered || "N/A"}</p>
        </div>
      </div>

      {/* Categories of Service */}
      <div>
        <h2 className="text-xl font-bold mb-2">Categories of Service</h2>
        <div className="flex flex-wrap gap-2">
          {category_of_service &&
            JSON.parse(category_of_service).map((item, idx) => (
              <span
                key={idx}
                className="bg-cpg-brown/10 text-cpg-brown text-xs font-medium px-3 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
        </div>
      </div>

      {/* Type of Broker Services */}
      <div>
        <h2 className="text-xl font-bold mb-2">Types of Broker Services</h2>
        <div className="flex flex-wrap gap-2">
          {type_of_broker_service &&
            JSON.parse(type_of_broker_service).map((item, idx) => (
              <span
                key={idx}
                className="bg-teal-100 text-cpg-teal text-xs font-medium px-3 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
        </div>
      </div>

      {/* Markets Covered */}
      {markets_covered && (
        <div>
          <h2 className="text-xl font-bold mb-2">Markets Covered</h2>
          <div className="flex flex-wrap gap-2">
            {JSON.parse(markets_covered).map((market, idx) => (
              <span
                key={idx}
                className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full"
              >
                {market}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderDetail;
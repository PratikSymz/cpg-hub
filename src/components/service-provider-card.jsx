import React from "react";
import { Button } from "./ui/button.jsx";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Globe, MapPin } from "lucide-react";

const ServiceProviderCard = ({ service }) => {
  const {
    id,
    company_name,
    company_website,
    logo_url,
    category_of_service,
    is_broker,
    type_of_broker_service,
    markets_covered,
    customers_covered,
  } = service;

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-cpg-teal/30 hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Header with Logo and Company Name */}
      <div className="flex items-start gap-4 mb-4">
        {logo_url ? (
          <div className="h-14 w-14 rounded-xl border-2 border-gray-100 flex-shrink-0 bg-white flex items-center justify-center overflow-hidden">
            <img
              src={logo_url}
              alt={`${company_name} logo`}
              className="max-h-full max-w-full object-contain p-1"
            />
          </div>
        ) : (
          <div className="h-14 w-14 rounded-xl bg-cpg-teal/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-7 w-7 text-cpg-teal" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {company_name}
          </h3>

          {/* Website Link */}
          {company_website && (
            <a
              href={company_website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cpg-teal hover:underline text-sm inline-flex items-center gap-1 mt-1 max-w-full"
            >
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {company_website.replace(/^https?:\/\//, "")}
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Category Tags */}
      {category_of_service?.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {category_of_service.slice(0, 3).map((category, idx) => (
              <span
                key={idx}
                className="bg-cpg-teal/10 text-cpg-teal text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {category}
              </span>
            ))}
            {category_of_service.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{category_of_service.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Broker Services Tags */}
      {is_broker && type_of_broker_service?.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {type_of_broker_service.slice(0, 2).map((svc, idx) => (
              <span
                key={idx}
                className="bg-cpg-brown/10 text-cpg-brown text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {svc}
              </span>
            ))}
            {type_of_broker_service.length > 2 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{type_of_broker_service.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Markets Covered */}
      {markets_covered?.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">
            {markets_covered.slice(0, 2).join(", ")}
            {markets_covered.length > 2 && ` +${markets_covered.length - 2}`}
          </span>
        </div>
      )}

      {/* View Profile Button */}
      <Button
        variant="default"
        size="default"
        className="w-full bg-cpg-brown hover:bg-cpg-brown/90 rounded-xl h-11 group mt-auto"
        asChild
      >
        <Link to={`/services/${id}`} className="flex items-center justify-center gap-2">
          View Profile
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
};

export default ServiceProviderCard;

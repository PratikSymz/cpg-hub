import React from "react";
import { MapPinIcon, ExternalLink } from "lucide-react";
import { Button } from "./ui/button.jsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card.jsx";
import { Link } from "react-router-dom";

const ServiceProviderCard = ({ service }) => {
  const {
    id,
    company_name,
    logo_url,
    company_website,
    brand_hq,
    area_of_specialization,
    category_of_service,
    type_of_broker_service,
    markets_covered
  } = service;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex">
        <CardTitle className="flex justify-between font-bold text-black/90">
          <span>{company_name}</span>
          {logo_url && (
            <img
              src={logo_url}
              alt="Logo"
              className="h-6 w-auto object-contain"
            />
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 flex-1 text-black/90">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPinIcon size={15} />
            <span>{brand_hq || "HQ not provided"}</span>
          </div>

          {company_website && (
            <a
              href={company_website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-700 hover:underline"
            >
              Website <ExternalLink size={14} />
            </a>
          )}
        </div>

        <hr />

        <div className="text-sm">
          <strong>Specialization:</strong> {area_of_specialization}
        </div>

        <div className="text-sm">
          <strong>Categories:</strong>{" "}
          {JSON.parse(category_of_service).join(", ")}
        </div>

        <div className="text-sm">
          <strong>Broker Services:</strong>{" "}
          {JSON.parse(type_of_broker_service).join(", ")}
        </div>

        {markets_covered.length > 0 && (
          <div className="text-sm">
            <strong>Markets Covered:</strong>{" "}
            {JSON.parse(markets_covered).join(", ")}
          </div>
        )}
      </CardContent>

      <CardFooter className={""}>
        <Link to={`/services/${id}`} className="w-full">
          <Button
            variant="secondary"
            size="default"
            className="w-full text-black/90"
          >
            View Profile
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ServiceProviderCard;

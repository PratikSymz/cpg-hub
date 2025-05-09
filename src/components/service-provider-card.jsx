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
import { FaGlobe } from "react-icons/fa";

const ServiceProviderCard = ({ service }) => {
  const {
    id,
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
    user_id,
  } = service;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex">
        <CardTitle className="flex justify-between items-center text-lg font-bold">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {logo_url && (
                <img
                  src={logo_url}
                  alt="Logo"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              )}
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold">{company_name}</h1>
                <div className="flex flex-row gap-4 mt-2">
                  {company_website && (
                    <Link to={company_website}>
                      <FaGlobe className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 text-sm text-black/90">
        <p>
          <strong>Categories of Service:</strong>{" "}
          {category_of_service.map((category, idx) => (
            <span
              key={idx}
              className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 mx-1 rounded-full"
            >
              {category}
            </span>
          )) || "N/A"}
        </p>
        {is_broker && type_of_broker_service && (
          <p>
            <strong>Broker Services:</strong>{" "}
            {type_of_broker_service.map((service, idx) => (
              <span
                key={idx}
                className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 mx-1 rounded-full"
              >
                {service}
              </span>
            )) || "N/A"}
          </p>
        )}
        {markets_covered && (
          <p>
            <strong>Markets Covered:</strong>{" "}
            {markets_covered.map((market, idx) => (
              <span
                key={idx}
                className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 mx-1 rounded-full"
              >
                {market}
              </span>
            )) || "N/A"}
          </p>
        )}
        <p className="text-muted-foreground">{area_of_specialization}</p>
      </CardContent>

      <CardFooter className="flex flex-row gap-6">
        <Button
          variant="default"
          size="default"
          className="flex-1 bg-cpg-brown hover:bg-cpg-brown/90"
          asChild
        >
          <Link to={`/services/${id}`} className="w-full">
            View Profile
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceProviderCard;

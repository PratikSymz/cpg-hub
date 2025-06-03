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
import { Skeleton } from "./ui/skeleton.jsx";
import clsx from "clsx";

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
              {!logo_url && (
                <Skeleton className="h-16 w-16 rounded-full bg-black/15" />
              )}
              {logo_url && (
                <img
                  src={logo_url}
                  alt="Logo"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              )}
              <div className="flex flex-col">
                <h1
                  className={clsx(
                    "text-2xl font-bold",
                    company_website && "hover:underline"
                  )}
                >
                  {company_website ? (
                    <Link to={company_website}>{company_name}</Link>
                  ) : (
                    <span>{company_name}</span>
                  )}
                </h1>
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 text-sm w-full text-black/90">
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
        <p className="text-sm text-muted-foreground line-clamp-4">
          {customers_covered}
        </p>
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

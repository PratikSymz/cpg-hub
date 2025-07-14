import React from "react";
import { Button } from "./ui/button.jsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card.jsx";
import { Link } from "react-router-dom";
import { Skeleton } from "./ui/skeleton.jsx";
import clsx from "clsx";

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
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6">
        {/* Avatar + Company */}
        <div className="flex self-start items-center gap-4">
          {logo_url ? (
            <img
              src={logo_url}
              alt="Logo"
              className="h-16 w-16 rounded-full object-cover border"
            />
          ) : (
            <Skeleton className="h-16 w-16 rounded-full bg-black/15" />
          )}

          <div className="flex flex-col text-center sm:text-left">
            <h1
              className={clsx(
                "text-xl sm:text-2xl font-bold",
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
      </CardHeader>

      <CardContent className="flex flex-col gap-3 text-sm text-black/90">
        {/* Categories */}
        <div>
          <strong>Categories of Service:</strong>
          <div className="flex flex-wrap gap-2 mt-1">
            {category_of_service?.length > 0 ? (
              category_of_service.map((category, idx) => (
                <span
                  key={idx}
                  className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 rounded-full"
                >
                  {category}
                </span>
              ))
            ) : (
              <span className="text-gray-500 ml-2">N/A</span>
            )}
          </div>
        </div>

        {/* Broker Services */}
        {is_broker && type_of_broker_service?.length > 0 && (
          <div>
            <strong>Broker Services:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {type_of_broker_service.map((service, idx) => (
                <span
                  key={idx}
                  className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 rounded-full"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Markets Covered */}
        {markets_covered?.length > 0 && (
          <div>
            <strong>Markets Covered:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {markets_covered.map((market, idx) => (
                <span
                  key={idx}
                  className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 rounded-full"
                >
                  {market}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-4">
          {customers_covered}
        </p>
      </CardContent>

      <CardFooter className="mt-2">
        <Button
          variant="default"
          size="default"
          className="w-full sm:flex-1 bg-cpg-brown hover:bg-cpg-brown/90"
          asChild
        >
          <Link to={`/services/${id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceProviderCard;

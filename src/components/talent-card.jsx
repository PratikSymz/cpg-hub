import React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "./ui/button.jsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card.jsx";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const TalentCard = ({ talent }) => {
  const { user } = useUser();

  const {
    id,
    level_of_experience,
    area_of_specialization,
    industry_experience,
    linkedin_url,
    portfolio_url,
    resume_url,
  } = talent;

  const email = user?.emailAddresses?.[0]?.emailAddress;
  const image_url = user?.imageUrl;
  const full_name = user?.fullName;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex">
        <CardTitle className="flex justify-between items-center text-lg font-bold">
          <span>{full_name}</span>
          {image_url && (
            <img
              src={image_url}
              alt="Profile"
              className="h-10 w-10 rounded-full object-cover border"
            />
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 text-sm text-black/90">
        <p>
          <strong>Experience Level:</strong>{" "}
          {JSON.parse(level_of_experience).join(", ") || "N/A"}
        </p>
        <p>
          <strong>Specialization:</strong>{" "}
          {JSON.parse(area_of_specialization).join(", ") || "N/A"}
        </p>
        <p className="text-muted-foreground">{industry_experience}</p>

        <div className="flex flex-col gap-1 mt-2">
          {linkedin_url && (
            <a
              href={linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 hover:underline flex gap-1 items-center"
            >
              LinkedIn <ExternalLink size={14} />
            </a>
          )}
          {portfolio_url && (
            <a
              href={portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 hover:underline flex gap-1 items-center"
            >
              Portfolio <ExternalLink size={14} />
            </a>
          )}
          {resume_url && (
            <a
              href={resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 hover:underline flex gap-1 items-center"
            >
              Resume <ExternalLink size={14} />
            </a>
          )}
        </div>
      </CardContent>

      <CardFooter className={""}>
        <Link to={`/talents/${id}`} className="w-full">
          <Button variant="secondary" size="default" className="w-full">
            View Profile
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default TalentCard;

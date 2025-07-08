import React from "react";
import { FaLinkedin } from "react-icons/fa";
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
import clsx from "clsx";

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
    user_info,
  } = talent;

  const email = user_info.email;
  const image_url = user_info.profile_picture_url;
  const full_name = user_info.full_name;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6">
        {/* Avatar + Name */}
        <div className="flex self-start items-center gap-4">
          {image_url && (
            <img
              src={image_url}
              alt="Profile"
              className="h-16 w-16 rounded-full object-cover border"
            />
          )}
          <div className="flex flex-col items-start text-center sm:text-left">
            <h1
              className={clsx(
                "text-xl sm:text-2xl font-bold",
                portfolio_url && "hover:underline"
              )}
            >
              {portfolio_url ? (
                <Link to={portfolio_url}>{full_name}</Link>
              ) : (
                <span>{full_name}</span>
              )}
            </h1>

            {/* LinkedIn */}
            {linkedin_url && (
              <div className="mt-1">
                <Link to={linkedin_url}>
                  <FaLinkedin className="text-[#0072b1] h-5 w-5 hover:scale-110 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 text-sm text-black/90">
        {/* Experience */}
        <div>
          <strong>Experience Level:</strong>
          <div className="flex flex-wrap gap-2 mt-1">
            {level_of_experience?.length > 0 ? (
              level_of_experience.map((level, idx) => (
                <span
                  key={idx}
                  className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 rounded-full"
                >
                  {level}
                </span>
              ))
            ) : (
              <span className="text-gray-500 ml-2">N/A</span>
            )}
          </div>
        </div>

        {/* Specialization */}
        <div>
          <strong>Specialization:</strong>
          <div className="flex flex-wrap gap-2 mt-1">
            {area_of_specialization?.length > 0 ? (
              area_of_specialization.map((area, idx) => (
                <span
                  key={idx}
                  className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 rounded-full"
                >
                  {area}
                </span>
              ))
            ) : (
              <span className="text-gray-500 ml-2">N/A</span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-4">
          {industry_experience}
        </p>
      </CardContent>

      <CardFooter className="mt-2">
        <Button
          variant="default"
          size="default"
          className="w-full sm:flex-1 bg-cpg-brown hover:bg-cpg-brown/90"
          asChild
        >
          <Link to={`/talents/${id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TalentCard;

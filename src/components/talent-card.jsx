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
import { FaLinkedin, FaGlobe, FaFileAlt } from "react-icons/fa";
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
      <CardHeader className="flex">
        <CardTitle className="flex justify-between items-center text-lg font-bold">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {image_url && (
                <img
                  src={image_url}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              )}
              <div className="flex flex-col">
                <h1
                  className={clsx(
                    "text-2xl font-bold",
                    portfolio_url && "hover:underline"
                  )}
                >
                  {portfolio_url ? (
                    <Link to={portfolio_url}>{full_name}</Link>
                  ) : (
                    <span>{full_name}</span>
                  )}
                </h1>
                <div className="flex flex-row gap-4 mt-2">
                  {linkedin_url && (
                    <Link to={linkedin_url}>
                      <FaLinkedin
                        className="text-gray-700 hover:text-gray-800 h-5.5 w-5.5 transition-transform duration-150 hover:scale-110"
                        style={{ color: "#0072b1" }}
                      />
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
          <strong>Experience Level:</strong>{" "}
          {level_of_experience.map((level, idx) => (
            <span
              key={idx}
              className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 mx-1 rounded-full"
            >
              {level}
            </span>
          )) || "N/A"}
        </p>
        <p>
          <strong>Specialization:</strong>{" "}
          {area_of_specialization.map((level, idx) => (
            <span
              key={idx}
              className="bg-cpg-teal text-white text-sm font-normal px-3 py-1 mx-1 rounded-full"
            >
              {level}
            </span>
          )) || "N/A"}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-4">
          {industry_experience}
        </p>
      </CardContent>

      <CardFooter className="flex flex-row gap-6">
        {/* <Button variant="outline" size="default" className="flex-1" asChild>
          <Link to={resume_url}>View Resume</Link>
        </Button> */}

        <Button
          variant="default"
          size="default"
          className="flex-1 bg-cpg-brown hover:bg-cpg-brown/90"
          asChild
        >
          <Link to={`/talents/${id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TalentCard;

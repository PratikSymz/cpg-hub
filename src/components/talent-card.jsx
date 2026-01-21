import React from "react";
import { FaLinkedin } from "react-icons/fa";
import { Button } from "./ui/button.jsx";
import { Link } from "react-router-dom";
import { ArrowRight, Globe } from "lucide-react";

const TalentCard = ({ talent }) => {
  const {
    id,
    level_of_experience,
    area_of_specialization,
    industry_experience,
    linkedin_url,
    portfolio_url,
    user_info,
  } = talent;

  const image_url = user_info?.profile_picture_url;
  const full_name = user_info?.full_name;

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-cpg-teal/30 hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Header with Avatar and Name */}
      <div className="flex items-start gap-4 mb-4">
        {image_url ? (
          <img
            src={image_url}
            alt={full_name}
            className="h-14 w-14 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-cpg-teal/10 flex items-center justify-center flex-shrink-0">
            <span className="text-cpg-teal font-semibold text-lg">
              {full_name?.charAt(0) || "?"}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {full_name || "Unknown"}
          </h3>

          {/* Social Links */}
          <div className="flex items-center gap-2 mt-1">
            {linkedin_url && (
              <Link
                to={linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0072b1] hover:scale-110 transition-transform"
              >
                <FaLinkedin className="h-4 w-4" />
              </Link>
            )}
            {portfolio_url && (
              <Link
                to={portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-cpg-teal hover:scale-110 transition-transform"
              >
                <Globe className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Experience Level Tags */}
      {level_of_experience?.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {level_of_experience.slice(0, 2).map((level, idx) => (
              <span
                key={idx}
                className="bg-cpg-brown/10 text-cpg-brown text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {level}
              </span>
            ))}
            {level_of_experience.length > 2 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{level_of_experience.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Specialization Tags */}
      {area_of_specialization?.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {area_of_specialization.slice(0, 3).map((area, idx) => (
              <span
                key={idx}
                className="bg-cpg-teal/10 text-cpg-teal text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {area}
              </span>
            ))}
            {area_of_specialization.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{area_of_specialization.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Industry Experience Preview */}
      {industry_experience && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {industry_experience}
        </p>
      )}

      {/* View Profile Button */}
      <Button
        variant="default"
        size="default"
        className="w-full bg-cpg-brown hover:bg-cpg-brown/90 rounded-xl h-11 group mt-auto"
        asChild
      >
        <Link to={`/talents/${id}`} className="flex items-center justify-center gap-2">
          View Profile
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
};

export default TalentCard;

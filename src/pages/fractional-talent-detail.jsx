import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { getTalent } from "@/api/apiTalent.js"; // <- fetch talent_profiles by ID
import { Copy, ExternalLink } from "lucide-react";
import { BarLoader } from "react-spinners";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";

const tabs = [
  {
    name: "About",
    value: "about",
    content: "",
  },
  {
    name: "About",
    value: "about_1",
    content: "",
  },
  {
    name: "About",
    value: "about_2",
    content: "",
  },
];

const FractionalTalentDetail = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();

  // Load talent
  const {
    func: funcTalent,
    data: talent,
    loading,
    error,
  } = useFetch(getTalent, { talent_id: id });

  useEffect(() => {
    if (isLoaded) funcTalent();
  }, [isLoaded]);

  if (loading || !talent) {
    return <BarLoader width="100%" color="#36d7b7" />;
  }

  if (error) {
    return <p className="text-red-500 text-center">Error loading profile.</p>;
  }

  const email = user?.emailAddresses?.[0]?.emailAddress;
  const image_url = user?.imageUrl;
  const full_name = user?.fullName;

  const {
    level_of_experience = [],
    area_of_specialization = [],
    industry_experience,
    linkedin_url,
    portfolio_url,
    resume_url,
  } = talent;

  return (
    <div className="flex flex-col gap-10 mt-10 px-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={image_url}
            alt="Profile"
            className="h-20 w-20 rounded-full border object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold">{full_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fractional Talent
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Button variant="outline" size="lg" className="rounded-3xl px-7 py-5">
            Contact
          </Button>
        </div>

        {/* <div className="flex flex-col gap-2 text-sm">
          {linkedin_url && (
            <a
              href={linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline flex items-center gap-1"
            >
              LinkedIn <ExternalLink size={14} />
            </a>
          )}
          {portfolio_url && (
            <a
              href={portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline flex items-center gap-1"
            >
              Portfolio <ExternalLink size={14} />
            </a>
          )}
          {resume_url && (
            <a
              href={resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline flex items-center gap-1"
            >
              Resume <ExternalLink size={14} />
            </a>
          )}
        </div> */}
      </div>

      <div className="flex bg-gray-100 rounded-2xl h-0.5 mt-4"></div>

      <div className="flex flex-col gap-2 text-sm w-fit">
          <Button variant="outline" size="default" className="rounded-3xl px-7 py-5">
            About
          </Button>
        </div>

      {/* Experience Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Industry Experience</h2>
        <p className="text-muted-foreground text-base whitespace-pre-line">
          {industry_experience}
        </p>
      </div>

      {/* Tags */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Level of Experience</h2>
        <div className="flex flex-wrap gap-2">
          {JSON.parse(level_of_experience).map((level, idx) => (
            <span
              key={idx}
              className="bg-green-100 text-green-800 text-sm font-medium px-4 py-1 rounded-full"
            >
              {level}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Area of Specialization</h2>
        <div className="flex flex-wrap gap-2">
          {JSON.parse(area_of_specialization).map((area, idx) => (
            <span
              key={idx}
              className="bg-teal-100 text-teal-800 text-sm font-medium px-4 py-1 rounded-full"
            >
              {area}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FractionalTalentDetail;

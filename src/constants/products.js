import { ROLE_BRAND, ROLE_SERVICE, ROLE_TALENT } from "./roles.js";

// cardsData.js (optional file if you want to split data out)
export const products = [
    {
      id: 1,
      title: "FRACTIONAL JOB BOARD",
      description:
        "This is the spot for CPG brands to post fractional job needs and for fractional talent to search and apply.",
      primaryButton: {
        label: "Explore",
        link: "/jobs",
      },
      secondaryButton: {
        label: "Post Job",
        link: "/post-job",
        role: ROLE_BRAND
      },
    },
    {
      id: 2,
      title: "DIRECTORY OF CPG FRACTIONAL TALENT",
      description:
        "Search this directory of profiles to find spot-on talent to help your CPG brand grow.",
      primaryButton: {
        label: "Explore",
        link: "/talents",
      },
      secondaryButton: {
        label: "Add Profile",
        link: "/post-talent",
        role: ROLE_TALENT
      },
    },
    {
      id: 3,
      title: "DIRECTORY OF CPG SERVICES",
      description:
        "You’ve arrived at the perfect spot to find a directory of services to support your CPG brand.",
      primaryButton: {
        label: "Explore",
        link: "/services",
      },
      secondaryButton: {
        label: "Add Profile",
        link: "/post-service",
        role: ROLE_SERVICE
      },
    },
  ];
  
import React, { useEffect, useMemo, useState } from "react";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";
import JobCard from "@/components/job-card.jsx";
import { BarLoader } from "react-spinners";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import { getJobs } from "@/api/apiFractionalJobs.js";
import BackButton from "@/components/back-button.jsx";

const classDefault = "";

function FractionalJobListing() {
  // Once user is loaded, fetch job data -> session()
  const { isLoaded } = useUser();

  // Job Filters
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [areaSpec, setAreaSpec] = useState("");
  const [levelExp, setLevelExp] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(true);

  const {
    func: funcJobs,
    data: jobList,
    loading: loadingJobs,
  } = useFetch(getJobs);

  useEffect(() => {
    if (isLoaded) funcJobs({});
  }, [isLoaded]);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Clear filters
  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setAreaSpec("");
    setLevelExp("");
  };

  const filteredJobs = useMemo(() => {
    if (!jobList) return [];

    return jobList.filter((job) => {
      if (areaSpec && Array.isArray(job.area_of_specialization)) {
        if (!job.area_of_specialization.includes(areaSpec)) return false;
      }

      if (levelExp && Array.isArray(job.level_of_experience)) {
        if (!job.level_of_experience.includes(levelExp)) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const title = job?.job_title?.toLowerCase() ?? "";
        if (!title.includes(q)) return false;
      }
      return true;
    });
  }, [jobList, areaSpec, levelExp, searchQuery]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"90%"} color="#00A19A" />;
  }

  return (
    <div className="px-4 sm:px-6 py-10">
      <BackButton />
      <h1 className="text-3xl font-bold mb-8 text-center">Browse Jobs</h1>

      {loadingJobs && (
        <BarLoader className="mt-4" width="100%" color="#36d7b7" />
      )}

      {/* Search */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="h-14 flex flex-row w-full gap-2 items-center mb-4"
      >
        <Input
          type="text"
          placeholder="Search Jobs"
          name="search-query"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-full flex-1 placeholder:text-black/60 placeholder:font-medium text-black/90 px-4 text-md"
        />
      </form>

      {/* Mobile: Show/Hide Filters */}
      <div className="sm:hidden mb-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowMobileFilters((prev) => !prev)}
        >
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start w-full">
        {/* Filters */}
        <div
          className={`
            sm:flex sm:flex-none
            ${showMobileFilters ? "block" : "hidden"}
            sm:block
            transition-all duration-300 ease-in-out
            w-full sm:w-auto
          `}
        >
          <div className="flex flex-col items-center justify-center md:flex-row">
            <div className="grid grid-cols-1 gap-8 w-full sm:mx-8 sm:w-auto">
              <div className="w-full sm:w-64">
                <label className="mb-2 font-medium block">
                  Area of Specialization
                </label>
                <Select value={areaSpec} onValueChange={setAreaSpec}>
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className={classDefault}>
                    <SelectGroup>
                      {areasOfSpecialization.map(({ label, value }) => (
                        <SelectItem
                          className={classDefault}
                          key={value}
                          value={label}
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-64">
                <label className="mb-2 font-medium block">
                  Level of Experience
                </label>
                <Select value={levelExp} onValueChange={setLevelExp}>
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className={classDefault}>
                    <SelectGroup>
                      {levelsOfExperience.map(({ label, value }) => (
                        <SelectItem
                          className={classDefault}
                          key={value}
                          value={label}
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full flex gap-4 sm:w-64">
                <Button
                  className="flex-1 bg-cpg-brown hover:bg-cpg-brown/90 cursor-pointer"
                  size="default"
                  variant="default"
                >
                  Apply Filters
                </Button>
                <Button
                  className="flex-1 cursor-pointer"
                  size="default"
                  variant="outline"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Listing Grid */}
        <div className="flex-auto sm:mx-8 mt-6 sm:mt-0">
          {loadingJobs === false && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => {
                  return (
                    <JobCard
                      key={job.id}
                      job={job}
                      isSaved={job?.saved?.length > 0}
                    />
                  );
                })
              ) : (
                <div>No Jobs Found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FractionalJobListing;

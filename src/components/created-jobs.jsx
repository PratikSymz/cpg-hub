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
import { getMyJobs } from "@/api/apiFractionalJobs.js";

function FractionalJobListing() {
  // Once user is loaded, fetch job data -> session()
  const { user, isLoaded } = useUser();

  // Job Filters
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [areaSpec, setAreaSpec] = useState("");
  const [levelExp, setLevelExp] = useState("");

  const {
    func: funcMyJobs,
    data: myJobList,
    loading: loadingMyJobs,
  } = useFetch(getMyJobs);

  useEffect(() => {
    if (isLoaded) funcMyJobs({ brand_id: user.id });
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

  const filteredMyJobs = useMemo(() => {
    if (!myJobList) return [];

    return myJobList.filter((job) => {
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
  }, [myJobList, areaSpec, levelExp, searchQuery]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"90%"} color="#00A19A" />;
  }

  return (
    <div className="mt-8">
      {/* Loading bar */}
      {loadingMyJobs && (
        <BarLoader className="mt-4" width={"100%"} color="#36d7b7" />
      )}

      <div className="flex flex-row w-full">
        {/* Filters */}
        <div className="flex-none">
          <div className="flex flex-col items-center justify-center md:flex-row">
            <div className="mx-8 grid grid-cols-1 gap-8 w-full">
              <div>
                <label className="mb-2 font-medium">
                  Area of Specialization
                </label>
                <Select value={areaSpec} onValueChange={setAreaSpec}>
                  <SelectTrigger className="mt-4 w-64">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectGroup>
                      {areasOfSpecialization.map(({ label, value }) => {
                        return (
                          <SelectItem className="" key={value} value={label}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 font-medium">Level of Experience</label>
                <Select value={levelExp} onValueChange={setLevelExp}>
                  <SelectTrigger className="mt-4 w-64">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectGroup>
                      {levelsOfExperience.map(({ label, value }) => {
                        return (
                          <SelectItem className="" key={value} value={label}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex">
                <Button
                  className="w-full bg-cpg-brown hover:bg-cpg-brown/90 cursor-pointer"
                  size="default"
                  variant="default"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-auto mx-8">
          {/* Search box */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="h-14 flex flex-row w-full gap-2 items-center mb-3"
          >
            <Input
              type="text"
              placeholder="Search Jobs"
              name="search-query"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-full flex-1 placeholder:text-black/60 placeholder:font-medium text-black/90 px-4 text-md"
            />
          </form>

          {/* My Job Listing */}
          {loadingMyJobs === false && (
            <div className="grid grid-rows sm:grid-rows lg:grid-rows gap-6 mt-8">
              {filteredMyJobs.length > 0 ? (
                filteredMyJobs.map((job) => {
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

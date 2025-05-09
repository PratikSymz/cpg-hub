import React, { useEffect, useState } from "react";
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
import { getJobs, getMyJobs } from "@/api/apiFractionalJobs.js";

function FractionalJobListing() {
  // Once user is loaded, fetch job data -> session()
  const { user, isLoaded } = useUser();

  // Job Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [areaSpec, setAreaSpec] = useState("");
  const [levelExp, setLevelExp] = useState("");

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setAreaSpec("");
    setLevelExp("");
  };

  const {
    func: funcJobs,
    data: jobs,
    loading: loadingJobs,
  } = useFetch(getMyJobs);

  useEffect(() => {
    if (isLoaded)
      funcJobs({
        area_specialization: areaSpec,
        level_exp: levelExp,
        search_query: searchQuery,
        brand_id: user.id,
      });
  }, [isLoaded, user, areaSpec, levelExp, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    let formData = new FormData(e.target);

    const query = formData.get("search-query");
    if (typeof query === "string") setSearchQuery(query);
  };

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"90%"} color="#00A19A" />;
  }

  return (
    <div className="mt-8">

      {/* Loading bar */}
      {loadingJobs && (
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
                  className="w-full bg-cpg-brown hover:bg-cpg-brown/90"
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
            onSubmit={handleSearch}
            className="h-14 flex flex-row w-full gap-2 items-center mb-3"
          >
            <Input
              type="text"
              placeholder="Search Jobs"
              name="search-query"
              className="h-full flex-1 placeholder:text-black/60 placeholder:font-medium text-black/90 px-4 text-md"
            />
            <Button
              variant="default"
              size="default"
              type="submit"
              className="h-full bg-cpg-brown hover:bg-cpg-brown/90 sm:w-28"
            >
              Search
            </Button>
          </form>

          {/* Job Listing */}
          {loadingJobs === false && (
            <div className="grid grid-rows sm:grid-rows lg:grid-rows gap-6 mt-8">
              {jobs?.length ? (
                jobs.map((job) => {
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

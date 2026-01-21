import React, { useEffect, useMemo, useState } from "react";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";
import JobCard from "@/components/job-card.jsx";
import { BarLoader } from "react-spinners";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import { getMyJobs } from "@/api/apiFractionalJobs.js";
import { Search, SlidersHorizontal, X, Briefcase } from "lucide-react";
import clsx from "clsx";

function CreatedJobs() {
  const { user, isLoaded } = useUser();

  // Job Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const {
    func: funcMyJobs,
    data: myJobList,
    loading: loadingMyJobs,
  } = useFetch(getMyJobs);

  useEffect(() => {
    if (isLoaded && user?.id) funcMyJobs({ poster_id: user.id });
  }, [isLoaded, user?.id]);

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSpecs([]);
    setSelectedLevels([]);
  };

  const hasActiveFilters = searchQuery || selectedSpecs.length > 0 || selectedLevels.length > 0;

  const toggleSpec = (spec) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const toggleLevel = (level) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const filteredMyJobs = useMemo(() => {
    if (!myJobList) return [];

    return myJobList.filter((job) => {
      // Filter by specialization (any match)
      if (selectedSpecs.length > 0 && Array.isArray(job.area_of_specialization)) {
        const hasMatch = selectedSpecs.some((spec) =>
          job.area_of_specialization.includes(spec)
        );
        if (!hasMatch) return false;
      }

      // Filter by level (any match)
      if (selectedLevels.length > 0 && Array.isArray(job.level_of_experience)) {
        const hasMatch = selectedLevels.some((level) =>
          job.level_of_experience.includes(level)
        );
        if (!hasMatch) return false;
      }

      // Filter by search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const title = job?.job_title?.toLowerCase() ?? "";
        const posterName = job?.poster_name?.toLowerCase() ?? "";
        if (!title.includes(q) && !posterName.includes(q)) return false;
      }

      return true;
    });
  }, [myJobList, selectedSpecs, selectedLevels, searchQuery]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#00A19A" />;
  }

  return (
    <div className="mt-8">
      {/* Loading bar */}
      {loadingMyJobs && (
        <BarLoader className="mb-4" width={"100%"} color="#00A19A" />
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search your jobs by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-14 pl-12 pr-4 text-base rounded-xl border-2 border-gray-200 focus:border-cpg-teal"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Toggle Button (Mobile) */}
      <div className="lg:hidden mb-6">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            "w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2",
            showFilters ? "border-cpg-teal bg-cpg-teal/5" : "border-gray-200"
          )}
        >
          <SlidersHorizontal className="h-5 w-5" />
          {showFilters ? "Hide Filters" : "Show Filters"}
          {hasActiveFilters && (
            <span className="bg-cpg-teal text-white text-xs px-2 py-0.5 rounded-full ml-2">
              {selectedSpecs.length + selectedLevels.length}
            </span>
          )}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div
          className={clsx(
            "lg:w-72 flex-shrink-0",
            showFilters ? "block" : "hidden lg:block"
          )}
        >
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-cpg-teal hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Specialization Filter */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-4 text-gray-700">
                Area of Specialization
              </h3>
              <div className="flex flex-wrap gap-2">
                {areasOfSpecialization.map(({ label }) => (
                  <button
                    key={label}
                    onClick={() => toggleSpec(label)}
                    className={clsx(
                      "px-3 py-1.5 text-sm rounded-full border transition-all",
                      selectedSpecs.includes(label)
                        ? "bg-cpg-teal text-white border-cpg-teal"
                        : "bg-white text-gray-700 border-gray-200 hover:border-cpg-teal hover:bg-cpg-teal/5"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-700">
                Experience Level
              </h3>
              <div className="flex flex-wrap gap-2">
                {levelsOfExperience.map(({ label }) => (
                  <button
                    key={label}
                    onClick={() => toggleLevel(label)}
                    className={clsx(
                      "px-3 py-1.5 text-sm rounded-full border transition-all",
                      selectedLevels.includes(label)
                        ? "bg-cpg-teal text-white border-cpg-teal"
                        : "bg-white text-gray-700 border-gray-200 hover:border-cpg-teal hover:bg-cpg-teal/5"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="flex-1">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {loadingMyJobs ? (
                "Loading..."
              ) : (
                <>
                  <span className="font-semibold text-gray-900">
                    {filteredMyJobs.length}
                  </span>{" "}
                  {filteredMyJobs.length === 1 ? "job" : "jobs"} found
                </>
              )}
            </p>
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {selectedSpecs.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-2 bg-cpg-teal/10 text-cpg-teal text-sm font-medium px-4 py-2 rounded-full cursor-pointer hover:bg-cpg-teal/20 transition-colors"
                  >
                    {spec}
                    <button onClick={() => toggleSpec(spec)} className="hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
                {selectedLevels.map((level) => (
                  <span
                    key={level}
                    className="inline-flex items-center gap-2 bg-cpg-teal/10 text-cpg-teal text-sm font-medium px-4 py-2 rounded-full cursor-pointer hover:bg-cpg-teal/20 transition-colors"
                  >
                    {level}
                    <button onClick={() => toggleLevel(level)} className="hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Job Cards */}
          {!loadingMyJobs && (
            <>
              {filteredMyJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredMyJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isMySubmission={true}
                      isSaved={job?.saved?.length > 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-gray-100 rounded-full p-6 mb-6">
                    <Briefcase className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {hasActiveFilters
                      ? "Try adjusting your filters or search query."
                      : "You haven't posted any jobs yet. Start by creating your first job listing!"}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="border-2 border-cpg-teal text-cpg-teal hover:bg-cpg-teal/5"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreatedJobs;

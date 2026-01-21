import React, { useEffect, useMemo, useState } from "react";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";
import TalentCard from "@/components/talent-card.jsx";
import { getAllTalent } from "@/api/apiTalent.js";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import BackButton from "@/components/back-button.jsx";
import { Search, SlidersHorizontal, X, Users } from "lucide-react";
import clsx from "clsx";

const FractionalTalentListing = () => {
  const { isLoaded } = useUser();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const {
    func: funcTalents,
    data: talentList,
    loading,
    error,
  } = useFetch(getAllTalent);

  useEffect(() => {
    if (isLoaded) funcTalents({});
  }, [isLoaded]);

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSpecs([]);
    setSelectedLevels([]);
  };

  const hasActiveFilters =
    searchQuery || selectedSpecs.length > 0 || selectedLevels.length > 0;

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

  const filteredTalents = useMemo(() => {
    if (!talentList) return [];

    return talentList.filter((talent) => {
      // Filter by specialization (any match)
      if (
        selectedSpecs.length > 0 &&
        Array.isArray(talent.area_of_specialization)
      ) {
        const hasMatch = selectedSpecs.some((spec) =>
          talent.area_of_specialization.includes(spec)
        );
        if (!hasMatch) return false;
      }

      // Filter by level (any match)
      if (
        selectedLevels.length > 0 &&
        Array.isArray(talent.level_of_experience)
      ) {
        const hasMatch = selectedLevels.some((level) =>
          talent.level_of_experience.includes(level)
        );
        if (!hasMatch) return false;
      }

      // Filter by search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = talent?.user_info?.full_name?.toLowerCase() ?? "";
        const email = talent?.user_info?.email?.toLowerCase() ?? "";
        const experience =
          talent?.industry_experience?.toLowerCase() ?? "";
        if (
          !name.includes(q) &&
          !email.includes(q) &&
          !experience.includes(q)
        )
          return false;
      }

      return true;
    });
  }, [talentList, selectedSpecs, selectedLevels, searchQuery]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#00A19A" />;
  }

  return (
    <div className="py-10">
      {/* Header */}
      <div className="w-5/6 mx-auto mb-8">
        <BackButton />
        <h1 className="gradient-title font-extrabold text-4xl sm:text-5xl lg:text-6xl text-center mt-6">
          Find Fractional Talent
        </h1>
        <p className="text-center text-muted-foreground mt-4 text-lg">
          Connect with experienced CPG professionals ready to help your brand grow
        </p>
      </div>

      {loading && <BarLoader className="mb-4" width="100%" color="#00A19A" />}
      {error && (
        <p className="text-red-500 text-center">Error loading talent</p>
      )}

      <div className="w-5/6 mx-auto">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or experience..."
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

          {/* Talents Grid */}
          <div className="flex-1">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {loading ? (
                  "Loading..."
                ) : (
                  <>
                    <span className="font-semibold text-gray-900">
                      {filteredTalents.length}
                    </span>{" "}
                    {filteredTalents.length === 1 ? "talent" : "talents"} found
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

            {/* Talent Cards */}
            {!loading && (
              <>
                {filteredTalents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTalents.map((talent) => (
                      <TalentCard key={talent.id} talent={talent} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-gray-100 rounded-full p-6 mb-6">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No talent found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      {hasActiveFilters
                        ? "Try adjusting your filters or search query to find more professionals."
                        : "There are no talent profiles available at the moment. Check back soon!"}
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
    </div>
  );
};

export default FractionalTalentListing;

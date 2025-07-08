import React, { useEffect, useMemo, useState } from "react";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";
import TalentCard from "@/components/talent-card.jsx";
import { getAllTalent } from "@/api/apiTalent.js";
import { BarLoader } from "react-spinners";
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
import { Input } from "@/components/ui/input.jsx";
import BackButton from "@/components/back-button.jsx";

const FractionalTalentListing = () => {
  const { isLoaded } = useUser();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [areaSpec, setAreaSpec] = useState("");
  const [levelExp, setLevelExp] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const {
    func: funcTalents,
    data: talentList,
    loading,
    error,
  } = useFetch(getAllTalent);

  useEffect(() => {
    if (isLoaded) funcTalents({});
  }, [isLoaded]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setAreaSpec("");
    setLevelExp("");
  };

  const filteredTalents = useMemo(() => {
    if (!talentList) return [];
    return talentList.filter((talent) => {
      if (areaSpec && !talent.area_of_specialization?.includes(areaSpec))
        return false;
      if (levelExp && !talent.level_of_experience?.includes(levelExp))
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = talent?.user_info?.full_name?.toLowerCase() ?? "";
        const email = talent?.user_info?.email?.toLowerCase() ?? "";
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [talentList, areaSpec, levelExp, searchQuery]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"90%"} color="#00A19A" />;
  }

  return (
    <div className="px-4 sm:px-6 py-10">
      <BackButton />
      <h1 className="text-3xl font-bold mb-8 text-center">
        Browse Fractional Talent
      </h1>

      {loading && <BarLoader width="100%" color="#36d7b7" />}
      {error && <p className="text-red-500">Error loading talent</p>}

      {/* Search bar always on top */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="h-14 flex flex-row w-full gap-2 items-center mb-4"
      >
        <Input
          type="text"
          placeholder="Search Talent"
          name="search-query"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-full flex-1 placeholder:text-black/60 placeholder:font-medium text-black/90 px-4 text-md"
        />
      </form>

      {/* Mobile: Show/Hide Filters Button */}
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
        {/* Filters Section */}
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
                  <SelectContent>
                    <SelectGroup>
                      {areasOfSpecialization.map(({ label, value }) => (
                        <SelectItem key={value} value={label}>
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
                  <SelectContent>
                    <SelectGroup>
                      {levelsOfExperience.map(({ label, value }) => (
                        <SelectItem key={value} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-64">
                <Button
                  className="w-full bg-cpg-brown hover:bg-cpg-brown/90"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Talent Listing */}
        <div className="flex-auto sm:mx-8 mt-6 sm:mt-0">
          <div className="grid grid-cols-1 gap-6 mt-4">
            {filteredTalents.length > 0 ? (
              filteredTalents.map((talent) => (
                <TalentCard key={talent.id} talent={talent} />
              ))
            ) : (
              <div>No Talent Found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FractionalTalentListing;

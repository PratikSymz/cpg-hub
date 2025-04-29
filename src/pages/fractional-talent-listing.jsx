import React, { useEffect, useState } from "react";
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

const FractionalTalentListing = () => {
  // Once user is loaded, fetch job data -> session()
  const { isLoaded } = useUser();

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
    func: funcTalents,
    data: talentList,
    loading,
    error,
  } = useFetch(getAllTalent);

  useEffect(() => {
    if (isLoaded)
      funcTalents({
        area_specialization: areaSpec,
        level_exp: levelExp,
        search_query: searchQuery,
        function: "",
      });
  }, [isLoaded, areaSpec, levelExp, searchQuery]);

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
    <div className="px-6 py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Browse Fractional Talent
      </h1>

      {loading && <BarLoader width="100%" color="#36d7b7" />}
      {error && <p className="text-red-500">Error loading talent.</p>}

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
              placeholder="Search Talent"
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

          {/* Talent Listing */}
          <div className="grid grid-rows sm:grid-rows lg:grid-rows gap-6 mt-8">
            {talentList?.length ? (
              talentList?.map((talent) => (
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

import React, { useEffect, useState } from "react";
import { getJobs } from "@/api/apiFractionalJobs.js";
import { getAllBrands } from "@/api/apiBrands.js";
import useFetch from "@/hooks/use-fetch.jsx";
import {
  areasOfSpecialization,
  categoryOfService,
  levelsOfExperience,
  marketsCovered,
} from "@/constants/filters.js";
import JobCard from "@/components/job-card.jsx";
import { useUser } from "@clerk/clerk-react";
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
import { getServices } from "@/api/apiServices.js";

function ServiceProviderListing() {
  // Once user is loaded, fetch job data -> session()
  const { isLoaded } = useUser();

  // Job Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [markets, setMarkets] = useState("");

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setCategory("");
    setMarkets("");
  };

  const {
    func: funcServices,
    data: services,
    loading: loadingServices,
  } = useFetch(getServices, {
    category,
    markets,
    searchQuery,
  });

  useEffect(() => {
    if (isLoaded) funcServices();
  }, [isLoaded, category, markets, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    let formData = new FormData(e.target);

    const query = formData.get("search-query");
    if (query) setSearchQuery(searchQuery);
  };

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"90%"} color="#00A19A" />;
  }

  return (
    <div className="mt-8">
      <h1 className="font-extrabold text-6xl sm:text-7xl text-center pb-8">
        Service Providers/Brokers
      </h1>

      {/* Loading bar */}
      {loadingServices && (
        <BarLoader className="mt-4" width={"100%"} color="#36d7b7" />
      )}

      <div className="flex flex-row w-full">
        {/* Filters */}
        <div className="flex-none">
          <div className="flex flex-col items-center justify-center md:flex-row">
            <div className="mx-8 grid grid-cols-1 gap-8 w-full">
              <div>
                <label className="mb-2 font-medium">
                  Category of Service
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-4 w-64">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectGroup>
                      {categoryOfService.map(({ label, value }) => {
                        return (
                          <SelectItem className="" key={value} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 font-medium">Markets Covered</label>
                <Select value={markets} onValueChange={setMarkets}>
                  <SelectTrigger className="mt-4 w-64">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectGroup>
                      {marketsCovered.map(({ label, value }) => {
                        return (
                          <SelectItem className="" key={value} value={value}>
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
              className="h-full bg-cpg-brown hover:bg-cpg-brown/90 sm:w-28"
            >
              Search
            </Button>
          </form>

          {/* Service Listing */}
          {loadingServices === false && (
            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services?.length ? (
                services.map((service) => {
                  return (
                    <JobCard
                      key={service.id}
                      job={service}
                      isSaved={service?.saved?.length > 0}
                    />
                  );
                })
              ) : (
                <div>No Services Found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceProviderListing;

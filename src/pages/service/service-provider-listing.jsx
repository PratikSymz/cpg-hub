import React, { useEffect, useMemo, useState } from "react";
import useFetch from "@/hooks/use-fetch.jsx";
import { categoryOfService, marketsCovered } from "@/constants/filters.js";
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
import ServiceProviderCard from "@/components/service-provider-card.jsx";
import BackButton from "@/components/back-button.jsx";

function ServiceProviderListing() {
  const { isLoaded } = useUser();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [markets, setMarkets] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(true);

  const {
    func: funcServices,
    data: serviceList,
    loading: loadingServices,
  } = useFetch(getServices);

  useEffect(() => {
    if (isLoaded) funcServices({});
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
    setCategory("");
    setMarkets("");
  };

  const filteredServices = useMemo(() => {
    if (!serviceList) return [];
    return serviceList.filter((service) => {
      if (category && Array.isArray(service.category_of_service)) {
        if (!service.category_of_service.includes(category)) return false;
      }
      if (markets && Array.isArray(service.markets_covered)) {
        if (!service.markets_covered.includes(markets)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = service?.company_name?.toLowerCase() ?? "";
        const desc = service?.customers_covered?.toLowerCase() ?? "";
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [serviceList, category, markets, searchQuery]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"90%"} color="#00A19A" />;
  }

  return (
    <div className="px-4 sm:px-6 py-10">
      <BackButton />
      <h1 className="text-3xl font-bold mb-8 text-center">
        Browse Service Providers
      </h1>

      {loadingServices && (
        <BarLoader className="mt-4" width="100%" color="#36d7b7" />
      )}

      {/* Search bar always on top */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="h-14 flex flex-row w-full gap-2 items-center mb-4"
      >
        <Input
          type="text"
          placeholder="Search Services"
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
                  Category of Service
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categoryOfService.map(({ label, value }) => (
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
                  Markets Covered
                </label>
                <Select value={markets} onValueChange={setMarkets}>
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {marketsCovered.map(({ label, value }) => (
                        <SelectItem key={value} value={label}>
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

        {/* Grid Listing */}
        <div className="flex-auto sm:mx-8 mt-6 sm:mt-0">
          <div className="grid grid-cols-1 gap-6 mt-4">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <ServiceProviderCard key={service.id} service={service} />
              ))
            ) : (
              <div>No Services Found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceProviderListing;

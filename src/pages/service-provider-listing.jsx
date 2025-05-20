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

function ServiceProviderListing() {
  // Once user is loaded, fetch job data -> session()
  const { isLoaded } = useUser();

  // Service Filters
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [markets, setMarkets] = useState("");

  const {
    func: funcServices,
    data: serviceList,
    loading: loadingServices,
  } = useFetch(getServices);

  useEffect(() => {
    if (isLoaded) funcServices({});
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
        const companyName = service?.company_name?.toLowerCase() ?? "";
        const customersCovered =
          service?.customers_covered?.toLowerCase() ?? "";
        if (!companyName.includes(q) && !customersCovered.includes(q))
          return false;
      }
      return true;
    });
  }, [serviceList, category, markets, searchQuery]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"90%"} color="#00A19A" />;
  }

  return (
    <div className="px-6 py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Browse Service Providers
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
                <label className="mb-2 font-medium">Category of Service</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-4 w-64">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectGroup>
                      {categoryOfService.map(({ label, value }) => {
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
                <label className="mb-2 font-medium">Markets Covered</label>
                <Select value={markets} onValueChange={setMarkets}>
                  <SelectTrigger className="mt-4 w-64">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectGroup>
                      {marketsCovered.map(({ label, value }) => {
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
              placeholder="Search Services"
              name="search-query"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-full flex-1 placeholder:text-black/60 placeholder:font-medium text-black/90 px-4 text-md"
            />
          </form>

          {/* Service Listing */}
          {loadingServices === false && (
            <div className="grid grid-rows sm:grid-rows lg:grid-rows gap-6 mt-8">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => {
                  return (
                    <ServiceProviderCard key={service.id} service={service} />
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

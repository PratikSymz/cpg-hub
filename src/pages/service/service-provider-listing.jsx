import React, { useEffect, useMemo, useState } from "react";
import useFetch from "@/hooks/use-fetch.jsx";
import { categoryOfService, marketsCovered } from "@/constants/filters.js";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { getServices } from "@/api/apiServices.js";
import ServiceProviderCard from "@/components/service-provider-card.jsx";
import BackButton from "@/components/back-button.jsx";
import { Search, SlidersHorizontal, X, Briefcase } from "lucide-react";
import clsx from "clsx";

function ServiceProviderListing() {
  const { isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedMarkets, setSelectedMarkets] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const {
    func: funcServices,
    data: serviceList,
    loading,
    error,
  } = useFetch(getServices);

  useEffect(() => {
    if (isLoaded) funcServices({});
  }, [isLoaded]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedMarkets([]);
  };

  const hasActiveFilters =
    searchQuery || selectedCategories.length > 0 || selectedMarkets.length > 0;

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleMarket = (market) => {
    setSelectedMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market]
    );
  };

  const filteredServices = useMemo(() => {
    if (!serviceList) return [];
    return serviceList.filter((service) => {
      // Filter by category (any match)
      if (
        selectedCategories.length > 0 &&
        Array.isArray(service.category_of_service)
      ) {
        const hasMatch = selectedCategories.some((cat) =>
          service.category_of_service.includes(cat)
        );
        if (!hasMatch) return false;
      }

      // Filter by markets (any match)
      if (
        selectedMarkets.length > 0 &&
        Array.isArray(service.markets_covered)
      ) {
        const hasMatch = selectedMarkets.some((market) =>
          service.markets_covered.includes(market)
        );
        if (!hasMatch) return false;
      }

      // Filter by search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = service?.company_name?.toLowerCase() ?? "";
        const desc = service?.customers_covered?.toLowerCase() ?? "";
        const spec = service?.area_of_specialization?.toLowerCase() ?? "";
        if (!name.includes(q) && !desc.includes(q) && !spec.includes(q))
          return false;
      }

      return true;
    });
  }, [serviceList, selectedCategories, selectedMarkets, searchQuery]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#00A19A" />;
  }

  return (
    <div className="py-10">
      {/* Header */}
      <div className="w-5/6 mx-auto mb-8">
        <BackButton />
        <h1 className="gradient-title font-extrabold text-4xl sm:text-5xl lg:text-6xl text-center mt-6">
          Find Service Providers
        </h1>
        <p className="text-center text-muted-foreground mt-4 text-lg">
          Connect with expert CPG service providers and brokers
        </p>
      </div>

      {loading && <BarLoader className="mb-4" width="100%" color="#00A19A" />}
      {error && (
        <p className="text-red-500 text-center">Error loading services</p>
      )}

      <div className="w-5/6 mx-auto">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by company name or description..."
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
                {selectedCategories.length + selectedMarkets.length}
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
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
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

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">
                  Category of Service
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {categoryOfService.map(({ label }) => (
                    <button
                      key={label}
                      onClick={() => toggleCategory(label)}
                      className={clsx(
                        "px-2.5 py-1 text-xs rounded-full border transition-all",
                        selectedCategories.includes(label)
                          ? "bg-cpg-teal text-white border-cpg-teal"
                          : "bg-white text-gray-700 border-gray-200 hover:border-cpg-teal hover:bg-cpg-teal/5"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Markets Filter */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700">
                  Markets Covered
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {marketsCovered.map(({ label }) => (
                    <button
                      key={label}
                      onClick={() => toggleMarket(label)}
                      className={clsx(
                        "px-2.5 py-1 text-xs rounded-full border transition-all",
                        selectedMarkets.includes(label)
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

          {/* Services List */}
          <div className="flex-1">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {loading ? (
                  "Loading..."
                ) : (
                  <>
                    <span className="font-semibold text-gray-900">
                      {filteredServices.length}
                    </span>{" "}
                    {filteredServices.length === 1 ? "service" : "services"} found
                  </>
                )}
              </p>
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-2 bg-cpg-teal/10 text-cpg-teal text-sm font-medium px-4 py-2 rounded-full cursor-pointer hover:bg-cpg-teal/20 transition-colors"
                    >
                      {cat}
                      <button
                        onClick={() => toggleCategory(cat)}
                        className="hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                  {selectedMarkets.map((market) => (
                    <span
                      key={market}
                      className="inline-flex items-center gap-2 bg-cpg-teal/10 text-cpg-teal text-sm font-medium px-4 py-2 rounded-full cursor-pointer hover:bg-cpg-teal/20 transition-colors"
                    >
                      {market}
                      <button
                        onClick={() => toggleMarket(market)}
                        className="hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Service Cards - Grid Layout */}
            {!loading && (
              <>
                {filteredServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredServices.map((service) => (
                      <ServiceProviderCard key={service.id} service={service} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-gray-100 rounded-full p-6 mb-6">
                      <Briefcase className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No services found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      {hasActiveFilters
                        ? "Try adjusting your filters or search query to find more providers."
                        : "There are no service providers available at the moment. Check back soon!"}
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
}

export default ServiceProviderListing;

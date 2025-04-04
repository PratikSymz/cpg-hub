import React from "react";
import { areasOfSpecialization, levelsOfExperience } from "@/constants/filters";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./ui/button";

const FilterColumns = (
  specializationValue,
  onSpecializationChange,
  experienceValue,
  onExperienceChange,
  onClearFilters
) => {
  return (
    <div className="flex flex-col items-center justify-center md:flex-row">
      <div className="mx-8 grid grid-cols-1 gap-8 w-full">
        <div>
          <label className="mb-2 font-medium">Area of Specialization</label>
          <Select value={specializationValue} onValueChange={onSpecializationChange}>
            <SelectTrigger className="mt-4 w-64">
              <SelectValue placeholder="lol" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {areasOfSpecialization.map(({ label, value }) => {
                  return (
                    <SelectItem key={value} value={value}>
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
          <Select value={experienceValue} onValueChange={onExperienceChange}>
            <SelectTrigger className="mt-4 w-64">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {levelsOfExperience.map(({ label, value }) => {
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex">
          <Button className="w-full" variant="default" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterColumns;

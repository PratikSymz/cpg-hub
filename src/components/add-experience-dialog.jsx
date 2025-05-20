// edit-fractional-talent.jsx (updated for brand experience with useFetch)
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import {
  getAllExperiences,
  addNewExperience,
  updateExperience,
  deleteExperience,
} from "@/api/apiExperience.js";
import { useUser } from "@clerk/clerk-react";

const AddExperienceDialog = () => {
  // Inside the main component
  const [experiences, setExperiences] = useState([]);
  const [deletedExperienceIds, setDeletedExperienceIds] = useState([]);

  const { user, isSignedIn, isLoaded } = useUser();
  const {
    data: experienceData,
    loading: loadingExperience,
    func: fetchExperience,
  } = useFetch(getAllExperiences);

  const { func: addExp, loading: addingExp } = useFetch(addNewExperience);

  const { func: updateExp, loading: updatingExp } = useFetch(updateExperience);

  const { func: removeExp, loading: removingExp } = useFetch(deleteExperience);

  useEffect(() => {
    if (user?.id) {
      fetchExperience({ user_id: user.id });
    }
  }, [user]);

  useEffect(() => {
    if (experienceData) {
      setExperiences(experienceData);
    }
  }, [experienceData]);

  const updateExperienceState = (id, updated) => {
    setExperiences((prev) => prev.map((e) => (e.id === id ? updated : e)));
  };

  const removeExperienceState = (id) => {
    setExperiences((prev) => prev.filter((e) => e.id !== id));
    setDeletedExperienceIds((prev) => [...prev, id]);
  };

  const addExperienceState = () => {
    setExperiences((prev) => [
      ...prev,
      {
        brand_name: "",
        brand_website: "",
        brand_logo: null,
        isNew: true,
      },
    ]);
  };

  const handleExperienceSubmit = async () => {
    await Promise.all([
      ...experiences.map((exp) => {
        if (exp.isNew) {
          return addExperience(exp, { user_id: user.id });
        }
        return updateExperience(exp, {
          user_id: user.id,
          experience_id: exp.id,
        });
      }),
      ...deletedExperienceIds.map((id) =>
        removeExperience({ experience_id: id })
      ),
    ]);
  };

  // Render in JSX:
  return (
    <div>
      <h2 className="text-xl font-semibold mt-6">Brand Experience</h2>;
      experiences.map((exp) => (
      <div key={exp.id} className="border p-4 rounded mb-4 space-y-2">
        <Input
          value={exp.brand_name}
          onChange={(e) =>
            updateExperienceState(exp.id, {
              ...exp,
              brand_name: e.target.value,
            })
          }
          placeholder="Brand Name"
        />
        <Input
          value={exp.brand_website}
          onChange={(e) =>
            updateExperienceState(exp.id, {
              ...exp,
              brand_website: e.target.value,
            })
          }
          placeholder="Website"
        />
        {exp.brand_logo && typeof exp.brand_logo === "string" && (
          <img
            src={exp.brand_logo}
            className="w-16 h-16 object-contain border rounded"
            alt="Current Logo"
          />
        )}
        <Input
          type="file"
          accept="image/*"
          onChange={(e) =>
            updateExperienceState(exp.id, {
              ...exp,
              brand_logo: e.target.files[0],
            })
          }
        />
        <Button
          variant="ghost"
          className="text-red-600"
          onClick={() => removeExperienceState(exp.id)}
        >
          Remove
        </Button>
      </div>
      ));
      <Button type="button" variant="outline" onClick={addExperienceState}>
        Add Experience
      </Button>
      ;
    </div>
  );
};

export default AddExperienceDialog;

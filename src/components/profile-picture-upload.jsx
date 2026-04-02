import React, { useRef, useState, useEffect } from "react";
import { Camera } from "lucide-react";

const ProfilePictureUpload = ({
  currentImageUrl,
  fallbackInitial,
  onFileSelect,
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
    onFileSelect(file);
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={() => !disabled && fileInputRef.current?.click()}
        className="relative group"
        disabled={disabled}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Profile"
            className="h-16 w-16 rounded-full border-2 border-gray-100 object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-cpg-teal/10 flex items-center justify-center">
            <span className="text-cpg-teal font-semibold text-xl">
              {fallbackInitial || "?"}
            </span>
          </div>
        )}
        {!disabled && (
          <>
            <div className="absolute inset-0 h-16 w-16 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 bg-cpg-teal rounded-full p-1 shadow-sm">
              <Camera className="h-3 w-3 text-white" />
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />
      </button>
    </div>
  );
};

export default ProfilePictureUpload;

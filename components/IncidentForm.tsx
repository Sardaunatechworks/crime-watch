import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import { CATEGORIES, COMMON_LOCATIONS, Icons } from "../constants";
import { IncidentImage } from "../types";

interface IncidentFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImages, setSelectedImages] = useState<
    Array<{ file: File; preview: string; id: string }>
  >([]);

  const [formData, setFormData] = useState({
    title: "",
    category: CATEGORIES[0],
    location: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Submit to your main database first (with images)
      await onSubmit({ ...formData, images: selectedImages });

      // 2. Trigger the EmailJS notification
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          title: formData.title,
          category: formData.category,
          location: formData.location,
          description: formData.description,
          image_count: selectedImages.length,
          reported_at: new Date().toLocaleString(),
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );

      alert(
        "Incident successfully reported with evidence and email notification sent.",
      );

      // Reset form
      setSelectedImages([]);
      setFormData({
        title: "",
        category: CATEGORIES[0],
        location: "",
        description: "",
      });
    } catch (error) {
      console.error("Transmission error:", error);
      alert("There was an issue transmitting the report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSuggestion = (loc: string) => {
    setFormData({ ...formData, location: loc });
  };

  // Image upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: FileList) => {
    const MAX_IMAGES = 10;
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(
          `${file.name} is not a supported image format. Please use JPEG, PNG, GIF, or WebP.`,
        );
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 10MB.`);
        return;
      }

      // Check max images limit
      if (selectedImages.length >= MAX_IMAGES) {
        alert(`Maximum ${MAX_IMAGES} images allowed per incident.`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setSelectedImages((prev) => [
          ...prev,
          {
            file,
            preview,
            id: `${Date.now()}-${Math.random()}`,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl md:shadow-2xl md:shadow-indigo-100/50 border border-slate-100 overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 p-6 md:p-10 border-b border-slate-100">
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Report Incident
          </h2>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-2">
            Please provide accurate details for investigation.
          </p>
        </div>
        <div className="p-2.5 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex-shrink-0">
          <Icons.Shield />
        </div>
      </div>

      <div className="p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="space-y-2">
            <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Case Title
            </label>
            <input
              required
              type="text"
              className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm md:text-base text-slate-800"
              placeholder="e.g. Unusual Activity Near Storefront"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-2">
              <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Crime Category
              </label>
              <div className="relative">
                <select
                  title="Crime Category"
                  className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm md:text-base text-slate-800 appearance-none"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Location Details
              </label>
              <div className="relative">
                <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-indigo-500 scale-75 md:scale-100">
                  <Icons.MapPin />
                </div>
                <input
                  required
                  type="text"
                  className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm md:text-base text-slate-800"
                  placeholder="Where did it happen?"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              {/* Auto-Suggestions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase self-center">
                  Suggested:
                </span>
                {COMMON_LOCATIONS.slice(0, 3).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleLocationSuggestion(loc)}
                    className="px-2.5 md:px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-full text-[8px] md:text-[10px] font-bold text-slate-500 border border-slate-200 transition-all active:scale-95"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Full Narrative
              </label>
              <span className="text-[8px] md:text-[9px] font-bold text-slate-300 uppercase">
                {formData.description.length} / 1000
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={1000}
              className="w-full px-4 md:px-6 py-3 md:py-5 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-sm md:text-base text-slate-600 leading-relaxed resize-none"
              placeholder="Describe the incident in as much detail as possible..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Evidence Images (Optional)
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative w-full px-4 md:px-6 py-6 md:py-8 rounded-xl md:rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                title="Upload evidence images"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={selectedImages.length >= 10}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700 text-xs md:text-sm">
                    Drop images or click to upload
                  </p>
                  <p className="text-[10px] md:text-[11px] text-slate-500 mt-1">
                    JPG • PNG • GIF • WebP | Max 10MB | Up to 10 images
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview Grid */}
            {selectedImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] md:text-[10px] font-bold text-slate-600">
                  {selectedImages.length} image
                  {selectedImages.length !== 1 ? "s" : ""} selected
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt="preview"
                        className="w-full h-20 md:h-24 object-cover rounded-lg border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        title="Remove image"
                        className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <svg
                          width="12"
                          height="12"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                        </svg>
                      </button>
                      <p className="text-[8px] md:text-[9px] text-slate-500 mt-1 truncate">
                        {img.file.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 md:pt-6 flex flex-col sm:flex-row gap-3 md:gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-grow bg-slate-900 hover:bg-black active:scale-95 text-white font-black py-4 md:py-5 px-4 md:px-6 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl md:shadow-slate-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 md:gap-3 uppercase text-[10px] md:text-xs tracking-[0.2em]"
            >
              {loading ? (
                <span className="animate-spin h-4 md:h-5 w-4 md:w-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <Icons.Plus />
                  <span>Transmit Report</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 md:px-10 py-4 md:py-5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-500 font-black rounded-xl md:rounded-2xl transition-all border border-slate-200 uppercase text-[10px] md:text-xs tracking-[0.2em]"
            >
              Dismiss
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentForm;

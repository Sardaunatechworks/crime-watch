import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import { CATEGORIES, COMMON_LOCATIONS, Icons } from "../constants";

interface IncidentFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
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
      // 1. Submit to your main database first
      await onSubmit(formData);

      // 2. Trigger the EmailJS notification
      // These variables are pulled from your .env.local file
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          title: formData.title,
          category: formData.category,
          location: formData.location,
          description: formData.description,
          reported_at: new Date().toLocaleString(),
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );

      alert("Incident successfully reported and email notification sent.");
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

  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Report Incident
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Please provide accurate details for investigation.
          </p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Icons.Shield />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
            Case Title
          </label>
          <input
            required
            type="text"
            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
            placeholder="e.g. Unusual Activity Near Storefront"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Crime Category
            </label>
            <div className="relative">
              <select
                title="Crime Category"
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 appearance-none"
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
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Location Details
            </label>
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 scale-75">
                <Icons.MapPin />
              </div>
              <input
                required
                type="text"
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
                placeholder="Where did it happen?"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            {/* Auto-Suggestions */}
            <div className="flex flex-wrap gap-2 mt-3 ml-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase self-center mr-1">
                Suggested:
              </span>
              {COMMON_LOCATIONS.slice(0, 4).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleLocationSuggestion(loc)}
                  className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 transition-all active:scale-95"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Full Narrative
            </label>
            <span className="text-[9px] font-bold text-slate-300 uppercase">
              {formData.description.length} / 1000
            </span>
          </div>
          <textarea
            required
            rows={5}
            maxLength={1000}
            className="w-full px-6 py-5 rounded-3xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-600 leading-relaxed resize-none"
            placeholder="Describe the incident in as much detail as possible..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="pt-6 flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-grow bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-100 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <Icons.Plus />
                Transmit Report
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-10 py-5 bg-white hover:bg-slate-50 text-slate-500 font-black rounded-2xl transition-all border border-slate-200 uppercase text-xs tracking-[0.2em]"
          >
            Dismiss
          </button>
        </div>
      </form>
    </div>
  );
};

export default IncidentForm;

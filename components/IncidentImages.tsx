import React, { useState, useEffect } from "react";
import { imageService } from "../services/imageService";
import { supabase } from "../services/supabase";
import { IncidentImage } from "../types";
import { Icons } from "../constants";

interface IncidentImagesProps {
  incidentId: string;
  isAdmin?: boolean;
}

const IncidentImages: React.FC<IncidentImagesProps> = ({
  incidentId,
  isAdmin = false,
}) => {
  const [images, setImages] = useState<IncidentImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<IncidentImage | null>(
    null,
  );

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      try {
        const fetchedImages = await imageService.getIncidentImages(incidentId);
        setImages(fetchedImages);
      } catch (error) {
        console.error("Error loading incident images:", error);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [incidentId]);

  // Get full public URL for an image
  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("incident-images")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin h-8 w-8 border-[3px] border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="flex justify-center text-slate-200 mb-3">
          <Icons.Camera />
        </div>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
          No evidence attached
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Image Gallery */}
      <div className="space-y-3 md:space-y-4">
        <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Evidence ({images.length})
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="relative group rounded-lg md:rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-500 transition-all"
            >
              <img
                src={getImageUrl(image.file_path)}
                alt={image.file_name}
                className="w-full h-24 md:h-32 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Icons.Eye className="text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl animate-in scale-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-lg text-slate-900 transition-all shadow-lg"
              title="Close image"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={getImageUrl(selectedImage.file_path)}
              alt={selectedImage.file_name}
              className="w-full h-full object-contain"
            />

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
              <p className="text-white font-bold text-sm md:text-base truncate">
                {selectedImage.file_name}
              </p>
              <p className="text-slate-300 text-[8px] md:text-[9px] uppercase tracking-wider mt-1">
                {(selectedImage.file_size / 1024 / 1024).toFixed(2)} MB •{" "}
                {selectedImage.mime_type}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IncidentImages;

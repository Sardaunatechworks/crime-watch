import { IncidentImage } from '../types';
import { supabase } from './supabase';

const BUCKET_NAME = 'incident-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const imageService = {
  /**
   * Upload image to Supabase Storage
   */
  uploadImage: async (
    incidentId: string,
    file: File,
    userId: string
  ): Promise<{ path: string; url: string }> => {
    // Validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 10MB');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    // Use simpler path format: incident-id/filename (avoiding nested paths)
    const filePath = `${incidentId}/${fileName}`;

    try {
      // Upload to storage
      const { error: uploadError, data } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        path: filePath,
        url: publicUrlData.publicUrl,
      };
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  },

  /**
   * Save image metadata to database
   */
  saveImageMetadata: async (
    incidentId: string,
    filePath: string,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): Promise<IncidentImage> => {
    try {
      const { data, error } = await supabase
        .from('incident_images')
        .insert([
          {
            incident_id: incidentId,
            file_path: filePath,
            file_name: fileName,
            file_size: fileSize,
            mime_type: mimeType,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Database error saving image metadata:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          incidentId,
          filePath
        });
        throw error;
      }

      return data as IncidentImage;
    } catch (error) {
      console.error('Error saving image metadata:', error);
      throw new Error('Failed to save image metadata. RLS policies may need to be updated.');
    }
  },

  /**
   * Upload image and save metadata in one operation
   */
  uploadAndSaveImage: async (
    incidentId: string,
    file: File,
    userId: string
  ): Promise<IncidentImage> => {
    try {
      // Step 1: Upload file
      const { path, url } = await imageService.uploadImage(incidentId, file, userId);

      // Step 2: Save metadata
      const imageRecord = await imageService.saveImageMetadata(
        incidentId,
        path,
        file.name,
        file.size,
        file.type
      );

      return imageRecord;
    } catch (error) {
      console.error('Error in uploadAndSaveImage:', error);
      throw error;
    }
  },

  /**
   * Get all images for an incident
   */
  getIncidentImages: async (incidentId: string): Promise<IncidentImage[]> => {
    try {
      const { data, error } = await supabase
        .from('incident_images')
        .select('*')
        .eq('incident_id', incidentId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as IncidentImage[];
    } catch (error) {
      console.error('Error fetching incident images:', error);
      return [];
    }
  },

  /**
   * Delete an image
   */
  deleteImage: async (imagePath: string, imageId: string): Promise<void> => {
    try {
      // Delete from storage
      const { error: deleteStorageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([imagePath]);

      if (deleteStorageError) {
        throw deleteStorageError;
      }

      // Delete metadata from database
      const { error: deleteDbError } = await supabase
        .from('incident_images')
        .delete()
        .eq('id', imageId);

      if (deleteDbError) {
        throw deleteDbError;
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  },

  /**
   * Get public URL for an image
   */
  getImageUrl: (filePath: string): string => {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};

# Crime-Watch Image Upload Feature - Setup Guide

## Overview

This guide walks you through setting up the real-time crime image upload feature for the Crime-Watch application.

## Implementation Summary

### 1. Database Schema Updates

- **New Table**: `incident_images` - stores metadata for uploaded images
  - `id`: UUID primary key
  - `incident_id`: Foreign key to incidents
  - `file_path`: Path in Supabase Storage
  - `file_name`: Original filename
  - `file_size`: Size in bytes
  - `mime_type`: Image MIME type
  - `uploaded_at`: Timestamp

- **RLS Policies**: Configured for secure image access
  - Users can only view/upload images for their own incidents
  - Admins can view all incident images

### 2. New Files Created

- **`services/imageService.ts`**: Handles all image operations
  - Upload to Supabase Storage
  - Save metadata to database
  - Retrieve and delete images
  - Validation (file type, size limits)

### 3. Updated Components

#### IncidentForm.tsx

Added image upload UI with:

- **Drag-and-drop zone**: Users can drag images directly
- **File picker**: Click to browse files
- **Image previews**: Visual feedback before submission
- **Validation**:
  - Supported formats: JPEG, PNG, GIF, WebP
  - Max 10MB per file
  - Max 10 images per incident
- **Remove functionality**: Delete unwanted images before submission

#### Updated Services

- **db.ts**: `addIncident()` now handles image uploads alongside incident creation
- **types.ts**: New `IncidentImage` interface for type safety

## Setup Instructions

### Step 1: Update Supabase Storage

1. Go to your Supabase Project Dashboard
2. Navigate to **Storage** (in the left sidebar)
3. Create a new bucket:
   - **Bucket Name**: `incident-images`
   - **Public Bucket**: Enable (or configure RLS policies)
   - **File Size Limit**: Set to at least 10MB

### Step 2: Run Database Migration

Execute the updated `schema.sql` in your Supabase SQL Editor:

```sql
-- This creates the incident_images table and RLS policies
-- Copy the entire schema.sql content and run it in Supabase
```

Or use the SQL Editor in Supabase:

1. Go to **SQL Editor**
2. Click **New Query**
3. Paste the updated schema.sql content
4. Click **Run**

### Step 3: Verify RLS Policies

Check that these policies are created on the `incident_images` table:

1. `Users can view images of their incidents`
2. `Users can upload images to their incidents`
3. `Admins can view all incident images`

If not present, create them manually in the RLS section.

### Step 4: Test the Feature

1. **Start the development server**:

   ```bash
   npm run dev
   ```

2. **Create a new incident**:
   - Fill in all required fields
   - Drag and drop images OR click to upload
   - Upload up to 10 images (JPEG, PNG, GIF, WebP)
   - Submit the form

3. **Verify uploads**:
   - Check Supabase Storage for uploaded files in `incident-images` bucket
   - Check database for entries in `incident_images` table

### Step 5: Update Environment Variables (if needed)

Ensure your `.env.local` has:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

## Features

### For Reporters

- ✅ Upload evidence images with incident reports
- ✅ Drag-and-drop support
- ✅ Image preview before submission
- ✅ Remove unwanted images
- ✅ Real-time feedback with validation

### For Administrators

- ✅ View all images attached to incidents
- ✅ Track image upload times
- ✅ Access metadata (filename, size, type)
- ✅ Implement image deletion workflows

## API Reference

### Image Service Methods

```typescript
// Upload and save image in one operation
await imageService.uploadAndSaveImage(incidentId, file, userId);

// Upload file only
await imageService.uploadImage(incidentId, file, userId);

// Save metadata only
await imageService.saveImageMetadata(
  incidentId,
  filePath,
  fileName,
  fileSize,
  mimeType,
);

// Get all images for incident
await imageService.getIncidentImages(incidentId);

// Delete image and metadata
await imageService.deleteImage(filePath, imageId);

// Get public URL
imageService.getImageUrl(filePath);
```

## Validation Rules

| Rule                    | Limit                |
| ----------------------- | -------------------- |
| Supported Formats       | JPEG, PNG, GIF, WebP |
| Max File Size           | 10MB per file        |
| Max Images per Incident | 10 images            |
| Storage Quota           | As per Supabase plan |

## Error Handling

The feature includes comprehensive error handling:

- **Invalid file type**: User-friendly alert
- **File too large**: Clear message about size limit
- **Upload failed**: Retry suggestion
- **Storage full**: Graceful degradation

## Security Considerations

1. **Row Level Security (RLS)**:
   - Users can only access their own images
   - Admins can access all images

2. **File Validation**:
   - MIME type checking
   - File size limits
   - Filename sanitization

3. **Storage Security**:
   - Images stored in user-organized buckets
   - Encrypted in transit and at rest

## Troubleshooting

### Images not uploading

- Check Supabase Storage bucket exists
- Verify RLS policies are enabled
- Check browser console for errors
- Ensure file size < 10MB

### Images not saving to database

- Verify `incident_images` table exists
- Check RLS policies on table
- Ensure incident_id is valid
- Check database connection

### Images not visible after upload

- Verify bucket is public or RLS allows access
- Check file_path in database
- Ensure authenticated user is correct

## Future Enhancements

- [ ] Image compression before upload
- [ ] Thumbnail generation
- [ ] Lightbox/gallery view for admins
- [ ] Image annotations/markup tools
- [ ] Batch download functionality
- [ ] Image metadata extraction (EXIF)
- [ ] Virus scanning integration

## Support

For issues or questions:

1. Check Supabase logs for storage errors
2. Review browser console for client-side errors
3. Verify RLS policies in Supabase dashboard
4. Check database for metadata records

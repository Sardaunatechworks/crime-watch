import { User, UserRole, Incident, IncidentStatus } from '../types';
import { supabase } from './supabase';
import { imageService } from './imageService';

// Note: emailService import removed to fix the "requested module does not provide an export" error.

export const dbService = {
  // Get all incidents (for admin)
  getIncidents: async (): Promise<Incident[]> => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incidents:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        return [];
      }

      return (data || []).map(incident => ({
        ...incident,
        status_history: incident.status_history || []
      }));
    } catch (err) {
      console.error('Unexpected error fetching incidents:', err);
      return [];
    }
  },

  // Get user's incidents
  getUserIncidents: async (userId: string): Promise<Incident[]> => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user incidents:', {
          message: error.message,
          code: error.code,
          details: error.details,
          userId
        });
        return [];
      }

      return (data || []).map(incident => ({
        ...incident,
        status_history: incident.status_history || []
      }));
    } catch (err) {
      console.error('Unexpected error fetching user incidents:', err);
      return [];
    }
  },

  // Create new incident
  addIncident: async (
    incidentData: Omit<Incident, 'id' | 'status' | 'created_at' | 'last_updated_at' | 'status_history'> & { images?: Array<{ file: File; preview: string; id: string }> }
  ): Promise<Incident> => {
    const now = new Date().toISOString();
    const initialStatus = IncidentStatus.PENDING;

    // Separate images from incident data
    const { images, ...incident } = incidentData;

    const incidentToInsert = {
      ...incident,
      status: initialStatus,
      created_at: now,
      last_updated_at: now,
      status_history: [
        { status: initialStatus, changed_at: now, note: 'Incident reported by user.' }
      ]
    };

    const { data, error } = await supabase
      .from('incidents')
      .insert([incidentToInsert])
      .select()
      .single();

    if (error) {
      console.error('Error adding incident:', error);
      throw error;
    }

    // Upload images if provided
    if (images && images.length > 0 && data.reporter_id) {
      try {
        for (const image of images) {
          await imageService.uploadAndSaveImage(data.id, image.file, data.reporter_id);
        }
      } catch (imageError) {
        console.error('Error uploading images:', imageError);
        // Don't fail the entire incident creation if images fail
        // The incident is already created; images are secondary
      }
    }

    // Email notification logic has been moved to the UI component (IncidentForm.tsx) 
    // to support browser-compatible EmailJS.

    return data;
  },

  // Update incident status
  updateIncidentStatus: async (id: string, status: IncidentStatus): Promise<void> => {
    const now = new Date().toISOString();

    // Get current incident
    const { data: currentIncident, error: fetchError } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching incident:', fetchError);
      return;
    }

    // Only update if status changed
    if (currentIncident.status !== status) {
      const updatedHistory = [
        ...(currentIncident.status_history || []),
        {
          status,
          changed_at: now,
          note: `Status updated to ${status.replace('_', ' ')} by administration.`
        }
      ];

      const { error: updateError } = await supabase
        .from('incidents')
        .update({
          status,
          last_updated_at: now,
          status_history: updatedHistory
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating incident status:', updateError);
      }
      // Note: Admin status update emails should be triggered from the Admin Dashboard 
      // using the same EmailJS logic if required.
    }
  },

  // Delete incident
  deleteIncident: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting incident:', error);
      throw error;
    }
  },

  // Real-time subscription to incidents
  subscribeToIncidents: (callback: (incidents: Incident[]) => void) => {
    const channel = supabase
      .channel('incidents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        () => {
          dbService.getIncidents().then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Real-time subscription to user's incidents
  subscribeToUserIncidents: (userId: string, callback: (incidents: Incident[]) => void) => {
    const channel = supabase
      .channel(`incidents:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        () => {
          dbService.getUserIncidents(userId).then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export const authService = {
  login: async (email: string): Promise<User> => {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', existingUser.id);

      localStorage.setItem('auth_user', JSON.stringify(existingUser));
      return existingUser;
    }

    const isAdmin = email.toLowerCase() === 'admin@mail.com';
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      role: isAdmin ? UserRole.ADMIN : UserRole.REPORTER
    };

    const { data: createdUser, error } = await supabase
      .from('users')
      .insert([{ ...newUser, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    localStorage.setItem('auth_user', JSON.stringify(createdUser));
    return createdUser;
  },

  logout: () => {
    localStorage.removeItem('auth_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  }
};
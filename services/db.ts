
import { User, UserRole, Incident, IncidentStatus, StatusUpdate } from '../types';
import { supabase } from './supabase';

export const dbService = {
  // Get all incidents (for admin)
  getIncidents: async (): Promise<Incident[]> => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching incidents:', error);
      return [];
    }

    return (data || []).map(incident => ({
      ...incident,
      status_history: incident.status_history || []
    }));
  },

  // Get user's incidents
  getUserIncidents: async (userId: string): Promise<Incident[]> => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user incidents:', error);
      return [];
    }

    return (data || []).map(incident => ({
      ...incident,
      status_history: incident.status_history || []
    }));
  },

  // Create new incident
  addIncident: async (
    incidentData: Omit<Incident, 'id' | 'status' | 'created_at' | 'last_updated_at' | 'status_history'>
  ): Promise<Incident> => {
    const now = new Date().toISOString();
    const initialStatus = IncidentStatus.PENDING;

    const incidentToInsert = {
      ...incidentData,
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

    return data;
  },

  // Update incident status
  updateIncidentStatus: async (id: string, status: IncidentStatus): Promise<void> => {
    const now = new Date().toISOString();

    // Get current incident
    const { data: currentIncident, error: fetchError } = await supabase
      .from('incidents')
      .select('status, status_history')
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
        (payload) => {
          // When any change occurs, fetch fresh data
          dbService.getIncidents().then(callback);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to incidents');
        }
      });

    // Return unsubscribe function
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
        (payload) => {
          // When any change occurs, fetch fresh data for this user
          dbService.getUserIncidents(userId).then(callback);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to user incidents');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export const authService = {
  login: async (email: string): Promise<User> => {
    // Check if user exists in database
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', existingUser.id);

      // Save to localStorage for session
      localStorage.setItem('auth_user', JSON.stringify(existingUser));
      return existingUser;
    }

    // Create new user
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

    // Save to localStorage for session
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

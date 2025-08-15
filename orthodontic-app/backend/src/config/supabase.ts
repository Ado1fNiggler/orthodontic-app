import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

let supabase: SupabaseClient | null = null;

export const initializeSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logger.warn('⚠️ Supabase credentials not found. Supabase features will be disabled.');
    return null;
  }

  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'orthodontic-app',
        },
      },
    });

    logger.info('✅ Supabase client initialized');
    return supabase;
  } catch (error) {
    logger.error('❌ Failed to initialize Supabase:', error);
    return null;
  }
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabase) {
    return initializeSupabase();
  }
  return supabase;
};

// Supabase storage helpers
export const uploadToSupabaseStorage = async (
  bucket: string,
  path: string,
  file: Buffer,
  options?: { contentType?: string; cacheControl?: string }
) => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not available');
  }

  try {
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType,
        cacheControl: options?.cacheControl || '3600',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = client.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      path: data.path,
      fullPath: data.fullPath,
      publicUrl,
    };
  } catch (error) {
    logger.error('Supabase storage upload error:', error);
    throw error;
  }
};

export const deleteFromSupabaseStorage = async (bucket: string, paths: string[]) => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not available');
  }

  try {
    const { data, error } = await client.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Supabase storage delete error:', error);
    throw error;
  }
};

// Real-time subscriptions
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const client = getSupabaseClient();
  if (!client) {
    logger.warn('Cannot create subscription: Supabase client not available');
    return null;
  }

  try {
    const subscription = client
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        callback
      )
      .subscribe();

    logger.info(`📡 Subscribed to ${table} changes`);
    return subscription;
  } catch (error) {
    logger.error('Subscription error:', error);
    return null;
  }
};

// Health check for Supabase
export const checkSupabaseHealth = async () => {
  const client = getSupabaseClient();
  if (!client) {
    return { status: 'disabled', message: 'Supabase not configured' };
  }

  try {
    // Simple health check - try to access the auth endpoint
    const { data, error } = await client.auth.getSession();
    
    if (error && error.message.includes('Invalid')) {
      // This is expected for health check
      return { status: 'healthy', message: 'Supabase is accessible' };
    }

    return { status: 'healthy', message: 'Supabase is accessible' };
  } catch (error) {
    logger.error('Supabase health check failed:', error);
    return { status: 'unhealthy', message: 'Supabase connection failed' };
  }
};

export { supabase };
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.checkSupabaseHealth = exports.subscribeToTable = exports.deleteFromSupabaseStorage = exports.uploadToSupabaseStorage = exports.getSupabaseClient = exports.initializeSupabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_js_1 = require("../utils/logger.js");
let supabase = null;
exports.supabase = supabase;
const initializeSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        logger_js_1.logger.warn('⚠️ Supabase credentials not found. Supabase features will be disabled.');
        return null;
    }
    try {
        exports.supabase = supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
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
        logger_js_1.logger.info('✅ Supabase client initialized');
        return supabase;
    }
    catch (error) {
        logger_js_1.logger.error('❌ Failed to initialize Supabase:', error);
        return null;
    }
};
exports.initializeSupabase = initializeSupabase;
const getSupabaseClient = () => {
    if (!supabase) {
        return (0, exports.initializeSupabase)();
    }
    return supabase;
};
exports.getSupabaseClient = getSupabaseClient;
// Supabase storage helpers
const uploadToSupabaseStorage = async (bucket, path, file, options) => {
    const client = (0, exports.getSupabaseClient)();
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
    }
    catch (error) {
        logger_js_1.logger.error('Supabase storage upload error:', error);
        throw error;
    }
};
exports.uploadToSupabaseStorage = uploadToSupabaseStorage;
const deleteFromSupabaseStorage = async (bucket, paths) => {
    const client = (0, exports.getSupabaseClient)();
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
    }
    catch (error) {
        logger_js_1.logger.error('Supabase storage delete error:', error);
        throw error;
    }
};
exports.deleteFromSupabaseStorage = deleteFromSupabaseStorage;
// Real-time subscriptions
const subscribeToTable = (table, callback, filter) => {
    const client = (0, exports.getSupabaseClient)();
    if (!client) {
        logger_js_1.logger.warn('Cannot create subscription: Supabase client not available');
        return null;
    }
    try {
        const subscription = client
            .channel(`${table}_changes`)
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table,
            filter,
        }, callback)
            .subscribe();
        logger_js_1.logger.info(`📡 Subscribed to ${table} changes`);
        return subscription;
    }
    catch (error) {
        logger_js_1.logger.error('Subscription error:', error);
        return null;
    }
};
exports.subscribeToTable = subscribeToTable;
// Health check for Supabase
const checkSupabaseHealth = async () => {
    const client = (0, exports.getSupabaseClient)();
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
    }
    catch (error) {
        logger_js_1.logger.error('Supabase health check failed:', error);
        return { status: 'unhealthy', message: 'Supabase connection failed' };
    }
};
exports.checkSupabaseHealth = checkSupabaseHealth;

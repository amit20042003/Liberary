import { createClient } from '@supabase/supabase-js';

// !! IMPORTANT !!
// Neeche di gayi "" khali jagah mein apne Supabase project ki URL aur Key daalein.
// Yeh aapko Supabase Dashboard -> Project Settings -> API mein milengi.
const supabaseUrl = "https://rtahmzkdmpzxiugnniei.supabase.co";       // Apna URL yahan paste karein
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YWhtemtkbXB6eGl1Z25uaWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzU3NTIsImV4cCI6MjA3MDkxMTc1Mn0.2aVFSAFzAodYvh_tG_FAypjjXMwcsYG8TVjjOfhG1cI";   // Apni anon key yahan paste karein

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

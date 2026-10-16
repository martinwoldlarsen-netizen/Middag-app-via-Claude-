import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { SUPABASE_KEY, SUPABASE_URL } from '@/constants/config';

// Innlogging (Supabase Auth). Innloggingen lagres på telefonen og fornyes av seg
// selv, så du holder deg innlogget. Lenker fra e-post (bekreftelse og nytt
// passord) fullføres når appen åpnes fra lenken.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    storageKey: 'handleklar.auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

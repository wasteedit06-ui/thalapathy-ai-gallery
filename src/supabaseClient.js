import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwelacrqbnmuqtswatlf.supabase.co';
const supabaseKey = 'sb_publishable_snOSNOTiwby0_6J6svngoQ_uYrxsk9a';

export const supabase = createClient(supabaseUrl, supabaseKey);

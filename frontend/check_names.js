import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.functions.invoke('get-listings', { method: 'GET' });
  if (error) {
    console.error("Error fetching listings:", error);
    return;
  }
  
  console.log("Total listings:", data?.length);
  for (const item of data || []) {
    console.log(`Listing ID: ${item.id}`);
    console.log(`Title: ${item.title}`);
    console.log(`Freelancer ID: ${item.freelancer_id}`);
    console.log(`Users object:`, item.users);
    console.log('-------------------');
  }
}

check();

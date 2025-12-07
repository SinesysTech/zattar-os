
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local manually since we are running with tsx
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  console.log('Listing tables in public schema...');
  
  // List all tables
  const { data, error } = await supabase
    .from('information_schema.tables') // This might not work with postgrest if not exposed
    .select('table_name')
    .eq('table_schema', 'public');

  // Supabase-js data api usually doesn't expose information_schema by default.
  // Instead, let's try to infer from common names.
  
  const tables = ['lancamentos_financeiros'];
  
  for (const t of tables) {
      const { error } = await supabase.from(t).select('id').limit(1);
      if (!error) {
          console.log(`Table found: ${t}`);
      } else {
          console.log(`Table NOT found: ${t} (${error.message})`);
      }
  }
}

checkColumn();

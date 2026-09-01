import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://crphwjizolsgghapyjjv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycGh3aml6b2xzZ2doYXB5amp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIwMDUxMSwiZXhwIjoyMDk3Nzc2NTExfQ.9sTEHEL96z4liyV1skAeH2anbkkElIWo4VK9_qs_8QE'
);

async function check() {
  const { data, error } = await supabase
    .from('resident_demands')
    .select('id, zalo_name, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Total records: ${data.length}`);
  data.forEach((r, idx) => {
    const diffHours = (new Date(r.created_at).getTime() - new Date(r.updated_at).getTime()) / (1000 * 3600);
    console.log(
      `${idx + 1}. [${r.zalo_name}] created: ${r.created_at} | updated: ${r.updated_at} | diff: ${diffHours.toFixed(2)}h`
    );
  });
}

check();

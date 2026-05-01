const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zlmpchqewydvucjwxtkm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QjbmrpXilJIbVyICD-IKXw_67U8vgXI'; // Anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSelect() {
    console.log("Attempting to select users...");
    const { data, error } = await supabase.from('users').select('*');
    
    if (error) {
        console.error("Select error:", error);
    } else {
        console.log("Select success! Users count:", data.length);
        if (data.length > 0) {
            console.log("First user:", data[0]);
        }
    }
}

testSelect();

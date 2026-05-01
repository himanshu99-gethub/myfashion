const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zlmpchqewydvucjwxtkm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QjbmrpXilJIbVyICD-IKXw_67U8vgXI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testOrders() {
    console.log("Fetching a dummy order to check schema cache...");
    // Try to select the column to see if it exists
    const { data, error } = await supabase.from('orders').select('full_name').limit(1);
    
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Success! Data:", data);
    }
}

testOrders();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zlmpchqewydvucjwxtkm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QjbmrpXilJIbVyICD-IKXw_67U8vgXI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testOrders() {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) {
        console.error("Error:", error.message);
    } else if (data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("No data. Let's try an insert with nothing to see what's required.");
        const { error: insErr } = await supabase.from('orders').insert({}).select();
        console.log(insErr);
    }
}

testOrders();

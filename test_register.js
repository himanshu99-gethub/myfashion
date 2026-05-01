const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zlmpchqewydvucjwxtkm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QjbmrpXilJIbVyICD-IKXw_67U8vgXI'; // Anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function registerTestUser() {
    console.log("Registering test user...");
    const email = `testuser_${Date.now()}@example.com`;
    
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'password123',
        options: {
            data: { full_name: 'Test User', gender: 'Other', city: 'Test City' }
        }
    });

    if (error) {
        console.error("Signup error:", error);
        return;
    }

    console.log("Signup success! Auth user id:", data.user.id);
    
    console.log("Now inserting into public.users...");
    const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        name: 'Test User',
        email: email,
        gender: 'Other',
        city: 'Test City',
        role: 'user'
    });

    if (insertError) {
        console.error("Insert into public.users failed:", insertError);
    } else {
        console.log("Successfully inserted into public.users!");
    }
}

registerTestUser();


const authForm = document.getElementById('auth-form');
const submitBtn = document.getElementById('submit-btn');

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showSpinner();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const fullName = document.getElementById('full-name')?.value;
        const gender = document.getElementById('gender')?.value;
        const city = document.getElementById('city')?.value;
        const isSignUp = submitBtn.textContent === 'Create Account';

        try {
            if (isSignUp) {
                if(!gender) throw new Error("Please select your gender.");
                if(!city) throw new Error("Please enter your city.");

                const { data, error } = await window.db.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName, gender: gender, city: city }
                    }
                });
                
                if (error) throw error;
                
                // Insert into users table
                const { error: userError } = await window.db.from('users').insert({
                    id: data.user.id,
                    name: fullName,
                    email: email,
                    gender: gender,
                    city: city,
                    role: 'user'
                });
                
                if (userError) throw userError;
                
                showToast('Welcome to MyFashion! Please check your email.', 'success');
            } else {
                const { error } = await window.db.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw error;
                
                showToast('Access Granted. Welcome back.', 'success');
                setTimeout(() => window.location.href = 'index.html', 1000);
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideSpinner();
        }
    });
}

const googleAuthBtn = document.getElementById('google-auth-btn');
if (googleAuthBtn) {
    googleAuthBtn.addEventListener('click', async () => {
        try {
            const { error } = await window.db.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/index.html'
                }
            });
            if (error) throw error;
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

async function getCurrentUser() {
    const { data: { user }, error: authError } = await window.db.auth.getUser();
    if (authError || !user) return null;
    
    const { data, error } = await window.db.from('users').select('*').eq('id', user.id).single();
    
    if (error && error.code === 'PGRST116') {
        // OAuth user first login: Add to custom users table automatically
        const newUser = {
            id: user.id,
            name: user.user_metadata.full_name || user.email.split('@')[0],
            email: user.email,
            role: 'user' // By default everyone is a user
        };
        await window.db.from('users').insert(newUser);
        return newUser;
    }
    
    return data || user;
}

async function signOut() {
    await window.db.auth.signOut();
    window.location.href = 'login.html';
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', signOut);
}

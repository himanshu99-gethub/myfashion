const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '.env.local' });

// Add these to environment or hardcode if they aren't in env for this script context
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zlmpchqewydvucjwxtkm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_QjbmrpXilJIbVyICD-IKXw_67U8vgXI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Reading seed_200_products.sql...");
    const sql = fs.readFileSync('seed_200_products.sql', 'utf8');
    
    // Extract everything between VALUES and the final semicolon
    const valuesMatch = sql.match(/VALUES\s+([\s\S]+);/i);
    if (!valuesMatch) {
        console.error("Could not find VALUES clause in SQL file.");
        return;
    }
    
    const valuesStr = valuesMatch[1];
    
    // Simple regex to match each row `( ... )`
    const rowRegex = /\(\s*'([^']*)'\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(TRUE|FALSE)\s*\)/g;
    
    const products = [];
    let match;
    while ((match = rowRegex.exec(valuesStr)) !== null) {
        products.push({
            title: match[1],
            price: parseFloat(match[2]),
            original_price: parseFloat(match[3]),
            category: match[4],
            image_url: match[5],
            description: match[6],
            is_trending: match[7] === 'TRUE'
        });
    }

    console.log(`Parsed ${products.length} products. Inserting into Supabase...`);
    
    // Insert in batches of 50 to avoid any limits
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        console.log(`Inserting batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(products.length / batchSize)}...`);
        const { data, error } = await supabase.from('products').insert(batch);
        
        if (error) {
            console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        }
    }
    
    console.log("Seeding complete!");
}

seed().catch(err => console.error("Error:", err));

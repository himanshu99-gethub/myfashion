const fs = require('fs');

const categories = [
    { name: 'Jackets' },
    { name: 'Dresses' },
    { name: 'Sneakers' },
    { name: 'Watches' },
    { name: 'Handbags' },
    { name: 'Suits' },
    { name: 'T-Shirts' },
    { name: 'Trousers' },
    { name: 'Sunglasses' },
    { name: 'Perfumes' }
];

let sql = "DELETE FROM products;\n\nINSERT INTO products (title, price, original_price, category, image_url, description, is_trending) VALUES\n";
const values = [];

let id = 1;
categories.forEach(cat => {
    for (let i = 1; i <= 10; i++) {
        // Create variations in titles for realism
        const adjectives = ['Premium', 'Luxe', 'Signature', 'Urban', 'Classic', 'Modern', 'Vintage', 'Elegance', 'Elite', 'Essential'];
        const title = `${adjectives[i-1]} ${cat.name} Edition`;
        
        const price = Math.floor(Math.random() * 5000) + 2000; // 2000 to 6999
        const original_price = price + Math.floor(Math.random() * 3000) + 1000;
        const is_trending = Math.random() > 0.8 ? 'TRUE' : 'FALSE';
        
        // Using loremflickr with 'pinterest' and 'aesthetic' keywords for high-quality Pinterest-style images, 600x900 (Pinterest ratio)
        const terms = encodeURIComponent(`pinterest,aesthetic,fashion,${cat.name.toLowerCase()}`);
        const imageUrl = `https://loremflickr.com/600/900/${terms}?lock=${id}`;
        
        const description = `High-quality ${cat.name.toLowerCase()} featuring modern aesthetics and premium materials. Experience ultimate comfort and style.`;
        
        values.push(`('${title}', ${price}, ${original_price}, '${cat.name}', '${imageUrl}', '${description}', ${is_trending})`);
        id++;
    }
});

sql += values.join(",\n") + ";\n";

fs.writeFileSync('seed_100_products.sql', sql);
console.log("seed_100_products.sql generated successfully with ultra high quality images!");

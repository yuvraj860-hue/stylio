import mongoose from 'mongoose';
import User from './models/User.js';
import Product from './models/Product.js';
import connectDB from './config/db.js';
import env from './config/env.js';
import apiClient from './utils/apiClient.js';

const indexProductsInML = async (products) => {
  const payload = products.map((product) => ({
    product_id: String(product._id),
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    brand: product.brand,
    tags: product.tags,
    image_url: product.imageUrl,
  }));
  try {
    const result = await apiClient.post('/api/ml/products', payload);
    console.log(`Indexed ${result?.count ?? products.length} products in ML service`);
    return true;
  } catch (err) {
    console.warn(
      `ML service unavailable (${env.ML_SERVICE_URL}): ${err.message} ` +
        '— run the seeding again once it is up, or call GET /api/products/index-ml (admin).'
    );
    return false;
  }
};

const unsplash = (photoId) =>
  `https://images.unsplash.com/${photoId}?w=800&q=80&auto=format&fit=crop`;

const products = [
  {
    name: 'Essential Cotton Crew Tee',
    description: 'Soft breathable cotton t-shirt cut for a relaxed everyday fit.',
    category: 'T-Shirts',
    price: 799,
    brand: 'STYLIO Basics',
    colors: ['White', 'Black', 'Grey'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 120,
    imageUrl: unsplash('photo-1583743814966-8936f5b7be1a'),
    tags: ['basic', 'cotton', 'everyday', 't-shirt'],
  },
  {
    name: 'Graphic Street Tee',
    description: 'Bold graphic print tee with a heavyweight 240 GSM fabric.',
    category: 'T-Shirts',
    price: 1099,
    brand: 'STYLIO Street',
    colors: ['Black', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 80,
    imageUrl: unsplash('photo-1576566588028-4147f3842f27'),
    tags: ['graphic', 'streetwear', 'oversized', 't-shirt'],
  },
  {
    name: 'Relaxed Fleece T-Shirt',
    description: 'Fleece-lined tee for cooler days with a modern boxy silhouette.',
    category: 'T-Shirts',
    price: 1299,
    brand: 'STYLIO Basics',
    colors: ['Heather Grey'],
    sizes: ['M', 'L', 'XL'],
    stock: 60,
    imageUrl: unsplash('photo-1523381210434-271e8be1f52b'),
    tags: ['fleece', 'relaxed', 'cozy', 't-shirt'],
  },
  {
    name: 'Floral Wrap Midi Dress',
    description: 'Flattering wrap dress with a floral print that moves with you.',
    category: 'Dresses',
    price: 2499,
    brand: 'STYLIO Bloom',
    colors: ['Floral Blue', 'Floral Pink'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 45,
    imageUrl: unsplash('photo-1515372039744-b8f02a3ae446'),
    tags: ['floral', 'midi', 'wrap', 'party', 'dress'],
    featured: true,
  },
  {
    name: 'Slip Silk Evening Dress',
    description: 'Elegant bias-cut slip dress in 100% mulberry satin for evenings out.',
    category: 'Dresses',
    price: 5499,
    brand: 'STYLIO Luxe',
    colors: ['Champagne', 'Black'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 30,
    imageUrl: unsplash('photo-1509631179647-0177331693ae'),
    tags: ['silk', 'evening', 'slip', 'formal', 'dress'],
    featured: true,
  },
  {
    name: 'Classic White Sneakers',
    description: 'Minimal white full-grain leather sneakers that pair with everything.',
    category: 'Sneakers',
    price: 2999,
    brand: 'STYLIO Kicks',
    colors: ['White'],
    sizes: ['6', '7', '8', '9', '10'],
    stock: 90,
    imageUrl: unsplash('photo-1549298916-b41d501d3772'),
    tags: ['white', 'leather', 'minimal', 'sneakers'],
    featured: true,
  },
  {
    name: 'Retro Runner Trainers',
    description: 'Vintage-inspired running silhouette with modern cushioning.',
    category: 'Sneakers',
    price: 3999,
    brand: 'STYLIO Kicks',
    colors: ['Blue', 'Green', 'Cream'],
    sizes: ['7', '8', '9', '10', '11'],
    stock: 55,
    imageUrl: unsplash('photo-1600185365483-26d7a4cc7519'),
    tags: ['retro', 'running', 'trainers', 'sneakers'],
    featured: true,
  },
  {
    name: 'Chunky Street Sneakers',
    description: 'Bold chunky-soled sneakers for a statement street look.',
    category: 'Sneakers',
    price: 4599,
    brand: 'STYLIO Street',
    colors: ['Black', 'White'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    stock: 40,
    imageUrl: unsplash('photo-1585487000160-6ebcfceb0d03'),
    tags: ['chunky', 'dad shoe', 'streetwear', 'sneakers'],
  },
  {
    name: 'Oversized Fleece Hoodie',
    description: 'Ultra-soft brushed fleece hoodie with a drop shoulder fit.',
    category: 'Hoodies',
    price: 1999,
    brand: 'STYLIO Street',
    colors: ['Black', 'Grey', 'Moss Green'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 100,
    imageUrl: unsplash('photo-1556821840-3a63f95609a7'),
    tags: ['oversized', 'fleece', 'cozy', 'hoodie'],
    featured: true,
  },
  {
    name: 'Zip-Up Tech Hoodie',
    description: 'Quick-dry zip hoodie with hidden pockets, built for movement.',
    category: 'Hoodies',
    price: 2299,
    brand: 'STYLIO Active',
    colors: ['Navy', 'Black'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: 70,
    imageUrl: unsplash('photo-1509942774463-acf339cf87d5'),
    tags: ['zip', 'tech', 'active', 'sport', 'hoodie'],
  },
  {
    name: 'Slim Tapered Denim Jeans',
    description: 'Stretch denim jeans with a modern slim-taper leg.',
    category: 'Jeans',
    price: 2199,
    brand: 'STYLIO Denim',
    colors: ['Washed Blue', 'Dark Indigo', 'Black'],
    sizes: ['28', '30', '32', '34', '36'],
    stock: 85,
    imageUrl: unsplash('photo-1541099649105-f69ad21f3246'),
    tags: ['slim', 'denim', 'stretch', 'jeans'],
  },
  {
    name: 'Mom Fit Ripped Jeans',
    description: 'High-waisted mom jeans with subtle distressed detailing.',
    category: 'Jeans',
    price: 2399,
    brand: 'STYLIO Denim',
    colors: ['Light Blue'],
    sizes: ['26', '28', '30', '32'],
    stock: 65,
    imageUrl: unsplash('photo-1576995853123-5a10305d93c0'),
    tags: ['mom fit', 'high waist', 'ripped', 'denim', 'jeans'],
  },
  {
    name: 'Classic Denim Trucker Jacket',
    description: 'Timeless trucker jacket in durable washed denim.',
    category: 'Jackets',
    price: 2899,
    brand: 'STYLIO Denim',
    colors: ['Washed Blue'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 50,
    imageUrl: unsplash('photo-1576871337622-98d48d1cf531'),
    tags: ['trucker', 'denim', 'classic', 'outerwear', 'jacket'],
  },
  {
    name: 'Quilted Puffer Jacket',
    description: 'Featherlight padded puffer with water-resistant shell.',
    category: 'Jackets',
    price: 4499,
    brand: 'STYLIO Winter',
    colors: ['Black', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 35,
    imageUrl: unsplash('photo-1539533018447-63fcce2678e3'),
    tags: ['puffer', 'quilted', 'winter', 'warm', 'jacket'],
    featured: true,
  },
  {
    name: 'Minimal Leather Crossbody Bag',
    description: 'Sleek vegan leather crossbody with an adjustable strap.',
    category: 'Accessories',
    price: 1799,
    brand: 'STYLIO Accessories',
    colors: ['Tan', 'Black'],
    sizes: ['One Size'],
    stock: 75,
    imageUrl: unsplash('photo-1584917865442-de89df76afd3'),
    tags: ['leather', 'crossbody', 'minimal', 'bag', 'accessories'],
  },
  {
    name: 'Aviator Sunglasses',
    description: 'Classic aviator frames with UV400 protective lenses.',
    category: 'Accessories',
    price: 1299,
    brand: 'STYLIO Accessories',
    colors: ['Gold/Green', 'Black/Green'],
    sizes: ['One Size'],
    stock: 110,
    imageUrl: unsplash('photo-1511499767150-a48a237f0083'),
    tags: ['aviator', 'sunglasses', 'uv protection', 'accessories'],
  },
];

const seed = async () => {
  try {
    await connectDB();
    console.log('Seeding STYLIO database...');

    const ifEmptyOnly = process.argv.includes('--if-empty') || process.env.SEED_IF_EMPTY === '1';
    const existing = await Product.countDocuments({});
    if (ifEmptyOnly && existing > 0) {
      console.log(`Database already has ${existing} products — skipping seed (--if-empty).`);
      await mongoose.disconnect();
      return;
    }

    const adminData = {
      name: 'STYLIO Admin',
      email: 'admin@stylio.com',
      password: 'admin123',
      role: 'admin',
      wishlist: [],
    };

    let admin = await User.findOne({ email: adminData.email });
    if (admin) {
      admin.name = adminData.name;
      admin.password = adminData.password;
      admin.role = adminData.role;
      await admin.save();
    } else {
      admin = await User.create(adminData);
    }
    console.log(`Admin ready: admin@stylio.com / admin123 (${admin._id})`);

    await Product.deleteMany({});
    const inserted = await Product.insertMany(products);
    console.log(`Inserted ${inserted.length} products`);

    await indexProductsInML(inserted);

    const byCategory = inserted.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    console.log('Category counts:', byCategory);

    console.log('Seeding complete.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
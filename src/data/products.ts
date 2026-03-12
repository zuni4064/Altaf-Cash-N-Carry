// Category images
import fruitsVegetablesImg from "@/assets/categories/fruits-vegetables.jpg";
import dairyImg from "@/assets/categories/dairy.jpg";
import beveragesImg from "@/assets/categories/beverages.jpg";
import snacksImg from "@/assets/categories/snacks.jpg";
import bakeryImg from "@/assets/categories/bakery.jpg";
import householdImg from "@/assets/categories/household.jpg";
import personalCareImg from "@/assets/categories/personal-care.jpg";

// Product images - all JPGs from src/assets/products
import applesImg from "@/assets/products/apples.jpg";
import bananasImg from "@/assets/products/bananas.jpg";
import tomatoesImg from "@/assets/products/tomatoes.jpg";
import capsicumImg from "@/assets/products/capsicum.jpg";
import spinachImg from "@/assets/products/spinach.jpg";
import carrotsImg from "@/assets/products/carrots.jpg";
import mangoesImg from "@/assets/products/mangoes.jpg";
import potatoesImg from "@/assets/products/potatoes.jpg";
import onionsImg from "@/assets/products/onions.jpg";
import watermelonImg from "@/assets/products/watermelon.jpg";
import milkImg from "@/assets/products/milk.jpg";
import yogurtImg from "@/assets/products/yogurt.jpg";
import cheeseImg from "@/assets/products/cheese.jpg";
import butterImg from "@/assets/products/butter.jpg";
import eggsImg from "@/assets/products/eggs.jpg";
import paneerImg from "@/assets/products/paneer.jpg";
import lassiImg from "@/assets/products/lassi.jpg";
import greenTeaImg from "@/assets/products/green-tea.jpg";
import orangeJuiceImg from "@/assets/products/orange-juice.jpg";
import coffeeImg from "@/assets/products/coffee.jpg";
import chipsImg from "@/assets/products/chips.jpg";
import nutsImg from "@/assets/products/nuts.jpg";
import cookiesImg from "@/assets/products/cookies.jpg";
import breadImg from "@/assets/products/bread.jpg";
import croissantsImg from "@/assets/products/croissants.jpg";
import naanImg from "@/assets/products/naan.jpg";
import muffinsImg from "@/assets/products/muffins.jpg";
import donutsImg from "@/assets/products/donuts.jpg";
import dishSoapImg from "@/assets/products/dish-soap.jpg";
import shampooImg from "@/assets/products/shampoo.jpg";
import coconutImg from "@/assets/products/coconut.jpg";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  image: string;
  badge?: "bestseller" | "discount" | "new" | "out-of-stock";
  discount?: number;
  inStock: boolean;
  stock?: number;
  rating?: number;
  reviewCount?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  count: number;
}

export const categories: Category[] = [
  { id: "fruits-vegetables", name: "Fruits & Vegetables", icon: "🥬", image: fruitsVegetablesImg, count: 10 },
  { id: "dairy", name: "Dairy Products", icon: "🥛", image: dairyImg, count: 10 },
  { id: "beverages", name: "Beverages", icon: "🥤", image: beveragesImg, count: 10 },
  { id: "snacks", name: "Snacks & Chips", icon: "🍿", image: snacksImg, count: 10 },
  { id: "bakery", name: "Bakery Items", icon: "🍞", image: bakeryImg, count: 10 },
  { id: "household", name: "Household Items", icon: "🏠", image: householdImg, count: 10 },
  { id: "personal-care", name: "Personal Care", icon: "🧴", image: personalCareImg, count: 10 },
];

export const products: Product[] = [
  // Fruits & Vegetables - using asset JPGs
  { id: "fv1", name: "Fresh Red Apples", category: "fruits-vegetables", price: 320, unit: "kg", description: "Fresh farm apples, rich in nutrients and perfect for healthy snacking.", image: applesImg, badge: "bestseller", inStock: true, rating: 4.8, reviewCount: 156 },
  { id: "fv2", name: "Organic Bananas", category: "fruits-vegetables", price: 180, unit: "dozen", description: "Sweet and ripe organic bananas from local farms.", image: bananasImg, inStock: true, rating: 4.6, reviewCount: 89 },
  { id: "fv3", name: "Fresh Tomatoes", category: "fruits-vegetables", price: 120, unit: "kg", description: "Juicy red tomatoes, perfect for salads and cooking.", image: tomatoesImg, inStock: true, rating: 4.7, reviewCount: 112 },
  { id: "fv4", name: "Green Capsicum", category: "fruits-vegetables", price: 200, unit: "kg", description: "Crisp green bell peppers for your favorite dishes.", image: capsicumImg, inStock: true, rating: 4.4, reviewCount: 45 },
  { id: "fv5", name: "Fresh Spinach", category: "fruits-vegetables", price: 80, unit: "bunch", description: "Nutrient-rich fresh spinach leaves.", image: spinachImg, badge: "new", inStock: true, rating: 4.9, reviewCount: 34 },
  { id: "fv6", name: "Carrots", category: "fruits-vegetables", price: 100, unit: "kg", description: "Crunchy and sweet carrots, great for juicing or cooking.", image: carrotsImg, inStock: true, rating: 4.5, reviewCount: 67 },
  { id: "fv7", name: "Fresh Mangoes", category: "fruits-vegetables", price: 450, unit: "kg", description: "Sweet Pakistani mangoes, the king of fruits.", image: mangoesImg, badge: "discount", discount: 15, inStock: true, rating: 4.9, reviewCount: 320 },
  { id: "fv8", name: "Potatoes", category: "fruits-vegetables", price: 90, unit: "kg", description: "Fresh potatoes, a kitchen staple for every meal.", image: potatoesImg, inStock: true, rating: 4.8, reviewCount: 145 },
  { id: "fv9", name: "Onions", category: "fruits-vegetables", price: 150, unit: "kg", description: "Fresh red onions for cooking and salads.", image: onionsImg, inStock: true, rating: 4.5, reviewCount: 98 },
  { id: "fv10", name: "Watermelon", category: "fruits-vegetables", price: 60, unit: "kg", description: "Refreshing sweet watermelon, perfect for summer.", image: watermelonImg, inStock: true, rating: 4.7, reviewCount: 76 },

  // Dairy - all JPGs from assets
  { id: "d1", name: "Fresh Milk", category: "dairy", price: 220, unit: "liter", description: "Farm-fresh whole milk, pasteurized and nutritious.", image: milkImg, badge: "bestseller", inStock: true, rating: 4.8, reviewCount: 412 },
  { id: "d2", name: "Natural Yogurt", category: "dairy", price: 180, unit: "kg", description: "Creamy natural yogurt, perfect for desserts and meals.", image: yogurtImg, inStock: true, rating: 4.6, reviewCount: 156 },
  { id: "d3", name: "Cheddar Cheese", category: "dairy", price: 850, unit: "kg", description: "Rich and sharp cheddar cheese for sandwiches.", image: cheeseImg, inStock: true, rating: 4.7, reviewCount: 89 },
  { id: "d4", name: "Butter", category: "dairy", price: 550, unit: "kg", description: "Creamy unsalted butter for cooking and baking.", image: butterImg, inStock: true, rating: 4.9, reviewCount: 234 },
  { id: "d5", name: "Cream", category: "dairy", price: 350, unit: "liter", description: "Fresh heavy cream for desserts and cooking.", image: milkImg, inStock: true, rating: 4.5, reviewCount: 67 },
  { id: "d6", name: "Eggs (Pack of 12)", category: "dairy", price: 320, unit: "pack", description: "Farm-fresh brown eggs, pack of 12.", image: eggsImg, badge: "bestseller", inStock: true, rating: 4.9, reviewCount: 521 },
  { id: "d7", name: "Paneer", category: "dairy", price: 600, unit: "kg", description: "Fresh cottage cheese, perfect for Pakistani dishes.", image: paneerImg, inStock: true, rating: 4.7, reviewCount: 112 },
  { id: "d8", name: "Raita", category: "dairy", price: 120, unit: "pack", description: "Ready-made raita, perfect side for biryani.", image: lassiImg, badge: "new", inStock: true, rating: 4.4, reviewCount: 45 },
  { id: "d9", name: "Lassi", category: "dairy", price: 80, unit: "bottle", description: "Traditional sweet lassi drink.", image: lassiImg, inStock: true, rating: 4.8, reviewCount: 189 },
  { id: "d10", name: "Mozzarella Cheese", category: "dairy", price: 950, unit: "kg", description: "Stretchy mozzarella, great for pizza and pasta.", image: cheeseImg, inStock: true, rating: 4.6, reviewCount: 134 },

  // Beverages - all JPGs from assets
  { id: "b1", name: "Green Tea Pack", category: "beverages", price: 450, unit: "box", description: "Premium green tea, 25 tea bags per box.", image: greenTeaImg, inStock: true, rating: 4.5, reviewCount: 87 },
  { id: "b2", name: "Orange Juice", category: "beverages", price: 280, unit: "liter", description: "100% pure orange juice, no added sugar.", image: orangeJuiceImg, badge: "bestseller", inStock: true, rating: 4.7, reviewCount: 156 },
  { id: "b3", name: "Cola Pack (6)", category: "beverages", price: 480, unit: "pack", description: "Chilled cola, pack of 6 cans.", image: coffeeImg, inStock: true, rating: 4.8, reviewCount: 342 },
  { id: "b4", name: "Mineral Water", category: "beverages", price: 80, unit: "1.5L", description: "Pure mineral water, 1.5 liter bottle.", image: orangeJuiceImg, inStock: true, rating: 4.9, reviewCount: 512 },
  { id: "b5", name: "Mango Juice", category: "beverages", price: 180, unit: "liter", description: "Sweet mango pulp juice, refreshing taste.", image: mangoesImg, badge: "discount", discount: 10, inStock: true, rating: 4.6, reviewCount: 123 },
  { id: "b6", name: "Coffee Beans", category: "beverages", price: 1200, unit: "kg", description: "Premium Arabica coffee beans, freshly roasted.", image: coffeeImg, inStock: true, rating: 4.9, reviewCount: 245 },
  { id: "b7", name: "Lemonade", category: "beverages", price: 150, unit: "liter", description: "Freshly squeezed lemonade, sweet and tangy.", image: orangeJuiceImg, inStock: true, rating: 4.5, reviewCount: 78 },
  { id: "b8", name: "Chai Tea", category: "beverages", price: 350, unit: "box", description: "Traditional Pakistani chai tea leaves.", image: coffeeImg, badge: "bestseller", inStock: true, rating: 4.9, reviewCount: 456 },
  { id: "b9", name: "Energy Drink", category: "beverages", price: 200, unit: "can", description: "High-energy boost drink for active lifestyles.", image: greenTeaImg, inStock: true, rating: 4.5, reviewCount: 167 },
  { id: "b10", name: "Sparkling Water", category: "beverages", price: 120, unit: "bottle", description: "Fizzy sparkling water, refreshingly crisp.", image: greenTeaImg, inStock: true, rating: 4.4, reviewCount: 89 },

  // Snacks - all JPGs from assets
  { id: "s1", name: "Classic Potato Chips", category: "snacks", price: 150, unit: "pack", description: "Crispy salted potato chips, family size.", image: chipsImg, badge: "bestseller", inStock: true, rating: 4.7, reviewCount: 389 },
  { id: "s2", name: "Mixed Nuts", category: "snacks", price: 800, unit: "kg", description: "Premium mixed nuts - almonds, cashews, and pistachios.", image: nutsImg, inStock: true, rating: 4.8, reviewCount: 156 },
  { id: "s3", name: "Chocolate Cookies", category: "snacks", price: 250, unit: "pack", description: "Double chocolate chip cookies, irresistible taste.", image: cookiesImg, inStock: true, rating: 4.6, reviewCount: 234 },
  { id: "s4", name: "Popcorn", category: "snacks", price: 120, unit: "pack", description: "Butter flavored microwave popcorn.", image: chipsImg, inStock: true, rating: 4.5, reviewCount: 112 },
  { id: "s5", name: "Nachos", category: "snacks", price: 200, unit: "pack", description: "Crunchy corn nachos with cheese flavor.", image: cookiesImg, badge: "new", inStock: true, rating: 4.4, reviewCount: 56 },
  { id: "s6", name: "Biscuits Pack", category: "snacks", price: 180, unit: "pack", description: "Assorted biscuits, perfect with tea.", image: breadImg, inStock: true, rating: 4.7, reviewCount: 189 },
  { id: "s7", name: "Nimko Mix", category: "snacks", price: 250, unit: "pack", description: "Traditional Pakistani nimko snack mix.", image: nutsImg, badge: "bestseller", inStock: true, rating: 4.9, reviewCount: 445 },
  { id: "s8", name: "Pretzels", category: "snacks", price: 220, unit: "pack", description: "Salty twisted pretzels, classic crunch.", image: chipsImg, inStock: true, rating: 4.5, reviewCount: 78 },
  { id: "s9", name: "Candy Pack", category: "snacks", price: 100, unit: "pack", description: "Assorted fruit candies for the family.", image: cookiesImg, badge: "discount", discount: 20, inStock: true, rating: 4.6, reviewCount: 145 },
  { id: "s10", name: "Granola Bars", category: "snacks", price: 350, unit: "box", description: "Healthy oat and honey granola bars.", image: breadImg, inStock: true, rating: 4.8, reviewCount: 92 },

  // Bakery - all JPGs from assets
  { id: "bk1", name: "White Bread", category: "bakery", price: 120, unit: "loaf", description: "Soft white bread, freshly baked daily.", image: breadImg, badge: "bestseller", inStock: true, rating: 4.8, reviewCount: 234 },
  { id: "bk2", name: "Whole Wheat Bread", category: "bakery", price: 150, unit: "loaf", description: "Healthy whole wheat bread, high in fiber.", image: breadImg, inStock: true, rating: 4.7, reviewCount: 156 },
  { id: "bk3", name: "Croissants (4)", category: "bakery", price: 350, unit: "pack", description: "Buttery flaky French croissants.", image: croissantsImg, inStock: true, rating: 4.9, reviewCount: 312 },
  { id: "bk4", name: "Naan Bread", category: "bakery", price: 40, unit: "piece", description: "Traditional tandoori naan, soft and fluffy.", image: naanImg, badge: "bestseller", inStock: true, rating: 4.8, reviewCount: 567 },
  { id: "bk5", name: "Cake Rusk", category: "bakery", price: 200, unit: "pack", description: "Crunchy cake rusk, perfect with chai.", image: muffinsImg, inStock: true, rating: 4.6, reviewCount: 189 },
  { id: "bk6", name: "Pita Bread", category: "bakery", price: 180, unit: "pack", description: "Soft pita pockets for wraps and dips.", image: naanImg, inStock: true, rating: 4.5, reviewCount: 98 },
  { id: "bk7", name: "Chocolate Muffins", category: "bakery", price: 300, unit: "pack", description: "Rich chocolate muffins, pack of 4.", image: muffinsImg, badge: "new", inStock: true, rating: 4.7, reviewCount: 67 },
  { id: "bk8", name: "Garlic Bread", category: "bakery", price: 250, unit: "pack", description: "Crispy garlic bread with herbs.", image: breadImg, inStock: true, rating: 4.8, reviewCount: 145 },
  { id: "bk9", name: "Donuts (6)", category: "bakery", price: 400, unit: "box", description: "Glazed donuts, assorted flavors, box of 6.", image: donutsImg, badge: "discount", discount: 10, inStock: true, rating: 4.6, reviewCount: 212 },
  { id: "bk10", name: "Paratha", category: "bakery", price: 30, unit: "piece", description: "Layered flaky paratha, a breakfast staple.", image: naanImg, inStock: true, rating: 4.9, reviewCount: 432 },

  // Household - all JPGs from assets
  { id: "h1", name: "Dish Soap", category: "household", price: 250, unit: "bottle", description: "Powerful dish cleaning liquid, lemon scent.", image: dishSoapImg, inStock: true, rating: 4.6, reviewCount: 189 },
  { id: "h2", name: "Laundry Detergent", category: "household", price: 650, unit: "kg", description: "Effective laundry powder for all fabrics.", image: dishSoapImg, badge: "bestseller", inStock: true, rating: 4.8, reviewCount: 423 },
  { id: "h3", name: "Tissue Box", category: "household", price: 180, unit: "box", description: "Soft 2-ply facial tissues, 200 sheets.", image: dishSoapImg, inStock: true, rating: 4.7, reviewCount: 256 },
  { id: "h4", name: "Floor Cleaner", category: "household", price: 350, unit: "bottle", description: "Antibacterial floor cleaner, pine fresh scent.", image: shampooImg, inStock: true, rating: 4.5, reviewCount: 112 },
  { id: "h5", name: "Trash Bags", category: "household", price: 200, unit: "roll", description: "Heavy duty trash bags, 30 count.", image: dishSoapImg, inStock: true, rating: 4.6, reviewCount: 145 },
  { id: "h6", name: "Paper Towels", category: "household", price: 280, unit: "pack", description: "Absorbent paper towels, 2-pack.", image: dishSoapImg, badge: "new", inStock: true, rating: 4.4, reviewCount: 67 },
  { id: "h7", name: "Sponge Pack", category: "household", price: 120, unit: "pack", description: "Multi-purpose cleaning sponges, 5 pack.", image: dishSoapImg, inStock: true, rating: 4.7, reviewCount: 89 },
  { id: "h8", name: "Air Freshener", category: "household", price: 400, unit: "can", description: "Long-lasting room air freshener spray.", image: shampooImg, inStock: true, rating: 4.5, reviewCount: 134 },
  { id: "h9", name: "Aluminum Foil", category: "household", price: 150, unit: "roll", description: "Kitchen aluminum foil, 25m roll.", image: dishSoapImg, inStock: true, rating: 4.8, reviewCount: 212 },
  { id: "h10", name: "Cling Wrap", category: "household", price: 180, unit: "roll", description: "Food-safe plastic cling wrap, 100m.", image: shampooImg, inStock: true, rating: 4.6, reviewCount: 156 },

  // Personal Care - all JPGs from assets
  { id: "pc1", name: "Shampoo", category: "personal-care", price: 450, unit: "bottle", description: "Anti-dandruff shampoo for all hair types.", image: shampooImg, badge: "bestseller", inStock: true, rating: 4.7, reviewCount: 345 },
  { id: "pc2", name: "Toothpaste", category: "personal-care", price: 200, unit: "tube", description: "Whitening toothpaste with fluoride.", image: shampooImg, inStock: true, rating: 4.8, reviewCount: 412 },
  { id: "pc3", name: "Body Wash", category: "personal-care", price: 380, unit: "bottle", description: "Moisturizing body wash, lavender scent.", image: shampooImg, inStock: true, rating: 4.6, reviewCount: 189 },
  { id: "pc4", name: "Hand Soap", category: "personal-care", price: 150, unit: "bottle", description: "Antibacterial hand soap, gentle formula.", image: dishSoapImg, inStock: true, rating: 4.5, reviewCount: 156 },
  { id: "pc5", name: "Face Cream", category: "personal-care", price: 550, unit: "jar", description: "Moisturizing face cream with SPF protection.", image: yogurtImg, badge: "new", inStock: true, rating: 4.4, reviewCount: 89 },
  { id: "pc6", name: "Deodorant", category: "personal-care", price: 320, unit: "stick", description: "48-hour protection deodorant stick.", image: shampooImg, inStock: true, rating: 4.7, reviewCount: 234 },
  { id: "pc7", name: "Razor Pack", category: "personal-care", price: 280, unit: "pack", description: "Disposable razors, 5-pack with lubricating strip.", image: dishSoapImg, inStock: true, rating: 4.6, reviewCount: 145 },
  { id: "pc8", name: "Sunscreen", category: "personal-care", price: 650, unit: "tube", description: "SPF 50+ sunscreen for full protection.", image: coconutImg, badge: "discount", discount: 15, inStock: true, rating: 4.8, reviewCount: 278 },
  { id: "pc9", name: "Cotton Buds", category: "personal-care", price: 80, unit: "pack", description: "Soft cotton ear buds, 100 count.", image: shampooImg, inStock: true, rating: 4.5, reviewCount: 112 },
  { id: "pc10", name: "Hair Oil", category: "personal-care", price: 350, unit: "bottle", description: "Nourishing coconut hair oil for strong hair.", image: coconutImg, badge: "bestseller", inStock: true, rating: 4.9, reviewCount: 389 },
];

export const getFeaturedProducts = () => products.filter(p => p.badge === "bestseller" && p.inStock);
export const getDiscountedProducts = () => products.filter(p => p.badge === "discount" && p.inStock);
export const getProductsByCategory = (categoryId: string) => products.filter(p => p.category === categoryId);
export const getProductById = (id: string) => products.find(p => p.id === id);

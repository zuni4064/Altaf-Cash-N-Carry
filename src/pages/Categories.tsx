import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Categories = () => {
  const { categories, products } = useCart();
  const getProductsByCategory = (categoryId: string) => products.filter(p => p.category === categoryId);

  return (
    <div className="container py-8">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold mb-8">Categories</motion.h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              to={`/shop?category=${cat.id}`}
              className="group relative block rounded-xl overflow-hidden h-48 hover-lift"
            >
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-primary-foreground font-display font-bold text-xl">{cat.icon} {cat.name}</h3>
                <p className="text-primary-foreground/70 text-sm flex items-center gap-1 mt-1">
                  {getProductsByCategory(cat.id).length} products <ArrowRight className="h-3 w-3" />
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Categories;

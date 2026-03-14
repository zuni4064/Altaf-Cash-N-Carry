import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LayoutGrid } from "lucide-react";

const Categories = () => {
  const { categories, products } = useCart();
  const getCount = (id: string) => products.filter(p => p.category === id).length;

  /* Give first two categories a "featured" span */
  const getCellClass = (i: number) => {
    if (i === 0) return "col-span-2 row-span-2 h-[360px]";
    if (i === 1) return "col-span-1 row-span-2 h-[360px]";
    return "col-span-1 row-span-1 h-[170px]";
  };

  return (
    <div className="min-h-screen">
      {/* ── Header banner ── */}
      <section className="relative overflow-hidden bg-primary/5 border-b border-border/40 py-12">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -14, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/8 blur-3xl pointer-events-none"
        />

        <div className="container relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 180 }}
              className="inline-flex items-center gap-2 text-primary text-xs font-bold tracking-widest uppercase mb-3"
            >
              <motion.span
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-primary inline-block"
              />
              Browse
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-extrabold tracking-tight"
            >
              All <span className="text-primary">Categories</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground mt-2 text-sm"
            >
              {categories.length} categories · {products.length} products
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.22, type: "spring" }}
            className="bg-primary/10 text-primary rounded-xl px-4 py-2 text-center"
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              <div>
                <div className="text-2xl font-extrabold leading-none">{categories.length}</div>
                <div className="text-[10px] font-semibold mt-0.5 opacity-80">Categories</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-10">
        {/* ── Bento grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-auto">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 28, scale: 0.93 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 130, damping: 18 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className={getCellClass(i)}
            >
              <Link
                to={`/shop?category=${cat.id}`}
                className="relative block w-full h-full rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl transition-shadow duration-300"
              >
                {/* Background image */}
                <motion.div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${cat.image})` }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10 group-hover:from-black/65 transition-all duration-300" />

                {/* Primary tint on hover */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/15 transition-colors duration-300" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  {/* Icon + name */}
                  <div>
                    {cat.icon && (
                      <motion.span
                        className="text-2xl block mb-1"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                      >
                        {cat.icon}
                      </motion.span>
                    )}
                    <h3 className={`font-display font-bold text-white drop-shadow-lg leading-tight
                      ${i < 2 ? "text-xl md:text-2xl" : "text-sm md:text-base"}`}>
                      {cat.name}
                    </h3>

                    {/* Product count + arrow */}
                    <motion.div
                      className="flex items-center gap-1 mt-1 overflow-hidden"
                      initial={{ opacity: 0.6, y: 4 }}
                      whileHover={{ opacity: 1, y: 0 }}
                    >
                      <span className="text-white/70 text-xs font-medium">
                        {getCount(cat.id)} products
                      </span>
                      <motion.div
                        className="text-white/70"
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="h-3 w-3" />
                      </motion.div>
                    </motion.div>
                  </div>
                </div>

                {/* Count badge top-right */}
                <div className="absolute top-3 right-3">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.05, type: "spring" }}
                    className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20"
                  >
                    {getCount(cat.id)}
                  </motion.span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
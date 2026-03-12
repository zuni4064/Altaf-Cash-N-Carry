import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/PageTransition";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "low" | "high">("default");
  const { products, categories } = useCart();
  const activeCategory = searchParams.get("category") || "all";

  const filtered = useMemo(() => {
    let list = activeCategory === "all" ? products : products.filter(p => p.category === activeCategory);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "high") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [activeCategory, search, sortBy, products]);

  const setCategory = (id: string) => {
    if (id === "all") searchParams.delete("category");
    else searchParams.set("category", id);
    setSearchParams(searchParams);
  };

  return (
    <PageTransition className="container py-8">
      <Helmet>
        <title>Shop | Altaf Cash and Carry</title>
        <meta name="description" content="Browse our extensive collection of groceries, fresh produce, and household items." />
      </Helmet>

      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold mb-6">Shop</motion.h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant={sortBy === "low" ? "default" : "outline"} size="sm" onClick={() => setSortBy(sortBy === "low" ? "default" : "low")}>
            <SlidersHorizontal className="h-4 w-4 mr-1" /> Price: Low
          </Button>
          <Button variant={sortBy === "high" ? "default" : "outline"} size="sm" onClick={() => setSortBy(sortBy === "high" ? "default" : "high")}>
            Price: High
          </Button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button size="sm" variant={activeCategory === "all" ? "default" : "outline"} onClick={() => setCategory("all")}>All</Button>
        {categories.map(c => (
          <Button key={c.id} size="sm" variant={activeCategory === c.id ? "default" : "outline"} onClick={() => setCategory(c.id)}>
            {c.name}
          </Button>
        ))}
      </div>

      {/* Products */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-20">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      )}
    </PageTransition>
  );
};

export default Shop;

import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import PromotionalBanner from "@/components/PromotionalBanner";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/PageTransition";

const Index = () => {
  const { products, categories } = useCart();

  const featured = products.filter(p => p.badge === "bestseller" && p.inStock).slice(0, 8);
  const discounted = products.filter(p => p.badge === "discount" && p.inStock);

  return (
    <PageTransition>
      <Helmet>
        <title>Altaf Cash and Carry | Home</title>
        <meta name="description" content="Welcome to Cash & Carry - Your one-stop shop for fresh groceries and daily household essentials in Lahore. Shop online!" />
      </Helmet>

      <div>
        <HeroSection />
        <PromotionalBanner />

        {/* Categories */}
        <section className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold">Shop by Category</h2>
            <Link to="/categories" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/shop?category=${cat.id}`}
                  className="relative block text-center group rounded-xl overflow-hidden aspect-square border border-border/50 shadow-sm"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${cat.image})` }}
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
                    <p className="text-sm md:text-base font-bold text-white drop-shadow-md tracking-wide leading-tight">{cat.name}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="container pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold">Best Sellers</h2>
            <Link to="/shop" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Discount Section */}
        {discounted.length > 0 && (
          <section className="bg-secondary/10 py-16">
            <div className="container">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-8">🔥 Hot Deals</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {discounted.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <ReviewsCarousel />

        {/* CTA */}
        <section className="container py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden p-12 text-white shadow-xl"
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1920&auto=format&fit=crop')" }}
            />
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-black/60 z-10" />

            {/* Content */}
            <div className="relative z-20">
              <h2 className="text-3xl font-display font-bold mb-4 drop-shadow-md">Ready to Shop?</h2>
              <p className="opacity-90 mb-6 max-w-md mx-auto text-lg drop-shadow-sm">Browse our complete collection of fresh groceries and household essentials.</p>
              <Link to="/shop">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg">
                  Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Index;

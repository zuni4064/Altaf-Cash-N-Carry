import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";

const HeroSection = () => (
  <section className="relative overflow-hidden gradient-hero min-h-[80vh] flex flex-col items-center justify-center text-center">
    {/* Background Image with improved overlay */}
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-30" />
    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

    <div className="container relative z-10 py-20 px-4 flex flex-col items-center">
      <div className="max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block mb-6 px-4 py-1.5 rounded-full bg-secondary/90 text-secondary-foreground text-sm font-bold tracking-wider uppercase shadow-lg backdrop-blur-sm"
        >
          Welcome to Altaf Cash and Carry
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-extrabold text-primary-foreground leading-tight mb-8 drop-shadow-md"
        >
          Fresh Groceries,<br />
          <span className="text-secondary drop-shadow-lg">Delivered Fast</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-primary-foreground/90 text-lg md:text-xl mb-10 mx-auto max-w-2xl font-light leading-relaxed"
        >
          Shop from hundreds of quality products at the best prices. From farm-fresh produce to daily household essentials — all under one roof in Lahore.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          <Link to="/shop">
            <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:scale-105 transition-transform duration-300 font-bold h-14 px-8 text-lg rounded-full shadow-xl">
              <ShoppingBag className="mr-2 h-6 w-6" /> Shop Now
            </Button>
          </Link>
          <Link to="/categories">
            <Button size="lg" variant="outline" className="border-2 border-primary-foreground/50 text-foreground hover:bg-primary-foreground hover:text-primary transition-all duration-300 font-bold h-14 px-8 text-lg rounded-full backdrop-blur-md bg-card/10">
              Browse Categories
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;

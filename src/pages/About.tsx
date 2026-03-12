import { motion } from "framer-motion";
import { ShieldCheck, Truck, Heart, Leaf } from "lucide-react";

const values = [
  { icon: <Leaf className="h-8 w-8" />, title: "Fresh Quality", desc: "We source directly from farms to ensure the freshest produce every day." },
  { icon: <ShieldCheck className="h-8 w-8" />, title: "Best Prices", desc: "Wholesale prices on all items — save more on every purchase." },
  { icon: <Truck className="h-8 w-8" />, title: "Fast Delivery", desc: "Quick delivery across Lahore, right to your doorstep." },
  { icon: <Heart className="h-8 w-8" />, title: "Customer Love", desc: "Thousands of happy families trust Cash & Carry for their daily needs." },
];

const About = () => (
  <div>
    {/* Hero Section for About */}
    <section className="relative overflow-hidden h-[40vh] flex items-center justify-center text-center">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="container relative z-10 text-white">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-display font-extrabold mb-4 drop-shadow-lg"
        >
          About Altaf Cash & Carry
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 font-light"
        >
          Your trusted neighborhood grocer in Central Park Society, Lahore.
        </motion.p>
      </div>
    </section>

    <div className="container py-16">
      <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-display font-bold mb-6">Our Story</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Altaf Cash & Carry was founded with a simple yet powerful mission: to provide the families of Central Park Society and surrounding areas with a reliable, high-quality, and affordable shopping experience. What started as a modest vision has grown into a cornerstone of the community.
            </p>
            <p>
              We understand the daily needs of Pakistani households. That's why we meticulously source our fresh produce, dairy, bakery items, and household essentials to ensure you never have to compromise on quality or price.
            </p>
            <p>
              Our dedicated team works tirelessly to maintain a clean, vibrant, and welcoming store environment, while our modern delivery network ensures that even if you can't visit us, the same exceptional quality arrives right at your doorstep.
            </p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
            alt="Inside Altaf Cash and Carry"
            className="rounded-2xl shadow-xl border border-border"
          />
          <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="text-4xl font-display font-bold text-primary">10k+</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Happy Customers</div>
          </div>
        </motion.div>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-display font-bold">Our Core Values</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">The principles that guide everything we do.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {values.map((v, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl border border-border p-8 text-center hover-lift shadow-sm hover:shadow-md transition-all group"
          >
            <div className="text-primary mx-auto mb-6 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              {v.icon}
            </div>
            <h3 className="font-display text-xl font-bold mb-3">{v.title}</h3>
            <p className="text-sm text-muted-foreground">{v.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Visual Break / Commitment */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl bg-primary text-primary-foreground p-12 md:p-20 text-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20" />
        <div className="relative z-10">
          <Heart className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Committed to Excellence</h2>
          <p className="opacity-90 max-w-2xl mx-auto text-lg md:text-xl font-light">
            Every product on our shelves is a promise of quality to you and your family. We don't just sell groceries; we deliver peace of mind.
          </p>
        </div>
      </section>
    </div>
  </div>
);

export default About;

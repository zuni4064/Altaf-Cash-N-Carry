import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";

/* ── Contact info cards ─────────────────────────────────── */
const INFO = [
  {
    icon: MapPin,
    label: "Visit Us",
    value: "66-67 A, Block A Central Park Housing Scheme",
    sub: "Lahore, Pakistan",
    color: "bg-blue-500/10 text-blue-600",
    link: "https://maps.google.com/?q=Altaf+Cash+and+Carry+Central+Park+Lahore",
  },
  {
    icon: Phone,
    label: "Call Us",
    value: "0321-9410035",
    sub: "Available during store hours",
    color: "bg-emerald-500/10 text-emerald-600",
    link: "tel:+923219410035",
  },
  {
    icon: Mail,
    label: "Email Us",
    value: "altafcashncarry@gmail.com",
    sub: "We reply within 24 hours",
    color: "bg-primary/10 text-primary",
    link: "mailto:altafcashncarry@gmail.com",
  },
  {
    icon: Clock,
    label: "Store Hours",
    value: "Mon – Sun",
    sub: "9:00 AM – 11:30 PM",
    color: "bg-amber-500/10 text-amber-600",
    link: null,
  },
];

const MAX_MSG = 500;

const Contact = () => {
  const [form, setForm]       = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const charsLeft = MAX_MSG - form.message.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      toast.error("EmailJS credentials are not configured.");
      setLoading(false);
      return;
    }

    try {
      await emailjs.send(
        serviceId, templateId,
        {
          subject:      "Help required",
          to_email:     "altafcashncarry@gmail.com",
          from_name:    form.name,
          from_email:   form.email,
          message:      form.message,
          html_content: `<h3>New message from ${form.name}</h3><p><strong>Email:</strong> ${form.email}</p><p>${form.message}</p>`,
        },
        publicKey,
      );
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
      setTimeout(() => {
        setSent(false);
        setForm({ name: "", email: "", message: "" });
      }, 4000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ── HERO BANNER ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary/5 border-b border-border/40 py-14">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -14, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/8 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -14, 0], y: [0, 18, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-16 left-10 w-60 h-60 rounded-full bg-secondary/10 blur-3xl pointer-events-none"
        />

        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 180 }}
            className="inline-flex items-center gap-2 text-primary text-xs font-bold tracking-widest uppercase mb-4 bg-primary/8 px-4 py-1.5 rounded-full border border-primary/20"
          >
            <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            We'd Love to Hear from You
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 110 }}
            className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mb-4"
          >
            Get in <span className="text-primary">Touch</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base"
          >
            Have a question, feedback, or special order? Drop us a message and our team will
            respond within 24 hours.
          </motion.p>
        </div>
      </section>

      <div className="container py-14 max-w-5xl">

        {/* ── INFO CARDS ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {INFO.map((info, i) => (
            <motion.div
              key={info.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 130 }}
              whileHover={{ y: -5, scale: 1.03 }}
            >
              {info.link ? (
                <a href={info.link} target="_blank" rel="noreferrer" className="block h-full">
                  <InfoCard info={info} />
                </a>
              ) : (
                <InfoCard info={info} />
              )}
            </motion.div>
          ))}
        </div>

        {/* ── MAIN GRID: Form + Map ──────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* ── Contact Form ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <div className="bg-card border border-border/60 rounded-3xl p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-display font-bold text-lg">Send a Message</h2>
              </div>

              <AnimatePresence mode="wait">
                {sent ? (
                  /* ── Success state ── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center text-center py-10 gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 14 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center"
                    >
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </motion.div>
                    <div>
                      <h3 className="font-display font-bold text-xl mb-1">Message Sent! 🎉</h3>
                      <p className="text-muted-foreground text-sm">
                        We'll get back to you at <strong>{form.email || "your email"}</strong> shortly.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Form ── */
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {/* Name */}
                    <div>
                      <Label htmlFor="cname" className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Full Name</Label>
                      <Input
                        id="cname" required placeholder="Your full name"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                        className={`h-11 rounded-xl border-border/60 transition-colors ${focused === "name" ? "border-primary" : ""}`}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="cemail" className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5 block">Email Address</Label>
                      <div className="relative">
                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focused === "email" ? "text-primary" : "text-muted-foreground"}`} />
                        <Input
                          id="cemail" type="email" required placeholder="your@email.com"
                          value={form.email}
                          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                          onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                          className={`pl-10 h-11 rounded-xl border-border/60 transition-colors ${focused === "email" ? "border-primary" : ""}`}
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label htmlFor="cmsg" className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Message</Label>
                        <span className={`text-[10px] font-semibold ${charsLeft < 50 ? "text-destructive" : "text-muted-foreground"}`}>
                          {charsLeft} left
                        </span>
                      </div>
                      <Textarea
                        id="cmsg" required placeholder="How can we help you today?"
                        rows={5} maxLength={MAX_MSG}
                        value={form.message}
                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                        onFocus={() => setFocused("msg")} onBlur={() => setFocused(null)}
                        className={`rounded-xl border-border/60 resize-none transition-colors ${focused === "msg" ? "border-primary" : ""}`}
                      />
                      {/* Progress bar */}
                      <div className="h-0.5 rounded-full bg-border/40 mt-1.5 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${charsLeft < 50 ? "bg-destructive" : "bg-primary"}`}
                          animate={{ width: `${(form.message.length / MAX_MSG) * 100}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl font-bold gap-2 relative overflow-hidden shadow-md shadow-primary/20"
                      >
                        <motion.span
                          className="absolute inset-0 bg-white/15 skew-x-[-15deg]"
                          initial={{ x: "-130%" }}
                          whileHover={{ x: "230%" }}
                          transition={{ duration: 0.5 }}
                        />
                        <AnimatePresence mode="wait">
                          {loading ? (
                            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                <Send className="h-4 w-4" />
                              </motion.div>
                              Sending…
                            </motion.span>
                          ) : (
                            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                              <Send className="h-4 w-4" />
                              Send Message
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Right column: quick info + map preview ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Quick links */}
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-display font-bold text-base mb-4">Quick Contact</h3>
              {[
                { icon: Phone, label: "Call Now",     href: "tel:+923219410035",             value: "0321-9410035",             color: "text-emerald-600 bg-emerald-500/10" },
                { icon: Mail,  label: "Send Email",   href: "mailto:altafcashncarry@gmail.com", value: "altafcashncarry@gmail.com", color: "text-primary bg-primary/10"         },
                { icon: MapPin,label: "Get Directions",href: "https://maps.google.com/?q=Altaf+Cash+and+Carry+Central+Park+Lahore", value: "Open in Google Maps", color: "text-blue-600 bg-blue-500/10" },
              ].map(item => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  target="_blank" rel="noreferrer"
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold">{item.label}</p>
                    <p className="text-sm font-bold truncate">{item.value}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.a>
              ))}
            </div>

            {/* Hours card */}
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="font-display font-bold text-base">Store Hours</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { day: "Monday – Friday", time: "9:00 AM – 11:30 PM" },
                  { day: "Saturday",        time: "9:00 AM – 11:30 PM" },
                  { day: "Sunday",          time: "9:00 AM – 11:30 PM" },
                ].map(row => (
                  <div key={row.day} className="flex justify-between items-center text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{row.day}</span>
                    <span className="font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Google Map ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 90, delay: 0.1 }}
          className="mt-14"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">Find Us</h2>
              <p className="text-muted-foreground text-xs">66-67 A, Block A Central Park Housing Scheme, Lahore</p>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-border/60 shadow-lg h-[420px] group">
            {/* Overlay with "Open in Maps" button */}
            <div className="absolute top-4 right-4 z-10">
              <motion.a
                href="https://maps.google.com/?q=Altaf+Cash+and+Carry+Central+Park+Lahore"
                target="_blank" rel="noreferrer"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 bg-white/90 dark:bg-background/90 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-2 rounded-xl shadow-md border border-border/40 hover:bg-white transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Open in Maps
              </motion.a>
            </div>

            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3408.48893062393!2d74.38625887437429!3d31.317867674307283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3919a9002ae8e421%3A0x45ba914277e9d4ad!2sAltaf%20Cash%20and%20Carry%20Central%20Park!5e0!3m2!1sen!2s!4v1772722418742!5m2!1sen!2s"
              width="100%"
              height="100%"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Altaf Cash and Carry Central Park"
              className="w-full h-full"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ── InfoCard sub-component ─────────────────────────────── */
const InfoCard = ({ info }: { info: typeof INFO[0] }) => (
  <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all h-full flex flex-col gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${info.color}`}>
      <info.icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">{info.label}</p>
      <p className="font-bold text-sm leading-snug">{info.value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{info.sub}</p>
    </div>
  </div>
);

export default Contact;
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import emailjs from '@emailjs/browser';
import { toast } from "sonner";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      toast.error("EmailJS credentials are not configured.");
      setLoading(false);
      return;
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          subject: "Help required",
          to_email: "altafcashncarry@gmail.com",
          from_name: name,
          from_email: email,
          message: message,
          // If you have a template expecting these fields, it will route appropriately.
          html_content: `
            <h3>New Contact Message from ${name}</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `
        },
        publicKey
      );
      toast.success("Message sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold mb-8">Contact Us</motion.h1>

    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-1" />
          <div>
            <h3 className="font-semibold">Address</h3>
            <p className="text-sm text-muted-foreground">
              Altaf Cash and Carry Central Park<br />
              66-67 A, Block A Central Park Housing Scheme, Lahore, Pakistan
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-primary mt-1" />
          <div>
            <h3 className="font-semibold">Phone</h3>
            <p className="text-sm text-muted-foreground">0321-9410035</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary mt-1" />
          <div>
            <h3 className="font-semibold">Hours</h3>
            <p className="text-sm text-muted-foreground">Mon - Sun <br /> 9:00 AM - 11:30 PM</p>
          </div>
        </div>
      </div>

      <form className="space-y-4 bg-card rounded-lg border border-border p-6" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="cname">Name</Label>
          <Input id="cname" required placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="cemail">Email</Label>
          <Input id="cemail" type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="cmsg">Message</Label>
          <Textarea id="cmsg" required placeholder="How can we help?" rows={4} value={message} onChange={e => setMessage(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </div>

    <div className="mt-16 rounded-xl overflow-hidden border border-border shadow-sm h-[450px]">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3408.48893062393!2d74.38625887437429!3d31.317867674307283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3919a9002ae8e421%3A0x45ba914277e9d4ad!2sAltaf%20Cash%20and%20Carry%20Central%20Park!5e0!3m2!1sen!2s!4v1772722418742!5m2!1sen!2s"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Altaf Cash and Carry Central Park"
      ></iframe>
    </div>
    </div>
  );
};

export default Contact;

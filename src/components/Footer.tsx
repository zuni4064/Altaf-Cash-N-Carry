import { Link } from "react-router-dom";
import { MapPin, Phone, Facebook, Instagram } from "lucide-react";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground mt-16">
    <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <img src="/logo.png" alt="Altaf Mart Cash & Carry" className="h-16 w-auto mb-4 bg-white/10 p-2 rounded-xl object-contain" />
        <p className="text-sm opacity-80">Your one-stop shop for quality groceries and household essentials in Lahore.</p>
      </div>
      <div>
        <h4 className="font-bold mb-3">Quick Links</h4>
        <div className="flex flex-col gap-2 text-sm opacity-80">
          <Link to="/" className="hover:opacity-100 transition-opacity">Home</Link>
          <Link to="/shop" className="hover:opacity-100 transition-opacity">Shop</Link>
          <Link to="/categories" className="hover:opacity-100 transition-opacity">Categories</Link>
          <Link to="/about" className="hover:opacity-100 transition-opacity">About Us</Link>
          <Link to="/contact" className="hover:opacity-100 transition-opacity">Contact</Link>
        </div>
      </div>
      <div>
        <h4 className="font-bold mb-3">Contact</h4>
        <div className="flex flex-col gap-2 text-sm opacity-80">
          <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Altaf Cash and Carry Central Park, 66-67 A, Block A, Lahore</span>
          <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> 0321-9410035 <br />0321-2410035</span>
        </div>
      </div>
      <div>
        <h4 className="font-bold mb-3">Follow Us</h4>
        <div className="flex gap-4">
          <a href="https://www.facebook.com/altafcashandcarrycentralpark/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-amber-300 transition-colors"><Facebook className="h-6 w-6" /></a>
          <a href="https://www.instagram.com/altafcashandcarrycphs/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-amber-300 transition-colors"><Instagram className="h-6 w-6" /></a>
        </div>
      </div>
    </div>
    <div className="border-t border-primary-foreground/20 py-4 text-center text-sm opacity-60">
      © {new Date().getFullYear()} Cash & Carry. All rights reserved.
    </div>
  </footer>
);

export default Footer;

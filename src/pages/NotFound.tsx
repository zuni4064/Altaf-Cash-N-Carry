import { useLocation } from "react-router-dom";
import { useEffect } from "react";
// pages/Home.tsx
import { Helmet } from 'react-helmet-async';

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Altaf Cash N Carry | Fresh Groceries in Lahore</title>
        <meta name="description" content="Shop fresh groceries, household essentials and more at Altaf Cash N Carry — Central Park Society, Lahore. Order online with home delivery." />
        <meta property="og:title" content="Altaf Cash N Carry | Fresh Groceries in Lahore" />
        <meta property="og:description" content="Your one-stop shop for quality groceries in Lahore since 2019." />
        <meta property="og:image" content="https://altaf-cash-n-carry.vercel.app/og-image.jpg" />
        <meta property="og:url" content="https://altaf-cash-n-carry.vercel.app" />
        <link rel="canonical" href="https://altaf-cash-n-carry.vercel.app" />
      </Helmet>
      {/* rest of your page */}
    </>
  );
}
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

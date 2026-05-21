import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import FairHousingNotice from "@/components/FairHousingNotice";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <Helmet>
        <title>Page Not Found (404) | Emily Russell, REALTOR®</title>
        <meta name="description" content="The page you are looking for could not be found. Return to Emily Russell's San Antonio real estate homepage to continue your search." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`https://alamocitydesigns.com${location.pathname}`} />
        <meta property="og:title" content="Page Not Found | Emily Russell, REALTOR®" />
        <meta property="og:description" content="The page you are looking for could not be found." />
        <meta property="og:url" content={`https://alamocitydesigns.com${location.pathname}`} />
      </Helmet>
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
          <p className="mb-4 text-xl text-foreground">Oops! Page not found</p>
          <Link to="/" className="text-primary underline hover:text-primary/90">
            Return to Home
          </Link>
        </div>
      </main>
      <FairHousingNotice />
    </div>
  );
};

export default NotFound;

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-xl">
                <span className="text-3xl font-bold text-primary-foreground">C</span>
              </div>
            </div>
            
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground">
                Find Medicines
                <span className="block text-primary">Near You</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Search for medicines across local pharmacies, compare prices, check availability, and reserve your medications instantly.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary-light text-primary-foreground font-medium px-8 py-3">
                  Get Started
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">How Clyra Works</h2>
          <p className="text-lg text-muted-foreground">Simple, fast, and reliable medicine search</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Search Medicines</h3>
            <p className="text-muted-foreground">
              Enter the name of any medicine and find it across local pharmacies instantly.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Compare Prices</h3>
            <p className="text-muted-foreground">
              See real-time prices and availability across different pharmacies near you.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Reserve & Pickup</h3>
            <p className="text-muted-foreground">
              Reserve your medicines online and pick them up at your convenience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

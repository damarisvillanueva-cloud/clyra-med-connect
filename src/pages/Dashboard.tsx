import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Phone, Clock, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  description: string;
  manufacturer: string;
  category: string;
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  review_count: number;
}

interface PharmacyMedicine {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  price: number;
  stock_status: string;
  quantity: number;
  pharmacies: Pharmacy;
  medicines: Medicine;
}

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PharmacyMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'distance' | 'rating'>('price');
  const [filterByStock, setFilterByStock] = useState<'all' | 'in_stock' | 'low_stock'>('all');
  const { user, signOut } = useAuth();

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      // Save search to history
      if (user) {
        await supabase
          .from('search_history')
          .insert({ user_id: user.id, medicine_name: searchTerm });
      }

      // Search for medicines and their pharmacy availability
      const { data, error } = await supabase
        .from('pharmacy_medicines')
        .select(`
          id,
          pharmacy_id,
          medicine_id,
          price,
          stock_status,
          quantity,
          pharmacies (
            id,
            name,
            address,
            phone,
            rating,
            review_count
          ),
          medicines (
            id,
            name,
            generic_name,
            description,
            manufacturer,
            category
          )
        `)
        .ilike('medicines.name', `%${searchTerm}%`);

      if (error) throw error;

      let filteredResults = data || [];

      // Apply stock filter
      if (filterByStock !== 'all') {
        filteredResults = filteredResults.filter(item => item.stock_status === filterByStock);
      }

      // Filter out items with null relationships
      filteredResults = filteredResults.filter(item => item.medicines && item.pharmacies);

      // Apply sorting
      filteredResults.sort((a, b) => {
        switch (sortBy) {
          case 'price':
            return a.price - b.price;
          case 'rating':
            return (b.pharmacies?.rating || 0) - (a.pharmacies?.rating || 0);
          case 'distance':
            // For demo, just return random order
            return Math.random() - 0.5;
          default:
            return 0;
        }
      });

      setResults(filteredResults);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search medicines',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockBadgeVariant = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'default';
      case 'low_stock':
        return 'secondary';
      case 'out_of_stock':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStockText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">C</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Clyra</h1>
                <p className="text-sm text-muted-foreground">Find medicines near you</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <Card className="mb-8 shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center">Search for Medicines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter medicine name (e.g., Paracetamol)"
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerm(value);
                    handleSearch(value);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => handleSearch(searchTerm)} disabled={loading} className="bg-primary hover:bg-primary-light">
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'price' | 'distance' | 'rating')}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                  <option value="distance">Distance</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Stock:</span>
                <select
                  value={filterByStock}
                  onChange={(e) => setFilterByStock(e.target.value as 'all' | 'in_stock' | 'low_stock')}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="all">All</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Found {results.length} results for "{searchTerm}"
            </h2>
            
            <div className="grid gap-4">
              {results.map((item) => (
                <Card key={item.id} className="shadow-lg border-0 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {item.medicines?.name || 'Unknown Medicine'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {item.medicines?.generic_name || 'Unknown'} • {item.medicines?.manufacturer || 'Unknown'}
                            </p>
                          </div>
                          <div className="text-right mt-2 sm:mt-0">
                            <div className="text-2xl font-bold text-primary">
                              ${item.price.toFixed(2)}
                            </div>
                            <Badge variant={getStockBadgeVariant(item.stock_status)}>
                              {getStockText(item.stock_status)}
                            </Badge>
                          </div>
                        </div>

                          <div className="border-t pt-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">{item.pharmacies?.name || 'Unknown Pharmacy'}</h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {item.pharmacies?.address || 'Unknown address'}
                                  </div>
                                  <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-1" />
                                    {item.pharmacies?.phone || 'No phone'}
                                  </div>
                                </div>
                                <div className="flex items-center mt-2">
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="ml-1 text-sm font-medium">
                                      {item.pharmacies?.rating || 0}
                                    </span>
                                    <span className="ml-1 text-sm text-muted-foreground">
                                      ({item.pharmacies?.review_count || 0} reviews)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            <div className="ml-4">
                              <Link to={`/pharmacy/${item.pharmacy_id}?medicine=${item.medicine_id}`}>
                                <Button 
                                  className="bg-primary hover:bg-primary-light"
                                  disabled={item.stock_status === 'out_of_stock'}
                                >
                                  {item.stock_status === 'out_of_stock' ? 'Out of Stock' : 'View Details'}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && searchTerm && !loading && (
          <Card className="text-center py-12 shadow-lg border-0 bg-card/80 backdrop-blur-sm">
            <CardContent>
              <p className="text-muted-foreground">No medicines found for "{searchTerm}"</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try searching for common medicines like "Paracetamol" or "Ibuprofeno"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
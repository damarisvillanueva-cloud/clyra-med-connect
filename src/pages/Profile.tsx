import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

interface SearchHistory {
  id: string;
  medicine_name: string;
  created_at: string;
}

interface Reservation {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  medicines: {
    name: string;
  };
  pharmacies: {
    name: string;
    address: string;
  };
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadSearchHistory();
      loadReservations();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSearchHistory(data || []);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const loadReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          quantity,
          total_price,
          status,
          created_at,
          medicines (name),
          pharmacies (name, address)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'cancelled':
        return 'text-destructive';
      case 'completed':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your account and view history</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile?.full_name || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || user?.email || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile?.phone || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary-light"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Search History */}
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchHistory.length > 0 ? (
                <div className="space-y-3">
                  {searchHistory.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="font-medium">{search.medicine_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(search.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No search history yet. Start searching for medicines!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reservations */}
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Reservation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservations.length > 0 ? (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border rounded-lg p-4 bg-muted/20"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{reservation.medicines.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {reservation.pharmacies.name} • {reservation.pharmacies.address}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Quantity: {reservation.quantity} • Total: ${reservation.total_price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium capitalize ${getStatusColor(reservation.status)}`}>
                            {reservation.status}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {new Date(reservation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No reservations yet. Reserve medicines from nearby pharmacies!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
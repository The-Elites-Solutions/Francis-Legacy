import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Redirect if already logged in
  if (user && !mustChangePassword) {
    const redirectTo = user.role === 'admin' ? '/admin' : '/';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMustChangePassword(false);

    try {
      const result = await login(username, password);
      if (result?.user?.mustChangePassword) {
        setMustChangePassword(true);
        setError('You must change your password before continuing.');
      }
      // Navigation will be handled by the redirect logic above
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('francis_legacy_user');
    localStorage.removeItem('francis_legacy_token');
    // Clear any session cookies
    document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 gold-texture rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Francis Legacy
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your family history
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Family Member Login</CardTitle>
            <CardDescription>
              Enter your username/email and password to access Francis Legacy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant={mustChangePassword ? "default" : "destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {mustChangePassword && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This is your first login or your password has been reset. 
                    Please contact an administrator to change your password.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username or Email</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your.username or email@example.com"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
                <p className="text-xs text-gray-500">
                  Enter your username (e.g., firstname.lastname) or email address
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {mustChangePassword && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Need help?</strong> Contact your family administrator to:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                  <li>Get your username if you don't know it</li>
                  <li>Reset your password</li>
                  <li>Get assistance with first-time login</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help with your account?{' '}
            <span className="text-yellow-600">Contact your family administrator</span>
          </p>
        </div>

        {/* Development Note */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-sm text-blue-800">
                <strong>Development Mode:</strong>
                <br />
                Use generated usernames like: john.smith, mary.johnson, etc.
                <br />
                Check the console for sample credentials.
                <br />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAuthData}
                  className="mt-2"
                >
                  Clear Auth Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Login;
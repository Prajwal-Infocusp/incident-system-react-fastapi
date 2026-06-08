import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { googleLogin, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id-here.apps.googleusercontent.com';

    const handleCredentialResponse = async (response: any) => {
      setLoading(true);
      setError('');
      try {
        await googleLogin(response.credential);
        navigate('/');
      } catch (err: any) {
        setError(err.message || 'Failed to authenticate with Google');
        setLoading(false);
      }
    };

    // Poll until window.google is loaded (since script is loaded async)
    const checkGoogleScript = setInterval(() => {
      if ((window as any).google) {
        clearInterval(checkGoogleScript);
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: '320',
            text: 'signin_with',
            shape: 'rectangular'
          }
        );
      }
    }, 100);

    return () => clearInterval(checkGoogleScript);
  }, [googleLogin, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 px-4 text-foreground transition-colors duration-300">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertTriangle className="h-10 w-10 text-orange-600" />
          <span className="text-3xl font-extrabold text-orange-600 tracking-tight">Infocusp IncidentHub</span>
        </div>
        <p className="text-muted-foreground text-sm">Centralized operations incident manager</p>
      </div>
      
      <Card className="w-full max-w-md shadow-xl border border-muted/50 bg-card/80 backdrop-blur-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Sign in</CardTitle>
          <CardDescription>
            Access your IncidentHub dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col pt-2 pb-8">
          {error && (
            <Alert variant="destructive" className="w-full mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm font-medium text-muted-foreground">Authenticating session...</span>
            </div>
          )}

          <div className={loading ? "hidden" : "space-y-6"}>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign in with Email
              </Button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t w-full absolute border-muted-foreground/20"></div>
              <span className="bg-card px-3 text-xs text-muted-foreground relative z-10 font-medium uppercase">
                Or continue with
              </span>
            </div>

            <div className="flex flex-col items-center w-full">
              <div id="google-signin-button" className="min-h-[44px]" />
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-semibold dark:text-blue-400">
                Register here
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
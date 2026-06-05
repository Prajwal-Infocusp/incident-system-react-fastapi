import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();
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
          document.getElementById('google-signup-button'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: '320',
            text: 'signup_with',
            shape: 'rectangular'
          }
        );
      }
    }, 100);

    return () => clearInterval(checkGoogleScript);
  }, [googleLogin, navigate]);

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
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>
            Register your profile using your corporate Google account to begin tracking incidents
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-2 pb-8">
          {error && (
            <Alert variant="destructive" className="w-full mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm font-medium text-muted-foreground">Creating your account...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full py-4">
              <div id="google-signup-button" className="min-h-[44px]" />
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, ExternalLink, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';

export default function ShortLinkRedirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState('');

  // Prevent double execution in React StrictMode
  const hasChecked = useRef(false);

  const backendUrl = import.meta.env.VITE_API_URL || 'https://localhost:34049';

  useEffect(() => {
    if (shortCode && !hasChecked.current) {
      hasChecked.current = true;
      checkLink();
    }
  }, [shortCode]);

  const checkLink = async () => {
    try {
      // Use HEAD request to check link status WITHOUT incrementing views
      const response = await fetch(`${backendUrl}/${shortCode}`, {
        method: 'HEAD',
      });

      // 200 OK = link is valid and not password-protected, redirect immediately
      if (response.ok) {
        window.location.href = `${backendUrl}/${shortCode}`;
        return;
      }

      // 401 Unauthorized = password required
      if (response.status === 401) {
        setRequiresPassword(true);
        setIsLoading(false);
        return;
      }

      // 410 Gone = link expired
      if (response.status === 410) {
        // Need to make GET request to get the error message
        const getResponse = await fetch(`${backendUrl}/${shortCode}`, {
          method: 'GET',
          redirect: 'manual',
        });
        const data = await getResponse.json();
        setLinkExpired(true);
        setExpiredMessage(data.message || 'This link has expired.');
        setIsLoading(false);
        return;
      }

      // 404 Not Found = link doesn't exist
      if (response.status === 404) {
        setLinkExpired(true);
        setExpiredMessage('This link does not exist or has been deleted.');
        setIsLoading(false);
        return;
      }

      // For any other case, try to redirect anyway
      window.location.href = `${backendUrl}/${shortCode}`;
    } catch (err) {
      console.error('Error checking link:', err);
      // If fetch fails, try direct redirect anyway
      window.location.href = `${backendUrl}/${shortCode}`;
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    console.log('[Password Submit] Starting submission...');
    console.log('[Password Submit] Password length:', password.length);
    console.log('[Password Submit] Password value:', password);
    console.log('[Password Submit] ShortCode:', shortCode);

    try {
      // Trim whitespace from password
      const trimmedPassword = password.trim();
      console.log('[Password Submit] Trimmed password length:', trimmedPassword.length);

      const formData = new FormData();
      formData.append('password', trimmedPassword);

      console.log('[Password Submit] FormData created, posting to:', `${backendUrl}/${shortCode}/password`);

      const response = await fetch(`${backendUrl}/${shortCode}/password`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for session
        redirect: 'manual', // We'll handle the redirect ourselves
      });

      console.log('[Password Submit] Response status:', response.status);
      console.log('[Password Submit] Response type:', response.type);

      if (response.status === 302 || response.type === 'opaqueredirect') {
        console.log('[Password Submit] Password accepted, redirecting to backend...');
        // Password accepted, redirect to the link
        // The session cookie will now be sent with this request
        window.location.href = `${backendUrl}/${shortCode}`;
        return;
      }

      if (response.status === 401) {
        const data = await response.json();
        setError(data.message || 'Invalid password');
        setIsSubmitting(false);
        return;
      }

      // For other responses, try to parse and show error
      const data = await response.json();
      setError(data.message || 'An error occurred');
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error submitting password:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking link...</p>
        </div>
      </div>
    );
  }

  // Link expired state
  if (linkExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
              <p className="text-gray-600 mb-6">{expiredMessage}</p>
              <Button onClick={() => window.location.href = '/'}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password required state
  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Lock className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Password Protected</h2>
                <p className="text-sm text-gray-600">This link requires a password to access</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isSubmitting}
                  disabled={!password}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Access Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  Cancel
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Don't have the password? Contact the person who shared this link with you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback - shouldn't reach here
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

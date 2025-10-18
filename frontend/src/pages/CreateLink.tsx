import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Link as LinkIcon,
  Calendar,
  Eye,
  Lock,
  MessageSquare,
  Copy,
  ExternalLink,
  CheckCircle2,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { CreateLinkRequest, Link as LinkType } from '@/types';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { copyToClipboard } from '@/lib/utils';
import Navigation from '@/components/Navigation';

type ExpiryType = 'TIME' | 'VIEWS' | 'BOTH' | 'NONE';

export default function CreateLink() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [expiryType, setExpiryType] = useState<ExpiryType>('TIME');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [password, setPassword] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [createdLink, setCreatedLink] = useState<LinkType | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Generate QR code when link is created
  useEffect(() => {
    if (createdLink && showSuccessModal) {
      const fullUrl = `${window.location.origin}/${createdLink.shortCode}`;
      QRCode.toDataURL(fullUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#4F46E5', // indigo-600
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR code generation failed:', err));
    }
  }, [createdLink, showSuccessModal]);

  // URL validation
  const isValidUrl = (urlString: string) => {
    try {
      // Check if URL has proper protocol format (http:// or https://)
      if (!urlString.match(/^https?:\/\/.+/)) {
        return false;
      }

      const urlObj = new URL(urlString);

      // Ensure protocol is http or https
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return false;
      }

      // Ensure there's a valid hostname
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Create link mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateLinkRequest) => api.createLink(data),
    onSuccess: (link: LinkType) => {
      setCreatedLink(link);
      setShowSuccessModal(true);
      // Reset form
      setUrl('');
      setTitle('');
      setExpiryType('TIME');
      setExpiresAt('');
      setMaxViews('');
      setPassword('');
      setCustomMessage('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create link';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      toast.error('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    if ((expiryType === 'TIME' || expiryType === 'BOTH') && !expiresAt) {
      toast.error('Please select an expiration date');
      return;
    }

    // Validate expiry date is not too far in future (max 1 year)
    if ((expiryType === 'TIME' || expiryType === 'BOTH') && expiresAt) {
      const selectedDate = new Date(expiresAt);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      if (selectedDate > oneYearFromNow) {
        toast.error('Expiration date cannot be more than 1 year in the future');
        return;
      }
    }

    if ((expiryType === 'VIEWS' || expiryType === 'BOTH') && !maxViews) {
      toast.error('Please enter maximum views');
      return;
    }

    // Validate max views range
    if ((expiryType === 'VIEWS' || expiryType === 'BOTH') && maxViews) {
      const views = parseInt(maxViews);
      if (views < 1) {
        toast.error('Maximum views must be at least 1');
        return;
      }
      if (views > 1000000) {
        toast.error('Maximum views cannot exceed 1,000,000');
        return;
      }
    }

    // Validate password strength
    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Validate custom message
    if (customMessage && customMessage.trim().length < 10) {
      toast.error('Custom message must be at least 10 characters');
      return;
    }

    const data: CreateLinkRequest = {
      originalUrl: url,
      title: title.trim() || undefined,
      expiryType,
      expiresAt: (expiryType === 'TIME' || expiryType === 'BOTH') ? new Date(expiresAt).toISOString() : undefined,
      maxViews: (expiryType === 'VIEWS' || expiryType === 'BOTH') ? parseInt(maxViews) : undefined,
      password: password.trim() || undefined,
      customMessage: customMessage.trim() || undefined,
    };

    createMutation.mutate(data);
  };

  const handleCopyLink = () => {
    if (createdLink) {
      const fullUrl = `${window.location.origin}/${createdLink.shortCode}`;
      copyToClipboard(fullUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleViewDashboard = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    setCreatedLink(null);
  };

  const handleBackToDashboard = () => {
    // Invalidate all queries to fetch fresh data
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    queryClient.invalidateQueries({ queryKey: ['links'] });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Link</h1>
            <p className="text-gray-600">
              Create a shortened link with expiration options and track its performance.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">Link Details</h2>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Original URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original URL *
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://example.com/your-long-url"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            url && !isValidUrl(url) ? 'border-red-300' : 'border-gray-300'
                          }`}
                          required
                        />
                      </div>
                      {url && !isValidUrl(url) && (
                        <p className="mt-1 text-sm text-red-600">
                          Please enter a valid URL starting with http:// or https://
                        </p>
                      )}
                    </div>

                    {/* Title/Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Summer Sale Campaign, Product Launch Link"
                        maxLength={255}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Give your link a memorable name for easy identification ({title.length}/255)
                      </p>
                    </div>

                    {/* Expiry Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Expiration Type *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'TIME', label: 'Time-Based', icon: Calendar, desc: 'Expires after a date' },
                          { value: 'VIEWS', label: 'View-Based', icon: Eye, desc: 'Expires after views' },
                          { value: 'BOTH', label: 'Both', icon: Calendar, desc: 'Whichever comes first' },
                          { value: 'NONE', label: 'No Expiry', icon: CheckCircle2, desc: 'Never expires' },
                        ].map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setExpiryType(type.value as ExpiryType)}
                              className={`p-4 border-2 rounded-lg text-left transition-all ${
                                expiryType === type.value
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Icon
                                  className={`h-5 w-5 flex-shrink-0 ${
                                    expiryType === type.value ? 'text-indigo-600' : 'text-gray-400'
                                  }`}
                                />
                                <div>
                                  <div
                                    className={`font-medium ${
                                      expiryType === type.value ? 'text-indigo-900' : 'text-gray-900'
                                    }`}
                                  >
                                    {type.label}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expiry Date (if TIME or BOTH) */}
                    {(expiryType === 'TIME' || expiryType === 'BOTH') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiration Date *
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="date"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            min={getMinDate()}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Max Views (if VIEWS or BOTH) */}
                    {(expiryType === 'VIEWS' || expiryType === 'BOTH') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Views *
                        </label>
                        <div className="relative">
                          <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="number"
                            value={maxViews}
                            onChange={(e) => setMaxViews(e.target.value)}
                            placeholder="e.g., 100"
                            min="1"
                            max="1000000"
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              maxViews && (parseInt(maxViews) < 1 || parseInt(maxViews) > 1000000)
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}
                            required
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Between 1 and 1,000,000 views
                        </p>
                        {maxViews && parseInt(maxViews) > 1000000 && (
                          <p className="mt-1 text-sm text-red-600">
                            Maximum views cannot exceed 1,000,000
                          </p>
                        )}
                      </div>
                    )}

                    {/* Password Protection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Protection (Optional)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Leave empty for no password"
                          minLength={6}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            password && password.length < 6 ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {password && password.length < 6
                          ? 'Password must be at least 6 characters'
                          : 'Visitors will need this password to access the link'}
                      </p>
                    </div>

                    {/* Custom Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Expiry Message (Optional)
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <textarea
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="e.g., This offer has expired. Please contact us for new deals."
                          rows={3}
                          minLength={10}
                          maxLength={500}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            customMessage && customMessage.trim().length > 0 && customMessage.trim().length < 10
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <p className={`mt-1 text-sm ${
                        customMessage && customMessage.trim().length > 0 && customMessage.trim().length < 10
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {customMessage && customMessage.trim().length > 0 && customMessage.trim().length < 10
                          ? `Message too short (${customMessage.length}/10 minimum)`
                          : `Shown when the link has expired (${customMessage.length}/500)`}
                      </p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center gap-3 pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        isLoading={createMutation.isPending}
                        disabled={!url || !isValidUrl(url)}
                      >
                        Create Link
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => navigate('/dashboard')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Link Name */}
                    {title && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">LINK NAME</p>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-900">{title}</p>
                        </div>
                      </div>
                    )}

                    {/* URL Preview */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">SHORT URL</p>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <code className="text-sm font-mono text-indigo-600 flex-1 truncate">
                          {window.location.origin}/abc123
                        </code>
                        <Copy className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Original URL */}
                    {url && isValidUrl(url) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">REDIRECTS TO</p>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-700 flex-1 truncate">{url}</span>
                          <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                      </div>
                    )}

                    {/* Expiry Info */}
                    {expiryType !== 'NONE' && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">EXPIRES</p>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          {expiryType === 'TIME' && expiresAt && (
                            <p className="text-sm text-gray-700">
                              On {new Date(expiresAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                          {expiryType === 'VIEWS' && maxViews && (
                            <p className="text-sm text-gray-700">After {maxViews} views</p>
                          )}
                          {expiryType === 'BOTH' && (
                            <div className="text-sm text-gray-700 space-y-1">
                              {expiresAt && (
                                <p>
                                  {new Date(expiresAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                              )}
                              {maxViews && <p>or {maxViews} views</p>}
                              <p className="text-xs text-gray-500">(whichever comes first)</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Password Protection */}
                    {password && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">PROTECTION</p>
                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <Lock className="h-4 w-4 text-amber-600" />
                          <span className="text-sm text-amber-900">Password Protected</span>
                        </div>
                      </div>
                    )}

                    {/* Custom Message */}
                    {customMessage && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">EXPIRY MESSAGE</p>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700 italic">{customMessage}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {createdLink && (
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Link Created Successfully!"
          size="lg"
        >
          <div className="space-y-6">
            {/* Success Message */}
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <p className="text-green-900">
                Your link has been created and is ready to share!
              </p>
            </div>

            {/* Short URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Short URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/${createdLink.shortCode}`}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <Button onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            {/* Link Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-lg font-semibold text-green-600">Active</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Current Views</p>
                <p className="text-lg font-semibold text-gray-900">
                  {createdLink.currentViews}
                  {createdLink.maxViews && ` / ${createdLink.maxViews}`}
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code
              </label>
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                {qrCodeUrl ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-48 h-48 rounded-lg border-4 border-white shadow-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `qrcode-${createdLink.shortCode}.png`;
                        link.href = qrCodeUrl;
                        link.click();
                        toast.success('QR code downloaded!');
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleViewDashboard} className="flex-1">
                View Dashboard
              </Button>
              <Button variant="outline" onClick={handleCreateAnother} className="flex-1">
                Create Another
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

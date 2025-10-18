import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Link as LinkIcon,
  Calendar,
  Eye,
  Lock,
  MessageSquare,
  Copy,
  ExternalLink,
  Loader2,
  Download,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { UpdateLinkRequest, Link as LinkType } from '@/types';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { copyToClipboard } from '@/lib/utils';
import Navigation from '@/components/Navigation';

type ExpiryType = 'TIME' | 'VIEWS' | 'BOTH' | 'NONE';

export default function EditLink() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [expiryType, setExpiryType] = useState<ExpiryType>('TIME');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [password, setPassword] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Fetch link details
  const { data: link, isLoading } = useQuery<LinkType>({
    queryKey: ['link', id],
    queryFn: () => api.getLink(id!),
    enabled: !!id,
  });

  // Populate form when link data loads
  useEffect(() => {
    if (link) {
      setTitle(link.title || '');
      setOriginalUrl(link.originalUrl);
      setIsActive(link.isActive);
      setExpiryType(link.expiryType);
      setExpiresAt(link.expiresAt ? link.expiresAt.split('T')[0] : '');
      setMaxViews(link.maxViews?.toString() || '');
      // Password is not returned by API for security
      setCustomMessage(link.customMessage || '');

      // Generate QR code
      const fullUrl = `${window.location.origin}/${link.shortCode}`;
      QRCode.toDataURL(fullUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#4F46E5',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR code generation failed:', err));
    }
  }, [link]);

  // Update link mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateLinkRequest) => api.updateLink(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      queryClient.invalidateQueries({ queryKey: ['link', id] });
      toast.success('Link updated successfully!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update link';
      toast.error(message);
    },
  });

  // Get minimum date (today)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!originalUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    if ((expiryType === 'TIME' || expiryType === 'BOTH') && !expiresAt) {
      toast.error('Please select an expiration date');
      return;
    }

    if ((expiryType === 'VIEWS' || expiryType === 'BOTH') && !maxViews) {
      toast.error('Please enter maximum views');
      return;
    }

    const data: UpdateLinkRequest = {
      title: title.trim() || undefined,
      originalUrl: originalUrl.trim(),
      isActive,
      expiryType,
      expiresAt: (expiryType === 'TIME' || expiryType === 'BOTH') ? new Date(expiresAt).toISOString() : undefined,
      maxViews: (expiryType === 'VIEWS' || expiryType === 'BOTH') ? parseInt(maxViews) : undefined,
      password: password.trim() || undefined,
      customMessage: customMessage.trim() || undefined,
    };

    updateMutation.mutate(data);
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl && link) {
      const a = document.createElement('a');
      a.href = qrCodeUrl;
      a.download = `qrcode-${link.shortCode}.png`;
      a.click();
      toast.success('QR code downloaded!');
    }
  };

  const handleCopyLink = () => {
    if (link) {
      const fullUrl = `${window.location.origin}/${link.shortCode}`;
      copyToClipboard(fullUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleBackToDashboard = () => {
    // Invalidate all queries to fetch fresh data
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    queryClient.invalidateQueries({ queryKey: ['links'] });
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-gray-600">Loading link...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Link not found</p>
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!isActive) {
      return <Badge variant="danger">Inactive</Badge>;
    }
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return <Badge variant="danger">Expired</Badge>;
    }
    if (link.maxViews && link.currentViews >= link.maxViews) {
      return <Badge variant="danger">Limit Reached</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
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
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Link</h1>
                <div className="flex items-center gap-3">
                  <code className="text-lg font-mono text-indigo-600">/{link.shortCode}</code>
                  <button
                    onClick={handleCopyLink}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy link"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  {getStatusBadge()}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {link.currentViews}
                  {link.maxViews && ` / ${link.maxViews}`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <ExternalLink className="h-4 w-4" />
              <a
                href={link.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 truncate max-w-xl"
              >
                {link.originalUrl}
              </a>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">Link Settings</h2>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Link Name/Title */}
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

                    {/* Original URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original URL *
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          value={originalUrl}
                          onChange={(e) => setOriginalUrl(e.target.value)}
                          placeholder="https://example.com/your-long-url"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        The destination URL where visitors will be redirected
                      </p>
                    </div>

                    <div className="border-t border-gray-200" />

                    {/* Active Status */}
                    <div>
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Link Status</span>
                          <p className="text-sm text-gray-500">
                            Inactive links will not redirect visitors
                          </p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </div>
                      </label>
                    </div>

                    <div className="border-t border-gray-200" />

                    {/* Expiry Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Expiration Type *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'TIME', label: 'Time-Based', icon: Calendar },
                          { value: 'VIEWS', label: 'View-Based', icon: Eye },
                          { value: 'BOTH', label: 'Both', icon: Calendar },
                          { value: 'NONE', label: 'No Expiry', icon: LinkIcon },
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
                              <div className="flex items-center gap-3">
                                <Icon
                                  className={`h-5 w-5 ${
                                    expiryType === type.value ? 'text-indigo-600' : 'text-gray-400'
                                  }`}
                                />
                                <span
                                  className={`font-medium ${
                                    expiryType === type.value ? 'text-indigo-900' : 'text-gray-900'
                                  }`}
                                >
                                  {type.label}
                                </span>
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
                            min={link.currentViews + 1}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Current views: {link.currentViews}. Must be greater than current views.
                        </p>
                      </div>
                    )}

                    {/* Password Protection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Protection
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter new password or leave empty"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {link.passwordHash
                          ? 'Link is currently password protected. Enter a new password to change it, or leave empty to keep existing.'
                          : 'Link is not password protected. Enter a password to add protection.'}
                      </p>
                    </div>

                    {/* Custom Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Expiry Message
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <textarea
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Message shown when link expires"
                          rows={3}
                          maxLength={500}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {customMessage.length}/500 characters
                      </p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center gap-3 pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        isLoading={updateMutation.isPending}
                      >
                        Save Changes
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

            {/* Info Panel */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Link Info</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Short URL */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">SHORT URL</p>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <code className="text-sm font-mono text-indigo-600 flex-1 truncate">
                          /{link.shortCode}
                        </code>
                        <button onClick={handleCopyLink}>
                          <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">STATISTICS</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Views</span>
                          <span className="font-semibold text-gray-900">{link.currentViews}</span>
                        </div>
                        {link.maxViews && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Remaining</span>
                            <span className="font-semibold text-gray-900">
                              {Math.max(0, link.maxViews - link.currentViews)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Created Date */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">CREATED</p>
                      <p className="text-sm text-gray-700">
                        {new Date(link.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* QR Code */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-3">QR CODE</p>
                      {qrCodeUrl ? (
                        <div className="flex flex-col items-center gap-3">
                          <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="w-full rounded-lg border-4 border-white shadow-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleDownloadQR}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download QR Code
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/links/${link.id}/analytics`)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

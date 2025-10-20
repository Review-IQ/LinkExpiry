import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Eye, Palette, Mail, Link as LinkIcon, Code, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { UpdateExpiryPageRequest } from '@/types';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Navigation from '@/components/Navigation';

export default function EditExpiryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<UpdateExpiryPageRequest>({});

  // Fetch expiry page
  const { data: expiryPage, isLoading } = useQuery({
    queryKey: ['expiryPage', id],
    queryFn: () => api.getExpiryPage(id!),
    enabled: !!id,
  });

  // Initialize form data when expiry page loads
  useEffect(() => {
    if (expiryPage) {
      setFormData({
        name: expiryPage.name,
        title: expiryPage.title,
        message: expiryPage.message,
        logoUrl: expiryPage.logoUrl,
        backgroundColor: expiryPage.backgroundColor,
        ctaButtonText: expiryPage.ctaButtonText,
        ctaButtonUrl: expiryPage.ctaButtonUrl,
        ctaButtonColor: expiryPage.ctaButtonColor,
        socialFacebook: expiryPage.socialFacebook,
        socialTwitter: expiryPage.socialTwitter,
        socialInstagram: expiryPage.socialInstagram,
        socialLinkedin: expiryPage.socialLinkedin,
        socialWebsite: expiryPage.socialWebsite,
        customCss: expiryPage.customCss,
        enableEmailCapture: expiryPage.enableEmailCapture,
        emailCaptureText: expiryPage.emailCaptureText,
      });
    }
  }, [expiryPage]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateExpiryPageRequest) => api.updateExpiryPage(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiryPages'] });
      queryClient.invalidateQueries({ queryKey: ['expiryPage', id] });
      toast.success('Expiry page updated successfully!');
      navigate('/expiry-pages');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update expiry page';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof UpdateExpiryPageRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expiry page...</p>
        </div>
      </div>
    );
  }

  if (!expiryPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Expiry page not found</p>
          <Button onClick={() => navigate('/expiry-pages')}>Back to Expiry Pages</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/expiry-pages')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Expiry Page</h1>
                <p className="text-gray-600">{expiryPage.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form (same as CreateExpiryPage but with formData pre-filled) */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Template Name"
                    placeholder="e.g., Job Posting Expired"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    helperText="Internal name to identify this template"
                  />
                  <Input
                    label="Page Title"
                    placeholder="e.g., This Position Has Been Filled"
                    value={formData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    helperText="Main headline shown to visitors"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={4}
                      placeholder="Thank you for your interest..."
                      value={formData.message || ''}
                      onChange={(e) => handleChange('message', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Branding</h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Logo URL"
                    type="url"
                    placeholder="https://yourcompany.com/logo.png"
                    value={formData.logoUrl || ''}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                          value={formData.backgroundColor || '#f3f4f6'}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        />
                        <Input
                          value={formData.backgroundColor || '#f3f4f6'}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                          value={formData.ctaButtonColor || '#4f46e5'}
                          onChange={(e) => handleChange('ctaButtonColor', e.target.value)}
                        />
                        <Input
                          value={formData.ctaButtonColor || '#4f46e5'}
                          onChange={(e) => handleChange('ctaButtonColor', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Call to Action</h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Button Text"
                    placeholder="e.g., View Open Positions"
                    value={formData.ctaButtonText || ''}
                    onChange={(e) => handleChange('ctaButtonText', e.target.value)}
                  />
                  <Input
                    label="Button URL"
                    type="url"
                    placeholder="https://yourcompany.com/careers"
                    value={formData.ctaButtonUrl || ''}
                    onChange={(e) => handleChange('ctaButtonUrl', e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">Social Media Links</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Facebook"
                    type="url"
                    value={formData.socialFacebook || ''}
                    onChange={(e) => handleChange('socialFacebook', e.target.value)}
                  />
                  <Input
                    label="Twitter"
                    type="url"
                    value={formData.socialTwitter || ''}
                    onChange={(e) => handleChange('socialTwitter', e.target.value)}
                  />
                  <Input
                    label="Instagram"
                    type="url"
                    value={formData.socialInstagram || ''}
                    onChange={(e) => handleChange('socialInstagram', e.target.value)}
                  />
                  <Input
                    label="LinkedIn"
                    type="url"
                    value={formData.socialLinkedin || ''}
                    onChange={(e) => handleChange('socialLinkedin', e.target.value)}
                  />
                  <Input
                    label="Website"
                    type="url"
                    value={formData.socialWebsite || ''}
                    onChange={(e) => handleChange('socialWebsite', e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Email Capture */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Email Capture</h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
                      checked={formData.enableEmailCapture || false}
                      onChange={(e) => handleChange('enableEmailCapture', e.target.checked)}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Enable Email Capture</span>
                      <p className="text-sm text-gray-500">Collect visitor emails when they view this page</p>
                    </div>
                  </label>

                  {formData.enableEmailCapture && (
                    <Input
                      label="Email Capture Text"
                      placeholder="e.g., Get notified of future openings"
                      value={formData.emailCaptureText || ''}
                      onChange={(e) => handleChange('emailCaptureText', e.target.value)}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Custom CSS */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Advanced Customization</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom CSS (Optional)
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none"
                      rows={6}
                      value={formData.customCss || ''}
                      onChange={(e) => handleChange('customCss', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="lg:sticky lg:top-24 h-fit">
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
                  </CardHeader>
                  <CardContent>
                    <ExpiryPagePreview data={formData} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Reuse the same preview component
function ExpiryPagePreview({ data }: { data: any }) {
  return (
    <div
      className="rounded-lg border-2 border-dashed border-gray-300 overflow-hidden"
      style={{ backgroundColor: data.backgroundColor || '#f3f4f6' }}
    >
      <div className="p-8 text-center">
        {data.logoUrl && (
          <div className="mb-6">
            <img
              src={data.logoUrl}
              alt="Logo"
              className="h-16 mx-auto object-contain"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3ELogo%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {data.title || 'Your Page Title'}
        </h1>

        {data.message && (
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto whitespace-pre-wrap">
            {data.message}
          </p>
        )}

        {data.ctaButtonText && data.ctaButtonUrl && (
          <div className="mb-6">
            <button
              className="px-8 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: data.ctaButtonColor || '#4f46e5' }}
            >
              {data.ctaButtonText}
            </button>
          </div>
        )}

        {data.enableEmailCapture && (
          <div className="max-w-md mx-auto mb-6 p-6 bg-white/50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-3">
              {data.emailCaptureText || 'Stay updated'}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                disabled
              />
              <button className="px-6 py-2 bg-gray-800 text-white rounded-lg" disabled>
                Subscribe
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Eye, Palette, Mail, Link as LinkIcon, Code, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { CreateExpiryPageRequest } from '@/types';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Navigation from '@/components/Navigation';

export default function CreateExpiryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateExpiryPageRequest>({
    name: '',
    title: '',
    message: '',
    logoUrl: '',
    backgroundColor: '#f3f4f6',
    ctaButtonText: '',
    ctaButtonUrl: '',
    ctaButtonColor: '#4f46e5',
    socialFacebook: '',
    socialTwitter: '',
    socialInstagram: '',
    socialLinkedin: '',
    socialWebsite: '',
    customCss: '',
    enableEmailCapture: false,
    emailCaptureText: '',
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateExpiryPageRequest) => api.createExpiryPage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiryPages'] });
      toast.success('Expiry page created successfully!');
      navigate('/expiry-pages');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create expiry page';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (field: keyof CreateExpiryPageRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Create Expiry Page</h1>
                <p className="text-gray-600">Design a custom branded page for expired links</p>
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
                isLoading={createMutation.isPending}
                disabled={!formData.name || !formData.title}
              >
                <Save className="h-4 w-4 mr-2" />
                Create Page
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
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
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    helperText="Internal name to identify this template"
                  />
                  <Input
                    label="Page Title"
                    placeholder="e.g., This Position Has Been Filled"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                    helperText="Main headline shown to visitors"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={4}
                      placeholder="Thank you for your interest. We've found the perfect candidate for this position..."
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                    />
                    <p className="mt-1 text-sm text-gray-500">Detailed message for visitors</p>
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
                    value={formData.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    helperText="URL to your company logo"
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
                          value={formData.backgroundColor}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        />
                        <Input
                          placeholder="#f3f4f6"
                          value={formData.backgroundColor}
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
                          value={formData.ctaButtonColor}
                          onChange={(e) => handleChange('ctaButtonColor', e.target.value)}
                        />
                        <Input
                          placeholder="#4f46e5"
                          value={formData.ctaButtonColor}
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
                    value={formData.ctaButtonText}
                    onChange={(e) => handleChange('ctaButtonText', e.target.value)}
                    helperText="Text displayed on the button"
                  />
                  <Input
                    label="Button URL"
                    type="url"
                    placeholder="https://yourcompany.com/careers"
                    value={formData.ctaButtonUrl}
                    onChange={(e) => handleChange('ctaButtonUrl', e.target.value)}
                    helperText="Where the button should redirect"
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
                    placeholder="https://facebook.com/yourcompany"
                    value={formData.socialFacebook}
                    onChange={(e) => handleChange('socialFacebook', e.target.value)}
                  />
                  <Input
                    label="Twitter"
                    type="url"
                    placeholder="https://twitter.com/yourcompany"
                    value={formData.socialTwitter}
                    onChange={(e) => handleChange('socialTwitter', e.target.value)}
                  />
                  <Input
                    label="Instagram"
                    type="url"
                    placeholder="https://instagram.com/yourcompany"
                    value={formData.socialInstagram}
                    onChange={(e) => handleChange('socialInstagram', e.target.value)}
                  />
                  <Input
                    label="LinkedIn"
                    type="url"
                    placeholder="https://linkedin.com/company/yourcompany"
                    value={formData.socialLinkedin}
                    onChange={(e) => handleChange('socialLinkedin', e.target.value)}
                  />
                  <Input
                    label="Website"
                    type="url"
                    placeholder="https://yourcompany.com"
                    value={formData.socialWebsite}
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
                      checked={formData.enableEmailCapture}
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
                      value={formData.emailCaptureText}
                      onChange={(e) => handleChange('emailCaptureText', e.target.value)}
                      helperText="Text shown above the email input"
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
                      placeholder=".custom-title { font-size: 2rem; }"
                      value={formData.customCss}
                      onChange={(e) => handleChange('customCss', e.target.value)}
                    />
                    <p className="mt-1 text-sm text-gray-500">Add custom CSS for advanced styling</p>
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
                    <p className="text-sm text-gray-600">How visitors will see your expiry page</p>
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

// Preview Component
function ExpiryPagePreview({ data }: { data: CreateExpiryPageRequest }) {
  return (
    <div
      className="rounded-lg border-2 border-dashed border-gray-300 overflow-hidden"
      style={{ backgroundColor: data.backgroundColor }}
    >
      <div className="p-8 text-center">
        {/* Logo */}
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

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {data.title || 'Your Page Title'}
        </h1>

        {/* Message */}
        {data.message && (
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto whitespace-pre-wrap">
            {data.message}
          </p>
        )}

        {/* CTA Button */}
        {data.ctaButtonText && data.ctaButtonUrl && (
          <div className="mb-6">
            <button
              className="px-8 py-3 rounded-lg font-semibold text-white transition-all"
              style={{ backgroundColor: data.ctaButtonColor }}
            >
              {data.ctaButtonText}
            </button>
          </div>
        )}

        {/* Email Capture */}
        {data.enableEmailCapture && (
          <div className="max-w-md mx-auto mb-6 p-6 bg-white/50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-3">
              {data.emailCaptureText || 'Stay updated'}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled
              />
              <button
                className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium"
                disabled
              >
                Subscribe
              </button>
            </div>
          </div>
        )}

        {/* Social Media Links */}
        {(data.socialFacebook || data.socialTwitter || data.socialInstagram || data.socialLinkedin || data.socialWebsite) && (
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-300">
            {data.socialFacebook && (
              <a href="#" className="text-gray-600 hover:text-gray-900" onClick={(e) => e.preventDefault()}>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
            {data.socialTwitter && (
              <a href="#" className="text-gray-600 hover:text-gray-900" onClick={(e) => e.preventDefault()}>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            )}
            {data.socialInstagram && (
              <a href="#" className="text-gray-600 hover:text-gray-900" onClick={(e) => e.preventDefault()}>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
            )}
            {data.socialLinkedin && (
              <a href="#" className="text-gray-600 hover:text-gray-900" onClick={(e) => e.preventDefault()}>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            )}
            {data.socialWebsite && (
              <a href="#" className="text-gray-600 hover:text-gray-900" onClick={(e) => e.preventDefault()}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Custom CSS Preview Note */}
      {data.customCss && (
        <div className="bg-amber-50 border-t border-amber-200 p-3 text-center">
          <p className="text-xs text-amber-800">
            ⚠️ Custom CSS will be applied when the page is rendered
          </p>
        </div>
      )}
    </div>
  );
}

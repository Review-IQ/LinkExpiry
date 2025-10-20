import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Download, Calendar, Globe } from 'lucide-react';
import { api } from '@/services/api';
import type { ExpiryPageEmail } from '@/types';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import Navigation from '@/components/Navigation';

export default function ViewCapturedEmails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch expiry page
  const { data: expiryPage, isLoading: pageLoading } = useQuery({
    queryKey: ['expiryPage', id],
    queryFn: () => api.getExpiryPage(id!),
    enabled: !!id,
  });

  // Fetch captured emails
  const { data: emails, isLoading: emailsLoading } = useQuery<ExpiryPageEmail[]>({
    queryKey: ['expiryPageEmails', id],
    queryFn: () => api.getExpiryPageEmails(id!),
    enabled: !!id,
  });

  const handleExportCSV = () => {
    if (!emails || emails.length === 0) {
      return;
    }

    // Create CSV content
    const headers = ['Email', 'Captured At', 'User Agent'];
    const rows = emails.map((email) => [
      email.email,
      new Date(email.capturedAt).toLocaleString(),
      email.userAgent || 'Unknown',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expiry-page-emails-${expiryPage?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (pageLoading || emailsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading captured emails...</p>
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
        <div className="max-w-6xl mx-auto">
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
                <h1 className="text-3xl font-bold text-gray-900">Captured Emails</h1>
                <p className="text-gray-600">{expiryPage.name}</p>
              </div>
            </div>
            {emails && emails.length > 0 && (
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Emails</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {emails?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Mail className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Links Using</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {expiryPage.linksUsingCount}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Globe className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Latest Capture</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {emails && emails.length > 0
                        ? formatDate(emails[0].capturedAt)
                        : 'No captures'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emails List */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                Email Addresses ({emails?.length || 0})
              </h2>
            </CardHeader>

            <CardContent className="p-0">
              {!emails || emails.length === 0 ? (
                <div className="p-12 text-center">
                  <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No emails captured yet
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Emails will appear here when visitors submit their email on the expiry page.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="md:hidden divide-y divide-gray-200">
                    {emails.map((email) => (
                      <div key={email.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {email.email}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(email.capturedAt)}</span>
                          </div>
                          {email.userAgent && (
                            <div className="truncate">{email.userAgent}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email Address
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Captured At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User Agent
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {emails.map((email) => (
                          <tr key={email.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {email.email}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(email.capturedAt)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                              {email.userAgent || 'Unknown'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

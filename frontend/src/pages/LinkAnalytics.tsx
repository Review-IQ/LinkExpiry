import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Copy,
  Calendar,
  Eye,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { LinkAnalytics as LinkAnalyticsType, Link as LinkType } from '@/types';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { copyToClipboard, formatDate } from '@/lib/utils';
import Navigation from '@/components/Navigation';

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function LinkAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState(30); // days

  // Fetch link details
  const { data: link, isLoading: linkLoading } = useQuery<LinkType>({
    queryKey: ['link', id],
    queryFn: () => api.getLink(id!),
    enabled: !!id,
  });

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery<LinkAnalyticsType>({
    queryKey: ['linkAnalytics', id, dateRange],
    queryFn: () => api.getLinkAnalytics(id!, dateRange),
    enabled: !!id,
  });

  const handleCopyLink = () => {
    if (link) {
      const fullUrl = `${window.location.origin}/${link.shortCode}`;
      copyToClipboard(fullUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleExportCSV = () => {
    if (!analytics) return;

    // Create CSV content
    const headers = ['Date', 'Clicks', 'Unique Visitors'];
    const rows = analytics.clicksByDate.map((item) => [
      item.date,
      item.count,
      item.uniqueVisitors || 0,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${link?.shortCode}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Analytics exported to CSV!');
  };

  const handleBackToDashboard = () => {
    // Invalidate all queries to fetch fresh data
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    queryClient.invalidateQueries({ queryKey: ['links'] });
    navigate('/dashboard');
  };

  const getDeviceIcon = (device: string) => {
    const lower = device.toLowerCase();
    if (lower.includes('mobile')) return Smartphone;
    if (lower.includes('tablet')) return Tablet;
    return Monitor;
  };

  const getStatusBadge = (link: LinkType) => {
    if (!link.isActive) {
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

  if (linkLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!link || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-gray-600">Link not found</p>
              <Button className="mt-4" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {link.title || 'Link Analytics'}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-lg font-mono text-indigo-600">/{link.shortCode}</code>
                  <button
                    onClick={handleCopyLink}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy link"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  {getStatusBadge(link)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['link', id] });
                    queryClient.invalidateQueries({ queryKey: ['linkAnalytics', id, dateRange] });
                    toast.success('Analytics refreshed!');
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Original URL */}
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-sm">Redirects to:</span>
              <a
                href={link.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 truncate max-w-xl"
              >
                {link.originalUrl}
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Clicks</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalClicks}</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Eye className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Unique Visitors</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.uniqueVisitors}</p>
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
                    <p className="text-sm text-gray-600 mb-1">Created</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(link.createdAt)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Views Remaining</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {link.maxViews
                        ? Math.max(0, link.maxViews - link.currentViews)
                        : '∞'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Clicks Over Time */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Clicks Over Time</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.clicksByDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      name="Clicks"
                      dot={{ fill: '#4F46E5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">
                  Geographic Distribution
                </h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.clicksByCountry}
                      dataKey="count"
                      nameKey="countryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ countryName, percentage }) =>
                        `${countryName} (${percentage.toFixed(1)}%)`
                      }
                    >
                      {analytics.clicksByCountry.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Device Breakdown</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.clicksByDevice}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="deviceType" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#06B6D4" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Browser Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Browser Stats</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.clicksByBrowser}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="browser" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#10B981" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Clicks Table */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Recent Clicks</h3>
            </CardHeader>
            <CardContent className="p-0">
              {analytics.recentClicks && analytics.recentClicks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Device
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Browser
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Referrer
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.recentClicks.map((click, idx) => {
                        const DeviceIcon = getDeviceIcon((click.device || click.deviceType || "Unknown"));
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(click.clickedAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {click.city && click.region
                                    ? `${click.city}, ${click.region}`
                                    : click.city || click.region || (click.country || click.countryName)}
                                </span>
                                {(click.city || click.region) && (
                                  <span className="text-xs text-gray-500">
                                    {click.country || click.countryName}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <DeviceIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-900">{click.device || click.deviceType}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {click.browser}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {click.referrer || 'Direct'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-600">
                  No clicks yet. Share your link to start tracking analytics!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Plus,
  ExternalLink,
  BarChart3,
  Copy,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Link as LinkIcon,
  TrendingUp,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import type { DashboardStats, Link as LinkType, PaginatedLinksResponse } from '@/types';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';
import { copyToClipboard, formatDate } from '@/lib/utils';
import Navigation from '@/components/Navigation';

type SortField = 'title' | 'createdAt' | 'currentViews' | 'status';
type SortDirection = 'asc' | 'desc';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<LinkType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const pageSize = 10;

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: () => api.getDashboardStats(),
  });

  // Fetch user's links
  const { data: linksData, isLoading: linksLoading } = useQuery<PaginatedLinksResponse>({
    queryKey: ['links', currentPage, activeOnly],
    queryFn: () => api.getLinks(currentPage, pageSize, activeOnly),
  });

  // Delete link mutation
  const deleteMutation = useMutation({
    mutationFn: (linkId: string) => api.deleteLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Link deleted successfully');
      setDeleteModalOpen(false);
      setLinkToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete link');
    },
  });

  const handleCopyLink = (shortCode: string) => {
    const fullUrl = `${window.location.origin}/${shortCode}`;
    copyToClipboard(fullUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleDeleteClick = (link: LinkType) => {
    setLinkToDelete(link);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (linkToDelete) {
      deleteMutation.mutate(linkToDelete.id);
    }
  };

  const handleDownloadQR = async (link: LinkType) => {
    try {
      const fullUrl = `${window.location.origin}/${link.shortCode}`;
      const qrCodeUrl = await QRCode.toDataURL(fullUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#4F46E5',
          light: '#FFFFFF',
        },
      });

      const a = document.createElement('a');
      a.href = qrCodeUrl;
      a.download = `qrcode-${link.shortCode}.png`;
      a.click();
      toast.success('QR code downloaded!');
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="h-4 w-4" /> :
      <ArrowDown className="h-4 w-4" />;
  };

  const getStatusBadge = (link: LinkType) => {
    if (!link.isActive) {
      return <Badge variant="danger">Inactive</Badge>;
    }

    // Check if expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return <Badge variant="danger">Expired</Badge>;
    }

    if (link.maxViews && link.currentViews >= link.maxViews) {
      return <Badge variant="danger">Limit Reached</Badge>;
    }

    return <Badge variant="success">Active</Badge>;
  };

  // Filter and sort links
  const filteredAndSortedLinks = useMemo(() => {
    if (!linksData?.links) return [];

    let result = [...linksData.links];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(link =>
        (link.title?.toLowerCase().includes(query)) ||
        link.shortCode.toLowerCase().includes(query) ||
        link.originalUrl.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          const titleA = (a.title || '').toLowerCase();
          const titleB = (b.title || '').toLowerCase();
          comparison = titleA.localeCompare(titleB);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'currentViews':
          comparison = a.currentViews - b.currentViews;
          break;
        case 'status':
          const statusA = a.isActive ? 1 : 0;
          const statusB = b.isActive ? 1 : 0;
          comparison = statusA - statusB;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [linksData?.links, searchQuery, sortField, sortDirection]);

  const totalPages = linksData ? Math.ceil(linksData.totalCount / pageSize) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0]}!
              </h1>
              <p className="text-gray-600">
                Manage your expiring links and track their performance.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                queryClient.invalidateQueries({ queryKey: ['links'] });
                toast.success('Data refreshed!');
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Links</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '...' : stats?.totalLinks || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <LinkIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Links</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '...' : stats?.activeLinks || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Clicks</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '...' : stats?.totalClicks || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">This Month</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '...' : stats?.clicksThisMonth || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Links Section */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Your Links</h2>
                  <Button size="sm" onClick={() => navigate('/links/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Link
                  </Button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, short code, or URL..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={activeOnly}
                      onChange={(e) => {
                        setActiveOnly(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Active only
                  </label>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {linksLoading ? (
                <div className="p-8 text-center text-gray-600">Loading links...</div>
              ) : !linksData?.links || linksData.links.length === 0 ? (
                <div className="p-12 text-center">
                  <LinkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No links yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create your first expiring link to get started!
                  </p>
                  <Button onClick={() => navigate('/links/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Link
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="md:hidden divide-y divide-gray-200">
                    {filteredAndSortedLinks.map((link) => (
                      <div key={link.id} className="p-4 hover:bg-gray-50">
                        {/* Title and Short Code */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            {link.title && (
                              <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                                {link.title}
                              </h3>
                            )}
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-indigo-600">
                                /{link.shortCode}
                              </code>
                              <button
                                onClick={() => handleCopyLink(link.shortCode)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy link"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="ml-2">
                            {getStatusBadge(link)}
                          </div>
                        </div>

                        {/* Original URL */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-gray-500">URL:</span>
                          <a
                            href={link.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-700 truncate flex-1 hover:text-indigo-600"
                          >
                            {link.originalUrl}
                          </a>
                          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{link.currentViews}</span>
                            {link.maxViews && <span className="text-gray-400">/ {link.maxViews}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(link.createdAt)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleDownloadQR(link)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <span>QR</span>
                          </button>
                          <button
                            onClick={() => navigate(`/links/${link.id}/analytics`)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span>Analytics</span>
                          </button>
                          <button
                            onClick={() => navigate(`/links/${link.id}/edit`)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(link)}
                            className="flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('title')}
                              className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                            >
                              Link
                              {getSortIcon('title')}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Original URL
                          </th>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('status')}
                              className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                            >
                              Status
                              {getSortIcon('status')}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('currentViews')}
                              className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors hidden md:flex"
                            >
                              Views
                              {getSortIcon('currentViews')}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('createdAt')}
                              className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors hidden xl:flex"
                            >
                              Created
                              {getSortIcon('createdAt')}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedLinks.map((link) => (
                          <tr key={link.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                {link.title && (
                                  <span className="text-sm font-medium text-gray-900">
                                    {link.title}
                                  </span>
                                )}
                                <div className="flex items-center gap-2">
                                  <code className="text-sm font-mono text-indigo-600">
                                    /{link.shortCode}
                                  </code>
                                  <button
                                    onClick={() => handleCopyLink(link.shortCode)}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Copy link"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <div className="flex items-center gap-2 max-w-xs">
                                <span className="text-sm text-gray-900 truncate">
                                  {link.originalUrl}
                                </span>
                                <a
                                  href={link.originalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(link)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                              <div className="flex items-center gap-2 text-sm">
                                <Eye className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{link.currentViews}</span>
                                {link.maxViews && (
                                  <span className="text-gray-500">/ {link.maxViews}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden xl:table-cell">
                              {formatDate(link.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleDownloadQR(link)}
                                  className="text-gray-400 hover:text-green-600 transition-colors"
                                  title="Download QR code"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/links/${link.id}/analytics`)}
                                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                                  title="View analytics"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/links/${link.id}/edit`)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Edit link"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(link)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete link"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, linksData.totalCount)} of{' '}
                        {linksData.totalCount} links
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(
                              (page) =>
                                page === 1 ||
                                page === totalPages ||
                                Math.abs(page - currentPage) <= 1
                            )
                            .map((page, idx, arr) => (
                              <>
                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                  <span key={`ellipsis-${page}`} className="px-2 text-gray-400">...</span>
                                )}
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-1 rounded ${
                                    currentPage === page
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {page}
                                </button>
                              </>
                            ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Link"
        message={`Are you sure you want to delete the link "${linkToDelete?.shortCode}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

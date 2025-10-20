import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Mail,
  FileText,
  Palette,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { ExpiryPage } from '@/types';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import Navigation from '@/components/Navigation';

export default function ExpiryPages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<ExpiryPage | null>(null);

  // Fetch expiry pages
  const { data: expiryPages, isLoading } = useQuery<ExpiryPage[]>({
    queryKey: ['expiryPages'],
    queryFn: () => api.getExpiryPages(),
  });

  // Delete expiry page mutation
  const deleteMutation = useMutation({
    mutationFn: (pageId: string) => api.deleteExpiryPage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiryPages'] });
      toast.success('Expiry page deleted successfully');
      setDeleteModalOpen(false);
      setPageToDelete(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete expiry page';
      toast.error(errorMessage);
    },
  });

  const handleDeleteClick = (page: ExpiryPage) => {
    setPageToDelete(page);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (pageToDelete) {
      deleteMutation.mutate(pageToDelete.id);
    }
  };

  const handleCreateNew = () => {
    navigate('/expiry-pages/create');
  };

  const handleEdit = (pageId: string) => {
    navigate(`/expiry-pages/${pageId}/edit`);
  };

  const handleViewEmails = (pageId: string) => {
    navigate(`/expiry-pages/${pageId}/emails`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Custom Expiry Pages
                </h1>
                <p className="text-gray-600">
                  Create branded expiry pages to show when your links expire
                </p>
              </div>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Expiry Page
              </Button>
            </div>
          </div>

          {/* Expiry Pages List */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                Your Expiry Pages ({expiryPages?.length || 0})
              </h2>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-600">
                  Loading expiry pages...
                </div>
              ) : !expiryPages || expiryPages.length === 0 ? (
                <div className="p-12 text-center">
                  <Palette className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No expiry pages yet
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Create custom branded pages to show when your links expire.
                    Add your logo, custom message, call-to-action buttons, and
                    even capture visitor emails!
                  </p>
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Expiry Page
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="md:hidden divide-y divide-gray-200">
                    {expiryPages.map((page) => (
                      <div key={page.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {page.name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {page.title}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{page.linksUsingCount} links</span>
                          </div>
                          {page.enableEmailCapture && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{page.emailsCaptured} emails</span>
                            </div>
                          )}
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {page.logoUrl && (
                            <Badge variant="secondary" size="sm">Logo</Badge>
                          )}
                          {page.ctaButtonUrl && (
                            <Badge variant="secondary" size="sm">CTA Button</Badge>
                          )}
                          {page.enableEmailCapture && (
                            <Badge variant="success" size="sm">Email Capture</Badge>
                          )}
                          {page.customCss && (
                            <Badge variant="secondary" size="sm">Custom CSS</Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                          {page.enableEmailCapture && (
                            <button
                              onClick={() => handleViewEmails(page.id)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <Mail className="h-4 w-4" />
                              <span>Emails</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(page.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(page)}
                            className="flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            disabled={page.linksUsingCount > 0}
                            title={page.linksUsingCount > 0 ? 'Cannot delete: page is being used by links' : 'Delete page'}
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Page Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Features
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {expiryPages.map((page) => (
                          <tr key={page.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded flex-shrink-0"
                                  style={{ backgroundColor: page.backgroundColor }}
                                  title={`Background: ${page.backgroundColor}`}
                                />
                                <span className="text-sm font-medium text-gray-900">
                                  {page.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900 line-clamp-2">
                                {page.title}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {page.logoUrl && (
                                  <Badge variant="secondary" size="sm">Logo</Badge>
                                )}
                                {page.ctaButtonUrl && (
                                  <Badge variant="secondary" size="sm">CTA</Badge>
                                )}
                                {page.enableEmailCapture && (
                                  <Badge variant="success" size="sm">
                                    <Mail className="h-3 w-3 mr-1" />
                                    Email
                                  </Badge>
                                )}
                                {page.customCss && (
                                  <Badge variant="secondary" size="sm">CSS</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-sm text-gray-900">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span>{page.linksUsingCount} links</span>
                                </div>
                                {page.enableEmailCapture && (
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span>{page.emailsCaptured} emails</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(page.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                {page.enableEmailCapture && (
                                  <button
                                    onClick={() => handleViewEmails(page.id)}
                                    className="text-gray-400 hover:text-green-600 transition-colors"
                                    title="View captured emails"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEdit(page.id)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Edit page"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(page)}
                                  className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={page.linksUsingCount > 0}
                                  title={
                                    page.linksUsingCount > 0
                                      ? 'Cannot delete: page is being used by links'
                                      : 'Delete page'
                                  }
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
        title="Delete Expiry Page"
        message={`Are you sure you want to delete the expiry page "${pageToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

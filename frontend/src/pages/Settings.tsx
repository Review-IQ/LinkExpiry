import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  CreditCard,
  Bell,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import type { DashboardStats } from '@/types';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Navigation from '@/components/Navigation';

type TabType = 'profile' | 'security' | 'billing' | 'notifications';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Fetch dashboard stats for link count
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: () => api.getDashboardStats(),
  });

  const handleBackToDashboard = () => {
    // Invalidate all queries to fetch fresh data
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    queryClient.invalidateQueries({ queryKey: ['links'] });
    navigate('/dashboard');
  };

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string; phone: string }) => api.updateProfile(data),
    onSuccess: (_, variables) => {
      // Update the auth store with the new profile data
      updateUser({
        firstName: variables.firstName,
        lastName: variables.lastName,
        email: variables.email,
        phone: variables.phone,
      });
      toast.success('Profile updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast.error('All fields are required');
      return;
    }

    // Validate phone
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    updateProfileMutation.mutate({ firstName, lastName, email, phone });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved!');
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'security' as TabType, label: 'Security', icon: Lock },
    { id: 'billing' as TabType, label: 'Billing', icon: CreditCard },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
  ];

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences.</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-indigo-50 text-indigo-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Input
                            type="text"
                            label="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="text"
                            label="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Input
                          type="tel"
                          label="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Include country code for international numbers.
                        </p>
                      </div>

                      <div>
                        <Input
                          type="email"
                          label="Email Address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          This email will be used for login and notifications.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Plan
                        </label>
                        <div className="flex items-center gap-2">
                          <Badge variant="info">{user?.plan || user?.planType || 'FREE'}</Badge>
                          <span className="text-sm text-gray-600">
                            {stats?.linksCreatedThisMonth || 0} / {stats?.linksLimitThisMonth === -1 || stats?.linksLimitThisMonth === 2147483647 ? 'Unlimited' : stats?.linksLimitThisMonth || 5} links this month
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Member Since
                        </label>
                        <p className="text-gray-900">
                          {user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </p>
                      </div>

                      <div className="pt-4">
                        <Button
                          type="submit"
                          isLoading={updateProfileMutation.isPending}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <Input
                        type="password"
                        label="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />

                      <Input
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />

                      <Input
                        type="password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                      />

                      {/* Password Requirements */}
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Password Requirements:
                        </p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li className="flex items-center gap-2">
                            {newPassword.length >= 8 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                            At least 8 characters
                          </li>
                          <li className="flex items-center gap-2">
                            {/[A-Z]/.test(newPassword) ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                            One uppercase letter
                          </li>
                          <li className="flex items-center gap-2">
                            {/[a-z]/.test(newPassword) ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                            One lowercase letter
                          </li>
                          <li className="flex items-center gap-2">
                            {/[0-9]/.test(newPassword) ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                            One number
                          </li>
                        </ul>
                      </div>

                      <div className="pt-4">
                        <Button
                          type="submit"
                          isLoading={changePasswordMutation.isPending}
                        >
                          Change Password
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900">Billing & Plans</h2>
                  </CardHeader>
                  <CardContent>
                    {/* Current Plan */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
                      <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {user?.plan || user?.planType || 'FREE'} Plan
                            </p>
                            <p className="text-gray-600 mt-1">
                              {stats?.linksCreatedThisMonth || 0} / {stats?.linksLimitThisMonth === -1 || stats?.linksLimitThisMonth === 2147483647 ? 'Unlimited' : stats?.linksLimitThisMonth || 5} links used this month
                            </p>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                stats?.linksLimitThisMonth === -1 || stats?.linksLimitThisMonth === 2147483647
                                  ? 0
                                  : ((stats?.linksCreatedThisMonth || 0) / (stats?.linksLimitThisMonth || 5)) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Available Plans */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Available Plans
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {[
                          {
                            name: 'STARTER',
                            price: '$5',
                            limit: '50 links/month',
                            features: ['Email notifications', '100 views per link', 'Basic analytics']
                          },
                          {
                            name: 'PRO',
                            price: '$29',
                            limit: '500 links/month',
                            features: ['Email & SMS notifications', 'Unlimited views', 'Advanced analytics', 'Custom domains']
                          },
                          {
                            name: 'ENTERPRISE',
                            price: '$99',
                            limit: 'Unlimited links',
                            features: ['All PRO features', 'Priority support', 'API access', 'White-label']
                          },
                        ].map((plan) => (
                          <div
                            key={plan.name}
                            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-all"
                          >
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {plan.name}
                            </h4>
                            <p className="text-3xl font-bold text-indigo-600 mb-2">
                              {plan.price}
                              <span className="text-sm font-normal text-gray-600">/month</span>
                            </p>
                            <p className="text-sm text-gray-600 mb-4">{plan.limit}</p>
                            <ul className="space-y-2 mb-6">
                              {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => toast.info('Upgrade feature coming soon!')}
                            >
                              Upgrade
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">
                        <strong>Note:</strong> Billing integration is coming soon. Contact us for
                        enterprise plans.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Notification Preferences
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Email Notifications */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-600">
                            Receive email notifications for important updates
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailNotifications}
                            onChange={(e) => setEmailNotifications(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="border-t border-gray-200" />

                      {/* Expiry Alerts */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Expiry Alerts</p>
                          <p className="text-sm text-gray-600">
                            Get notified when links are about to expire
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={expiryAlerts}
                            onChange={(e) => setExpiryAlerts(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="border-t border-gray-200" />

                      {/* Weekly Reports */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Weekly Reports</p>
                          <p className="text-sm text-gray-600">
                            Receive weekly analytics reports via email
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={weeklyReports}
                            onChange={(e) => setWeeklyReports(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="pt-4">
                        <Button onClick={handleSaveNotifications}>
                          Save Preferences
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

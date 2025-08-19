import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';
import Home from './pages/Home';
import FamilyHistory from './pages/FamilyHistory';
import FamilyTree from './pages/FamilyTree';
import News from './pages/News';
import Blog from './pages/Blog';
import Archives from './pages/Archives';
import NotFound from './pages/NotFound';

// Admin imports
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import BlogPage from './pages/admin/BlogPage';
import NewsPage from './pages/admin/NewsPage';
import SubmissionsPage from './pages/admin/SubmissionsPage';
import ArchivePage from './pages/admin/ArchivePage';
import FamilyTreePage from './pages/admin/FamilyTreePage';
import TimelinePage from './pages/admin/TimelinePage';
import FamilyMembersPage from './pages/admin/FamilyMembersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import SettingsPage from './pages/admin/SettingsPage';
import ActivityPage from './pages/admin/ActivityPage';

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="family-heritage-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
            <Routes>
              {/* Public Login Route - Only route that doesn't require authentication */}
              <Route path="/login" element={<Login />} />

              {/* Protected Main Website Routes - All require authentication */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/family-history" element={
                <ProtectedRoute>
                  <Layout>
                    <FamilyHistory />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/family-tree" element={
                <ProtectedRoute>
                  <Layout>
                    <FamilyTree />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/news" element={
                <ProtectedRoute>
                  <Layout>
                    <News />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/blog" element={
                <ProtectedRoute>
                  <Layout>
                    <Blog />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/archives" element={
                <ProtectedRoute>
                  <Layout>
                    <Archives />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* User Profile Route - Allow password changes */}
              <Route path="/profile" element={
                <ProtectedRoute allowPasswordChange={true}>
                  <Layout>
                    <UserProfile />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Admin Routes - Require admin role */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="family-members" element={<FamilyMembersPage />} />
                <Route path="admin-users" element={<AdminUsersPage />} />
                <Route path="family-tree" element={<FamilyTreePage />} />
                <Route path="timeline" element={<TimelinePage />} />
                <Route path="blog" element={<BlogPage />} />
                <Route path="news" element={<NewsPage />} />
                <Route path="archive" element={<ArchivePage />} />
                <Route path="submissions" element={<SubmissionsPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={
                <ProtectedRoute>
                  <Layout>
                    <NotFound />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import Home from './pages/Home';
import FamilyHistory from './pages/FamilyHistory';
import FamilyTree from './pages/FamilyTree';
import News from './pages/News';
import Blog from './pages/Blog';
import Archives from './pages/Archives';
import NotFound from './pages/NotFound';

// Admin imports
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import BlogPage from './pages/admin/BlogPage';
import NewsPage from './pages/admin/NewsPage';
import SubmissionsPage from './pages/admin/SubmissionsPage';
import ArchivePage from './pages/admin/ArchivePage';
import FamilyTreePage from './pages/admin/FamilyTreePage';
import TimelinePage from './pages/admin/TimelinePage';
import UsersPage from './pages/admin/UsersPage';
import SettingsPage from './pages/admin/SettingsPage';

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
            <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <Layout>
                  <Home />
                </Layout>
              } />
              <Route path="/family-history" element={
                <Layout>
                  <FamilyHistory />
                </Layout>
              } />
              <Route path="/family-tree" element={
                <Layout>
                  <FamilyTree />
                </Layout>
              } />
              <Route path="/news" element={
                <Layout>
                  <News />
                </Layout>
              } />
              <Route path="/blog" element={
                <Layout>
                  <Blog />
                </Layout>
              } />
              <Route path="/archives" element={
                <Layout>
                  <Archives />
                </Layout>
              } />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="family-tree" element={<FamilyTreePage />} />
                <Route path="timeline" element={<TimelinePage />} />
                <Route path="blog" element={<BlogPage />} />
                <Route path="news" element={<NewsPage />} />
                <Route path="archive" element={<ArchivePage />} />
                <Route path="submissions" element={<SubmissionsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
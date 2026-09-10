import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Landing Page Components (completely preserved)
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Schedule from './components/Schedule';
import RegistrationForm from './components/RegistrationForm';
import Footer from './components/Footer';

// Admin Auth & Layout Components
import { AdminAuthProvider } from './admin/context/AdminAuthContext';
import ProtectedRoute from './admin/components/ProtectedRoute';
import AdminLayout from './admin/components/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminEvents from './admin/pages/AdminEvents';
import AdminRegistrations from './admin/pages/AdminRegistrations';
import AdminAnalytics from './admin/pages/AdminAnalytics';
import AdminSettings from './admin/pages/AdminSettings';

// Active Event Data Layer
import { ActiveEventProvider } from './context/ActiveEventContext';

// Public Landing Page wrapper
function PublicLandingPage() {
  return (
    <ActiveEventProvider>
      <div className="app-layout">
        {/* Navigation */}
        <Navbar />

        {/* Main Page Content */}
        <main className="main-content">
          <Hero />
          <About />
          <Schedule />
          <RegistrationForm />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </ActiveEventProvider>
  );
}

function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<PublicLandingPage />} />

          {/* Admin Login Route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="registrations" element={<AdminRegistrations />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Catch-all fallback redirects to public landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}

export default App;

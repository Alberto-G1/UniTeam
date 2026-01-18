import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

// Layouts
import { StudentLayout } from './layouts/StudentLayout';
import { LecturerLayout } from './layouts/LecturerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Auth Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

// Dashboard Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { LecturerDashboard } from './pages/LecturerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

import './App.css';

// Role-based dashboard router
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'STUDENT') {
    return <Navigate to="/student/dashboard" replace />;
  } else if (user?.role === 'LECTURER') {
    return <Navigate to="/lecturer/dashboard" replace />;
  } else if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />

          {/* Root - Redirect to role-based dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="projects" element={<div>Projects List (Coming Soon)</div>} />
            <Route path="invitations" element={<div>Invitations (Coming Soon)</div>} />
            <Route path="profile" element={<div>Profile (Coming Soon)</div>} />
          </Route>

          {/* Lecturer Routes */}
          <Route
            path="/lecturer"
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<LecturerDashboard />} />
            <Route path="projects" element={<div>Supervised Projects (Coming Soon)</div>} />
            <Route path="templates" element={<div>Templates (Coming Soon)</div>} />
            <Route path="profile" element={<div>Profile (Coming Soon)</div>} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<div>Manage Users (Coming Soon)</div>} />
            <Route path="lecturers/pending" element={<div>Pending Lecturers (Coming Soon)</div>} />
            <Route path="profile" element={<div>Profile (Coming Soon)</div>} />
          </Route>

          {/* Shared Project Routes (accessible by students/lecturers) */}
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <div>Project Details (Coming Soon)</div>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

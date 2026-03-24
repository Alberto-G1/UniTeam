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

// Other Pages
import ManageUsers from './pages/ManageUsers';
import MyProjects from './pages/MyProjects';
import Invitations from './pages/Invitations';
import Profile from './pages/Profile';
import ComingSoon from './components/ComingSoon';

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
            <Route path="projects" element={<MyProjects />} />
            <Route path="projects/create" element={<ComingSoon feature="Create Project" dashboardPath="/student/dashboard" />} />
            <Route path="projects/:id" element={<ComingSoon feature="Project Details" dashboardPath="/student/projects" />} />
            <Route path="invitations" element={<Invitations />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<ComingSoon feature="Edit Profile" dashboardPath="/student/profile" />} />
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
            <Route path="projects" element={<ComingSoon feature="Supervised Projects" dashboardPath="/lecturer/dashboard" />} />
            <Route path="projects/:id" element={<ComingSoon feature="Project Details" dashboardPath="/lecturer/projects" />} />
            <Route path="templates" element={<ComingSoon feature="Project Templates" dashboardPath="/lecturer/dashboard" />} />
            <Route path="templates/create" element={<ComingSoon feature="Create Template" dashboardPath="/lecturer/templates" />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<ComingSoon feature="Edit Profile" dashboardPath="/lecturer/profile" />} />
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
            <Route path="users" element={<ManageUsers />} />
            <Route path="users/:id/edit" element={<ComingSoon feature="Edit User" dashboardPath="/admin/users" />} />
            <Route path="lecturers/pending" element={<ComingSoon feature="Pending Lecturers" dashboardPath="/admin/dashboard" />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<ComingSoon feature="Edit Profile" dashboardPath="/admin/profile" />} />
          </Route>

          {/* Shared Project Routes (accessible by students/lecturers) */}
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ComingSoon feature="Project Details" dashboardPath="/" />
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

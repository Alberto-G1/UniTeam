import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

// Layouts
import { StudentLayout } from './layouts/StudentLayout';
import { LecturerLayout } from './layouts/LecturerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';

// Dashboard Pages
import { StudentDashboard } from './pages/student/dashboard/StudentDashboard';
import { LecturerDashboard } from './pages/lecturer/dashboard/LecturerDashboard';
import { AdminDashboard } from './pages/admin/dashboard/AdminDashboard';

// Other Pages
import ManageUsers from './pages/admin/users/ManageUsers';
import MyProjects from './pages/student/projects/MyProjects';
import Invitations from './pages/student/invitations/Invitations';
import StudentProfile from './pages/student/profile/StudentProfile';
import StudentProfileEdit from './pages/student/profile/StudentProfileEdit';
import LecturerProfile from './pages/lecturer/profile/LecturerProfile';
import LecturerProfileEdit from './pages/lecturer/profile/LecturerProfileEdit';
import AdminProfile from './pages/admin/profile/AdminProfile';
import AdminProfileEdit from './pages/admin/profile/AdminProfileEdit';
import NotFound from './pages/shared/NotFound';

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
            <Route path="projects/create" element={<NotFound feature="Create Project" dashboardPath="/student/dashboard" />} />
            <Route path="projects/:id" element={<NotFound feature="Project Details" dashboardPath="/student/projects" />} />
            <Route path="invitations" element={<Invitations />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="profile/edit" element={<StudentProfileEdit />} />
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
            <Route path="projects" element={<NotFound feature="Supervised Projects" dashboardPath="/lecturer/dashboard" />} />
            <Route path="projects/:id" element={<NotFound feature="Project Details" dashboardPath="/lecturer/projects" />} />
            <Route path="templates" element={<NotFound feature="Project Templates" dashboardPath="/lecturer/dashboard" />} />
            <Route path="templates/create" element={<NotFound feature="Create Template" dashboardPath="/lecturer/templates" />} />
            <Route path="profile" element={<LecturerProfile />} />
            <Route path="profile/edit" element={<LecturerProfileEdit />} />
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
            <Route path="users/:id/edit" element={<NotFound feature="Edit User" dashboardPath="/admin/users" />} />
            <Route path="lecturers/pending" element={<NotFound feature="Pending Lecturers" dashboardPath="/admin/dashboard" />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="profile/edit" element={<AdminProfileEdit />} />
          </Route>

          {/* Shared Project Routes (accessible by students/lecturers) */}
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <NotFound feature="Project Details" dashboardPath="/" />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

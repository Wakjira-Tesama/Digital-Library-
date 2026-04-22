import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import SessionPage from "./pages/SessionPage";
import AdminDashboard from "./pages/AdminDashboard";
import DesktopPool from "./pages/DesktopPool";
import ProtectedRoute from "./components/ProtectedRoute";
import GeneralAdminHome from "./pages/GeneralAdminHome";
import GeneralAdminLogin from "./pages/GeneralAdminLogin";
import GeneralAdminDashboard from "./pages/GeneralAdminDashboard";
import GeneralAdminLibraryNodes from "./pages/GeneralAdminLibraryNodes";
import LibrarySelectionPage from "./pages/LibrarySelectionPage";
import HomePage from "./pages/HomePage";
import GeneralAdminAnnouncements from "./pages/GeneralAdminAnnouncements";
import AdminChat from "./pages/AdminChat";
import EbookStudentDashboard from "./pages/EbookStudentDashboard";
import EbookAdminDashboard from "./pages/EbookAdminDashboard";
import StudentCombinedDashboard from "./pages/StudentCombinedDashboard";

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("astu-theme") || "dark");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("astu-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  // Expose toggle globally for simple integration in other components without deep prop drilling yet
  window.toggleAstuTheme = toggleTheme;

  const appMode = import.meta.env.MODE;
  const isAdminMode = appMode === "admin";
  const isStudentMode = appMode === "student";
  const defaultRoute = isAdminMode ? "/admin-login" : "/";

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/general-admin-home" element={<GeneralAdminHome />} />
        <Route path="/general-admin-login" element={<GeneralAdminLogin />} />
        <Route
          path="/general-admin-dashboard"
          element={
            <ProtectedRoute role="general_admin">
              <GeneralAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/general-admin-library-nodes"
          element={
            <ProtectedRoute role="general_admin">
              <GeneralAdminLibraryNodes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/general-admin-announcements"
          element={
            <ProtectedRoute role="admin">
              <GeneralAdminAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-chat"
          element={
            <ProtectedRoute role="admin">
              <AdminChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            isAdminMode ? (
              <Navigate to="/admin-login" replace />
            ) : (
              <LoginPage role="student" />
            )
          }
        />
        <Route
          path="/admin-login"
          element={
            isStudentMode ? (
              <Navigate to="/student" replace />
            ) : (
              <LoginPage role="admin" />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAdminMode ? (
              <Navigate to="/admin-login" replace />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route
          path="/library-selection"
          element={
            <ProtectedRoute role="student">
              <LibrarySelectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            isAdminMode ? (
              <Navigate to="/admin-login" replace />
            ) : (
              <ProtectedRoute role="student">
                <StudentCombinedDashboard />
              </ProtectedRoute>
            )
          }
        />
        <Route
          path="/ebook-dashboard"
          element={
            isAdminMode ? (
              <Navigate to="/admin-login" replace />
            ) : (
              <ProtectedRoute role="student">
                <EbookStudentDashboard />
              </ProtectedRoute>
            )
          }
        />
        <Route
          path="/session"
          element={
            isAdminMode ? (
              <Navigate to="/admin-login" replace />
            ) : (
              <ProtectedRoute role="student">
                <SessionPage />
              </ProtectedRoute>
            )
          }
        />
        <Route
          path="/admin"
          element={
            isStudentMode ? (
              <Navigate to="/student" replace />
            ) : (
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            )
          }
        />
        <Route
          path="/desktop-pool"
          element={
            isStudentMode ? (
              <Navigate to="/student" replace />
            ) : (
              <ProtectedRoute role="admin">
                <DesktopPool />
              </ProtectedRoute>
            )
          }
        />
        <Route
          path="/librarian-ebooks"
          element={
            <ProtectedRoute role="librarian">
              <EbookAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

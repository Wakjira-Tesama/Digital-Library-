import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      if (isMounted) {
        setLoading(false);
      }
      return () => {
        isMounted = false;
      };
    }

    const fetchUser = async () => {
      try {
        const res = await api.get("/me");
        if (isMounted) {
          setUser(res.data);
        }
      } catch {
        if (isMounted) {
          localStorage.removeItem("token");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role validation logic
  if (role === "general_admin" && user.role !== "general_admin") {
    return <Navigate to="/" replace />;
  }

  if (
    role === "admin" &&
    user.role !== "librarian" &&
    user.role !== "general_admin"
  ) {
    return <Navigate to="/" replace />;
  }

  if (role === "librarian" && user.role !== "librarian") {
    return <Navigate to="/" replace />;
  }

  if (role === "student" && user.role !== "student") {
    return <Navigate to="/" replace />;
  }

  return children;
}

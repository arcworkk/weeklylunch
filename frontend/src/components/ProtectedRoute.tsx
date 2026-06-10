import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { User } from "../types/auth";

type ProtectedRouteProps = {
  user: User | null;
  loading: boolean;
  children: ReactNode;
};

export const ProtectedRoute = ({ user, loading, children }: ProtectedRouteProps) => {
  if (loading) {
    return <main className="page">Chargement...</main>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "@/lib/api";

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "admin" | "member";
  userType: "admin" | "family_member";
  mustChangePassword?: boolean;
  email?: string; // Optional for family members
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      // Check session-based authentication
      const response = await apiClient.getCurrentUser();
      setUser(response.user);
    } catch (error) {
      // Session expired or no session
      setUser(null);
      // Clear any old localStorage data
      localStorage.removeItem("francis_legacy_user");
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await apiClient.login(username, password);
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      // Clear any old localStorage data
      localStorage.removeItem("francis_legacy_user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "moderator" | "superModerator";

interface User {
  userId: string;
  role: UserRole;
  name?: string;
}

interface Moderator {
  id: string;
  name: string;
  userId: string;
  password: string;
  createdAt: string;
}

interface SuperModerator {
  id: string;
  name: string;
  userId: string;
  password: string;
  permissions: any;
  createdAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  userRole: UserRole | null;
  userId: string | null;
  login: (userId: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem("msbd_authenticated");
    const storedUser = localStorage.getItem("msbd_user");
    if (authStatus === "true" && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const getUserIP = async (): Promise<string | null> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Failed to fetch IP address:", error);
      return null;
    }
  };

  const checkIPAccess = async (): Promise<{ allowed: boolean; message?: string }> => {
    const ipAccessSettings = localStorage.getItem("dob_ip_access");
    if (!ipAccessSettings) {
      return { allowed: true };
    }

    const { enabled, allowedIPs } = JSON.parse(ipAccessSettings);
    
    if (!enabled || allowedIPs.length === 0) {
      return { allowed: true };
    }

    const userIP = await getUserIP();
    
    if (!userIP) {
      return { 
        allowed: false, 
        message: "Unable to verify IP address. Please try again." 
      };
    }

    const isAllowed = allowedIPs.includes(userIP);
    
    if (!isAllowed) {
      return { 
        allowed: false, 
        message: `Access denied: your IP (${userIP}) is not authorized` 
      };
    }

    return { allowed: true };
  };

  const login = async (userId: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const ipCheck = await checkIPAccess();
    if (!ipCheck.allowed) {
      return { success: false, message: ipCheck.message };
    }

    const storedAdmin = localStorage.getItem("dob_admin_credentials");
    const adminCreds = storedAdmin 
      ? JSON.parse(storedAdmin) 
      : { userId: "MDBD51724", password: "shuvo@282##" };

    if (userId === adminCreds.userId && password === adminCreds.password) {
      const userData: User = {
        userId: adminCreds.userId,
        role: "admin",
        name: "Administrator",
      };
      setIsAuthenticated(true);
      setUser(userData);
      localStorage.setItem("msbd_authenticated", "true");
      localStorage.setItem("msbd_user", JSON.stringify(userData));
      return { success: true };
    }

    const storedSuperMods = localStorage.getItem("dob_super_moderators");
    if (storedSuperMods) {
      const superModerators: SuperModerator[] = JSON.parse(storedSuperMods);
      const superMod = superModerators.find(
        (sm) => sm.userId === userId && sm.password === password
      );

      if (superMod) {
        const userData: User = {
          userId: superMod.userId,
          role: "superModerator",
          name: superMod.name,
        };
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem("msbd_authenticated", "true");
        localStorage.setItem("msbd_user", JSON.stringify(userData));
        localStorage.setItem("msbd_super_mod_permissions", JSON.stringify(superMod.permissions));
        return { success: true };
      }
    }

    const storedMods = localStorage.getItem("dob_moderators");
    if (storedMods) {
      const moderators: Moderator[] = JSON.parse(storedMods);
      const moderator = moderators.find(
        (mod) => mod.userId === userId && mod.password === password
      );

      if (moderator) {
        const userData: User = {
          userId: moderator.userId,
          role: "moderator",
          name: moderator.name,
        };
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem("msbd_authenticated", "true");
        localStorage.setItem("msbd_user", JSON.stringify(userData));
        return { success: true };
      }
    }

    if (userId === "DOB" && password === "dob2.0") {
      const userData: User = {
        userId: "DOB",
        role: "moderator",
        name: "Default Moderator",
      };
      setIsAuthenticated(true);
      setUser(userData);
      localStorage.setItem("msbd_authenticated", "true");
      localStorage.setItem("msbd_user", JSON.stringify(userData));
      return { success: true };
    }

    return { success: false, message: "Invalid credentials" };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("msbd_authenticated");
    localStorage.removeItem("msbd_user");
    localStorage.removeItem("msbd_super_mod_permissions");
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    if (user.role === "admin") return true;
    
    if (user.role === "superModerator") {
      const permissions = localStorage.getItem("msbd_super_mod_permissions");
      if (permissions) {
        const perms = JSON.parse(permissions);
        if (permission === "admin") {
          return false;
        }
        
        if (permission === "delete") {
          return perms.canDeleteDashboard === true;
        }
        
        return perms[permission] === true;
      }
      return false;
    }
    
    if (permission === "admin") return false;
    
    const moderatorPermissions = ["add", "edit", "delete"];
    return moderatorPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        userRole: user?.role || null,
        userId: user?.userId || null,
        login, 
        logout,
        hasPermission 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

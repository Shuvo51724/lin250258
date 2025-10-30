import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface LicenseStatus {
  isActivated: boolean;
  isValid: boolean;
  isTampered: boolean;
  status?: 'active' | 'revoked' | 'expired';
  licenseId?: string;
  activatedAt?: string;
  expiresAt?: string;
  error?: string;
}

interface LicenseContextType {
  license: LicenseStatus;
  activate: (key: string) => Promise<{ success: boolean; error?: string }>;
  checkStatus: () => Promise<void>;
  reportTamper: (tamperType: string, details: any) => Promise<void>;
  logout: () => void;
  hasFeature: (feature: string) => boolean;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

const ENCODED_TOKEN_KEY = 'dob_license_token_v1';
const CLIENT_ID_KEY = 'dob_client_id';

function getClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

function encodeToken(token: string): string {
  return btoa(token);
}

function decodeToken(encoded: string): string {
  try {
    return atob(encoded);
  } catch {
    return '';
  }
}

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const [license, setLicense] = useState<LicenseStatus>({
    isActivated: false,
    isValid: false,
    isTampered: false,
  });

  const getToken = useCallback((): string | null => {
    const encoded = localStorage.getItem(ENCODED_TOKEN_KEY);
    if (!encoded) return null;
    return decodeToken(encoded);
  }, []);

  const setToken = useCallback((token: string) => {
    const encoded = encodeToken(token);
    localStorage.setItem(ENCODED_TOKEN_KEY, encoded);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(ENCODED_TOKEN_KEY);
  }, []);

  const checkStatus = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLicense({
        isActivated: false,
        isValid: false,
        isTampered: false,
      });
      return;
    }

    try {
      const response = await axios.get('/api/license/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.ok) {
        setLicense({
          isActivated: true,
          isValid: true,
          isTampered: false,
          status: response.data.status,
          licenseId: response.data.licenseId,
          activatedAt: response.data.activatedAt,
          expiresAt: response.data.expiresAt,
        });
      } else {
        setLicense({
          isActivated: true,
          isValid: false,
          isTampered: false,
          status: response.data.status,
          error: response.data.error,
        });
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        clearToken();
        setLicense({
          isActivated: false,
          isValid: false,
          isTampered: false,
          error: 'Invalid or expired license',
        });
      } else {
        setLicense(prev => ({
          ...prev,
          error: 'Failed to verify license status',
        }));
      }
    }
  }, [getToken, clearToken]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const activate = useCallback(async (key: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const clientId = getClientId();
      const clientInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post('/api/license/activate', {
        key,
        clientId,
        clientInfo,
      });

      if (response.data.ok) {
        setToken(response.data.token);
        await checkStatus();
        return { success: true };
      } else {
        return { success: false, error: response.data.error || 'Activation failed' };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Activation failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  }, [setToken, checkStatus]);

  const reportTamper = useCallback(async (tamperType: string, details: any) => {
    const token = getToken();
    const clientId = getClientId();

    setLicense(prev => ({
      ...prev,
      isTampered: true,
      isValid: false,
    }));

    try {
      await axios.post('/api/license/tamper-report', {
        tamperType,
        details,
        clientId,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error('Failed to report tamper:', error);
    }
  }, [getToken]);

  const logout = useCallback(() => {
    clearToken();
    setLicense({
      isActivated: false,
      isValid: false,
      isTampered: false,
    });
  }, [clearToken]);

  const hasFeature = useCallback((feature: string): boolean => {
    if (!license.isActivated || !license.isValid || license.isTampered) {
      const disabledFeatures = ['chat', 'export', 'admin', 'upload', 'rankings'];
      return !disabledFeatures.includes(feature.toLowerCase());
    }
    return true;
  }, [license]);

  const value: LicenseContextType = {
    license,
    activate,
    checkStatus,
    reportTamper,
    logout,
    hasFeature,
  };

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}

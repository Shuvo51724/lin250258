import { useLicense } from '@/contexts/LicenseContext';
import ActivationPage from '@/pages/activation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LicenseGuard({ children }: { children: React.ReactNode }) {
  const { license, logout } = useLicense();

  if (!license.isActivated) {
    return <ActivationPage />;
  }

  if (license.isTampered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">Tamper Detected</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p>
                  File integrity verification has detected unauthorized modifications to critical system files.
                </p>
                <p className="font-semibold">Critical features have been disabled for security:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Chat functionality</li>
                  <li>Data export</li>
                  <li>Admin panels</li>
                  <li>File uploads</li>
                  <li>Rankings calculations</li>
                </ul>
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded">
                  <p className="font-semibold">This incident has been logged and reported.</p>
                  <p className="text-sm mt-1">
                    Contact your system administrator immediately to resolve this issue.
                  </p>
                </div>
                <div className="mt-4">
                  <Button onClick={logout} variant="outline">
                    Return to Activation
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!license.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">License Invalid</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p>
                  {license.error || `Your license is ${license.status || 'invalid'}.`}
                </p>
                <p className="font-semibold mt-4">Restricted features:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Chat functionality</li>
                  <li>Data export</li>
                  <li>Admin panels</li>
                  <li>File uploads</li>
                  <li>Rankings calculations</li>
                </ul>
                <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded">
                  <p className="font-semibold">Contact your system administrator</p>
                  <p className="text-sm mt-1">
                    to renew or reactivate your license
                  </p>
                </div>
                <div className="mt-4">
                  <Button onClick={logout} variant="outline">
                    Enter New License Key
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

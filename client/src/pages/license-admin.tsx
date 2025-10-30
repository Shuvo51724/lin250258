import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import DashboardHeader from '@/components/DashboardHeader';
import Footer from '@/components/Footer';

interface License {
  licenseId: string;
  status: 'active' | 'revoked' | 'expired';
  activatedAt: string;
  lastSeenIP?: string;
  expiresAt?: string;
  notes?: string;
}

interface AuditLog {
  id: string;
  licenseId: string;
  timestamp: string;
  ip?: string;
  success: boolean;
  error?: string;
}

interface TamperReport {
  id: string;
  timestamp: string;
  licenseId?: string;
  tamperType: string;
  details: any;
  ip?: string;
}

export default function LicenseAdmin() {
  const { userRole } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [activationLogs, setActivationLogs] = useState<AuditLog[]>([]);
  const [tamperReports, setTamperReports] = useState<TamperReport[]>([]);
  const [revokeId, setRevokeId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const [licensesRes, auditRes] = await Promise.all([
        axios.get('/api/license/list'),
        axios.get('/api/license/audit?limit=50'),
      ]);

      if (licensesRes.data.ok) {
        setLicenses(licensesRes.data.licenses);
      }

      if (auditRes.data.ok) {
        setActivationLogs(auditRes.data.activations);
        setTamperReports(auditRes.data.tamperReports);
      }
    } catch (error) {
      console.error('Failed to load license data:', error);
    }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      loadData();
    }
  }, [userRole]);

  const handleRevoke = async () => {
    if (!revokeId.trim()) {
      setMessage('Please enter a license ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/license/revoke', {
        licenseId: revokeId.trim(),
        reason: revokeReason.trim() || 'Revoked by admin',
      });

      if (response.data.ok) {
        setMessage('License revoked successfully');
        setRevokeId('');
        setRevokeReason('');
        await loadData();
      }
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to revoke license');
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen">
        <DashboardHeader />
        <div className="p-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Admin access required to view license management
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            License Management
          </h1>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {licenses.filter(l => l.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Revoked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {licenses.filter(l => l.status === 'revoked').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tamper Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {tamperReports.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Activations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activationLogs.filter(l => l.success).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revoke License</CardTitle>
            <CardDescription>Revoke a license by ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">License ID</label>
                <Input
                  value={revokeId}
                  onChange={(e) => setRevokeId(e.target.value)}
                  placeholder="Enter license ID"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reason (optional)</label>
                <Input
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Reason for revocation"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleRevoke} disabled={loading} variant="destructive">
                {loading ? 'Revoking...' : 'Revoke License'}
              </Button>
              {message && (
                <span className={message.includes('success') ? 'text-green-600' : 'text-red-600'}>
                  {message}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Licenses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Activated</TableHead>
                  <TableHead>Last IP</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.licenseId}>
                    <TableCell className="font-mono text-sm">
                      {license.licenseId}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          license.status === 'active'
                            ? 'default'
                            : license.status === 'revoked'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {license.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {license.status === 'revoked' && <XCircle className="h-3 w-3 mr-1" />}
                        {license.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(license.activatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">{license.lastSeenIP || '-'}</TableCell>
                    <TableCell className="text-sm">{license.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tamper Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>License ID</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tamperReports.slice().reverse().map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="text-sm">
                      {new Date(report.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{report.tamperType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {report.licenseId || '-'}
                    </TableCell>
                    <TableCell className="text-sm">{report.ip || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {JSON.stringify(report.details).substring(0, 100)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activation Logs (Recent 50)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>License ID</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activationLogs.slice().reverse().map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.licenseId}</TableCell>
                    <TableCell className="text-sm">{log.ip || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={log.success ? 'default' : 'destructive'}>
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-red-600">
                      {log.error || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

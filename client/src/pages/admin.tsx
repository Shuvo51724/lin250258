import { useState, useEffect } from "react";
import { AdminSettings, SuperModerator, SuperModeratorPermissions, ChatSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Trash2, Settings, Save, Key, UserPlus, Edit, Users, Shield, ToggleLeft, X, Lock, Download, Upload, Database, MessageCircle } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { useChat } from "@/contexts/ChatContext";

interface Moderator {
  id: string;
  name: string;
  userId: string;
  password: string;
  createdAt: string;
}

interface IPAccessSettings {
  enabled: boolean;
  allowedIPs: string[];
}

interface AdminCredentials {
  userId: string;
  password: string;
}

interface FeatureToggles {
  voiceArtistEnabled: boolean;
  attendanceEnabled: boolean;
  workFlowEnabled: boolean;
  videoUploadTimeEnabled: boolean;
}

interface DobBackupData {
  dob_settings?: AdminSettings;
  dob_admin_credentials?: AdminCredentials;
  dob_moderators?: Moderator[];
  dob_super_moderators?: SuperModerator[];
  dob_feature_toggles?: FeatureToggles;
  dob_ip_access?: IPAccessSettings;
  dob_entries?: unknown[];
  dob_employees?: unknown[];
  dob_jela_reporters?: unknown[];
  dob_attendance?: unknown[];
  dob_complaints?: unknown[];
  dob_expense_sheets?: unknown[];
  dob_requisition_sheets?: unknown[];
  dob_upload_schedules?: unknown[];
  dob_work_categories?: unknown[];
  dob_work_notes?: unknown[];
  dob_voice_artists?: unknown[];
  dob_voice_work?: unknown[];
}

interface DobBackupPayload {
  version: string;
  exportDate: string;
  application: string;
  data: DobBackupData;
}

export default function Admin() {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [, navigate] = useLocation();
  const {
    settings,
    updateSettings,
    clearAllMessages,
    blockedUsers,
    mutedUsers,
    unblockUser,
    unmuteUser,
  } = useChat();
  
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    currentMonth: new Date().toISOString().slice(0, 7),
    employeeOfMonthMessage: "Congratulations to our top performers this month!",
  });

  const [currentAdminId, setCurrentAdminId] = useState("");
  const [currentAdminPassword, setCurrentAdminPassword] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [newModName, setNewModName] = useState("");
  const [newModUserId, setNewModUserId] = useState("");
  const [newModPassword, setNewModPassword] = useState("");
  const [editingMod, setEditingMod] = useState<string | null>(null);
  const [editModName, setEditModName] = useState("");
  const [editModUserId, setEditModUserId] = useState("");
  const [editModPassword, setEditModPassword] = useState("");

  const [superModerators, setSuperModerators] = useState<SuperModerator[]>([]);
  const [showAddSuperMod, setShowAddSuperMod] = useState(false);
  const [newSuperModName, setNewSuperModName] = useState("");
  const [newSuperModUserId, setNewSuperModUserId] = useState("");
  const [newSuperModPassword, setNewSuperModPassword] = useState("");
  const [editingSuperMod, setEditingSuperMod] = useState<SuperModerator | null>(null);

  const [voiceArtistEnabled, setVoiceArtistEnabled] = useState(true);
  const [attendanceEnabled, setAttendanceEnabled] = useState(true);
  const [workFlowEnabled, setWorkFlowEnabled] = useState(true);
  const [videoUploadTimeEnabled, setVideoUploadTimeEnabled] = useState(true);

  const [ipAccess, setIpAccess] = useState<IPAccessSettings>({
    enabled: false,
    allowedIPs: [],
  });
  const [newIP, setNewIP] = useState("");

  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importData, setImportData] = useState<DobBackupPayload | null>(null);

  useEffect(() => {
    if (userRole !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [userRole, navigate, toast]);

  useEffect(() => {
    const stored = localStorage.getItem("dob_settings");
    if (stored) {
      setAdminSettings(JSON.parse(stored));
    }

    const storedMods = localStorage.getItem("dob_moderators");
    if (storedMods) {
      setModerators(JSON.parse(storedMods));
    }

    const storedSuperMods = localStorage.getItem("dob_super_moderators");
    if (storedSuperMods) {
      setSuperModerators(JSON.parse(storedSuperMods));
    }

    const storedFeatures = localStorage.getItem("dob_feature_toggles");
    if (storedFeatures) {
      const features = JSON.parse(storedFeatures);
      setVoiceArtistEnabled(features.voiceArtistEnabled ?? true);
      setAttendanceEnabled(features.attendanceEnabled ?? true);
      setWorkFlowEnabled(features.workFlowEnabled ?? true);
      setVideoUploadTimeEnabled(features.videoUploadTimeEnabled ?? true);
    }

    const storedIPAccess = localStorage.getItem("dob_ip_access");
    if (storedIPAccess) {
      setIpAccess(JSON.parse(storedIPAccess));
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("dob_settings", JSON.stringify(adminSettings));
    toast({
      title: "Settings Saved",
      description: "Admin settings have been updated successfully",
    });
  };

  const handleChangeAdminCredentials = () => {
    const storedAdmin = localStorage.getItem("dob_admin_credentials");
    const adminCreds = storedAdmin 
      ? JSON.parse(storedAdmin) 
      : { userId: "MDBD51724", password: "shuvo@282##" };

    if (currentAdminId !== adminCreds.userId || currentAdminPassword !== adminCreds.password) {
      toast({
        title: "Verification Failed",
        description: "Current credentials are incorrect",
        variant: "destructive",
      });
      return;
    }

    if (!newAdminId || !newAdminPassword) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newAdminPassword !== confirmNewPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match",
        variant: "destructive",
      });
      return;
    }

    if (newAdminPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    const newCreds = { userId: newAdminId, password: newAdminPassword };
    localStorage.setItem("dob_admin_credentials", JSON.stringify(newCreds));

    setCurrentAdminId("");
    setCurrentAdminPassword("");
    setNewAdminId("");
    setNewAdminPassword("");
    setConfirmNewPassword("");

    toast({
      title: "Admin Credentials Updated",
      description: "Your new credentials are now active. Please use them for your next login.",
    });
  };

  const handleAddModerator = () => {
    if (!newModName || !newModUserId || !newModPassword) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newModPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (moderators.some(mod => mod.userId === newModUserId)) {
      toast({
        title: "User ID Exists",
        description: "This User ID is already in use",
        variant: "destructive",
      });
      return;
    }

    const newModerator: Moderator = {
      id: crypto.randomUUID(),
      name: newModName,
      userId: newModUserId,
      password: newModPassword,
      createdAt: new Date().toISOString(),
    };

    const updated = [...moderators, newModerator];
    setModerators(updated);
    localStorage.setItem("dob_moderators", JSON.stringify(updated));

    setNewModName("");
    setNewModUserId("");
    setNewModPassword("");

    toast({
      title: "Moderator Added",
      description: `${newModName} can now log in with their credentials`,
    });
  };

  const handleEditModerator = (mod: Moderator) => {
    setEditingMod(mod.id);
    setEditModName(mod.name);
    setEditModUserId(mod.userId);
    setEditModPassword(mod.password);
  };

  const handleSaveEditModerator = (id: string) => {
    if (!editModName || !editModUserId || !editModPassword) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (editModPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    const updated = moderators.map(mod =>
      mod.id === id
        ? { ...mod, name: editModName, userId: editModUserId, password: editModPassword }
        : mod
    );
    setModerators(updated);
    localStorage.setItem("dob_moderators", JSON.stringify(updated));
    setEditingMod(null);

    toast({
      title: "Moderator Updated",
      description: "Moderator credentials have been updated",
    });
  };

  const handleDeleteModerator = (id: string, name: string) => {
    const updated = moderators.filter(mod => mod.id !== id);
    setModerators(updated);
    localStorage.setItem("dob_moderators", JSON.stringify(updated));

    toast({
      title: "Moderator Removed",
      description: `${name} has been removed from moderators`,
    });
  };

  const handleAddSuperModerator = () => {
    if (!newSuperModName || !newSuperModUserId || !newSuperModPassword) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newSuperModPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (superModerators.some(sm => sm.userId === newSuperModUserId)) {
      toast({
        title: "User ID Exists",
        description: "This User ID is already in use",
        variant: "destructive",
      });
      return;
    }

    const defaultPermissions: SuperModeratorPermissions = {
      canViewDashboard: true,
      canAddDashboard: false,
      canEditDashboard: false,
      canDeleteDashboard: false,
      canViewVoiceArtist: true,
      canAddVoiceArtist: false,
      canEditVoiceArtist: false,
      canDeleteVoiceArtist: false,
      canViewAttendance: true,
      canAddAttendance: false,
      canEditAttendance: false,
      canDeleteAttendance: false,
      canViewWorkFlow: true,
      canAddWorkFlow: false,
      canEditWorkFlow: false,
      canDeleteWorkFlow: false,
      canViewVideoUpload: true,
      canAddVideoUpload: false,
      canEditVideoUpload: false,
      canDeleteVideoUpload: false,
      canViewComplaintBox: true,
      canAddComplaintBox: false,
      canViewRequisition: true,
      canAddRequisition: false,
      canEditRequisition: false,
      canDeleteRequisition: false,
      canViewExpense: true,
      canAddExpense: false,
      canEditExpense: false,
      canDeleteExpense: false,
    };

    const newSuperMod: SuperModerator = {
      id: crypto.randomUUID(),
      name: newSuperModName,
      userId: newSuperModUserId,
      password: newSuperModPassword,
      permissions: defaultPermissions,
      createdAt: new Date().toISOString(),
    };

    const updated = [...superModerators, newSuperMod];
    setSuperModerators(updated);
    localStorage.setItem("dob_super_moderators", JSON.stringify(updated));

    setNewSuperModName("");
    setNewSuperModUserId("");
    setNewSuperModPassword("");
    setShowAddSuperMod(false);

    toast({
      title: "Super Moderator Created",
      description: `${newSuperModName} has been added with default permissions`,
    });
  };

  const handleUpdateSuperModPermission = (id: string, permissionKey: keyof SuperModeratorPermissions, value: boolean) => {
    const updated = superModerators.map(sm =>
      sm.id === id
        ? { ...sm, permissions: { ...sm.permissions, [permissionKey]: value } }
        : sm
    );
    setSuperModerators(updated);
    localStorage.setItem("dob_super_moderators", JSON.stringify(updated));
  };

  const handleDeleteSuperModerator = (id: string, name: string) => {
    const updated = superModerators.filter(sm => sm.id !== id);
    setSuperModerators(updated);
    localStorage.setItem("dob_super_moderators", JSON.stringify(updated));

    toast({
      title: "Super Moderator Removed",
      description: `${name} has been removed`,
    });
  };

  const handleResetAllData = () => {
    localStorage.removeItem("dob_entries");
    localStorage.removeItem("dob_settings");
    localStorage.removeItem("dob_employees");
    localStorage.removeItem("dob_jela_reporters");
    setAdminSettings({
      currentMonth: new Date().toISOString().slice(0, 7),
      employeeOfMonthMessage: "Congratulations to our top performers this month!",
    });
    toast({
      title: "Data Reset",
      description: "All entries and settings have been cleared",
      variant: "destructive",
    });
  };

  const handleToggleFeature = (feature: "voiceArtist" | "attendance" | "workFlow" | "videoUploadTime", enabled: boolean) => {
    const storedFeatures = localStorage.getItem("dob_feature_toggles");
    const currentFeatures = storedFeatures ? JSON.parse(storedFeatures) : {};
    
    const features = {
      ...currentFeatures,
      voiceArtistEnabled: feature === "voiceArtist" ? enabled : (currentFeatures.voiceArtistEnabled ?? voiceArtistEnabled),
      attendanceEnabled: feature === "attendance" ? enabled : (currentFeatures.attendanceEnabled ?? attendanceEnabled),
      workFlowEnabled: feature === "workFlow" ? enabled : (currentFeatures.workFlowEnabled ?? workFlowEnabled),
      videoUploadTimeEnabled: feature === "videoUploadTime" ? enabled : (currentFeatures.videoUploadTimeEnabled ?? videoUploadTimeEnabled),
    };
    
    localStorage.setItem("dob_feature_toggles", JSON.stringify(features));
    
    if (feature === "voiceArtist") {
      setVoiceArtistEnabled(enabled);
    } else if (feature === "attendance") {
      setAttendanceEnabled(enabled);
    } else if (feature === "workFlow") {
      setWorkFlowEnabled(enabled);
    } else {
      setVideoUploadTimeEnabled(enabled);
    }

    const featureName = 
      feature === "voiceArtist" ? "Voice Artist" :
      feature === "attendance" ? "Daily Attendance" :
      feature === "workFlow" ? "Work Flow" :
      "Video Upload Time";
    
    toast({
      title: "Feature Updated",
      description: `${featureName} module ${enabled ? "enabled" : "disabled"}`,
    });
  };

  const handleToggleIPAccess = (enabled: boolean) => {
    const updated = { ...ipAccess, enabled };
    setIpAccess(updated);
    localStorage.setItem("dob_ip_access", JSON.stringify(updated));

    toast({
      title: enabled ? "IP Access Enabled" : "IP Access Disabled",
      description: enabled 
        ? "Only users from allowed IPs can access the system" 
        : "Access allowed from any IP address",
    });
  };

  const handleAddIP = () => {
    if (!newIP.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid IP address",
        variant: "destructive",
      });
      return;
    }

    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(newIP.trim())) {
      toast({
        title: "Invalid IP Format",
        description: "Please enter a valid IP address (e.g., 103.120.10.50)",
        variant: "destructive",
      });
      return;
    }

    if (ipAccess.allowedIPs.includes(newIP.trim())) {
      toast({
        title: "IP Already Exists",
        description: "This IP address is already in the list",
        variant: "destructive",
      });
      return;
    }

    const updated = {
      ...ipAccess,
      allowedIPs: [...ipAccess.allowedIPs, newIP.trim()],
    };
    setIpAccess(updated);
    localStorage.setItem("dob_ip_access", JSON.stringify(updated));
    setNewIP("");

    toast({
      title: "IP Added",
      description: "IP address added to allowed list",
    });
  };

  const handleRemoveIP = (ip: string) => {
    const updated = {
      ...ipAccess,
      allowedIPs: ipAccess.allowedIPs.filter(i => i !== ip),
    };
    setIpAccess(updated);
    localStorage.setItem("dob_ip_access", JSON.stringify(updated));

    toast({
      title: "IP Removed",
      description: "IP address removed from allowed list",
    });
  };

  const validateBackupData = (data: DobBackupData): { valid: boolean; error?: string } => {
    const requiredKeys: (keyof DobBackupData)[] = [
      'dob_settings',
      'dob_admin_credentials',
      'dob_moderators',
      'dob_super_moderators',
      'dob_feature_toggles',
      'dob_ip_access',
      'dob_employees',
      'dob_entries',
    ];

    const dataKeys = Object.keys(data);
    const missingKeys = requiredKeys.filter(key => !dataKeys.includes(key));
    
    if (missingKeys.length > 0) {
      return { valid: false, error: `Missing required data: ${missingKeys.join(', ')}` };
    }

    for (const key of requiredKeys) {
      const value = data[key];
      
      if (value === null || value === undefined) {
        return { valid: false, error: `Required field ${key} is null or undefined` };
      }

      if (key === 'dob_settings' || key === 'dob_feature_toggles' || key === 'dob_ip_access' || key === 'dob_admin_credentials') {
        if (typeof value !== 'object' || Array.isArray(value)) {
          return { valid: false, error: `${key} must be an object` };
        }
      } else {
        if (!Array.isArray(value)) {
          return { valid: false, error: `${key} must be an array` };
        }
      }
    }

    return { valid: true };
  };

  const handleExportData = () => {
    try {
      const allData: DobBackupData = {};
      
      const requiredKeys: (keyof DobBackupData)[] = [
        'dob_settings',
        'dob_admin_credentials',
        'dob_moderators',
        'dob_super_moderators',
        'dob_feature_toggles',
        'dob_ip_access',
        'dob_employees',
        'dob_entries',
      ];

      const optionalKeys: (keyof DobBackupData)[] = [
        'dob_jela_reporters',
        'dob_attendance',
        'dob_complaints',
        'dob_expense_sheets',
        'dob_requisition_sheets',
        'dob_upload_schedules',
        'dob_work_categories',
        'dob_work_notes',
        'dob_voice_artists',
        'dob_voice_work',
      ];

      requiredKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            allData[key] = JSON.parse(value);
          } catch {
            allData[key] = value;
          }
        }
      });

      optionalKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            allData[key] = JSON.parse(value);
          } catch {
            allData[key] = value;
          }
        }
      });

      const exportObject: DobBackupPayload = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        application: 'DOB Performance Tracker',
        data: allData,
      };

      const dataStr = JSON.stringify(exportObject, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `dob-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "All website data has been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a JSON file",
        variant: "destructive",
      });
      return;
    }

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!parsed.version || !parsed.data || !parsed.application) {
          throw new Error("Invalid backup file structure - missing required fields");
        }

        if (parsed.application !== 'DOB Performance Tracker') {
          throw new Error("This backup file is not from DOB Performance Tracker");
        }

        if (typeof parsed.data !== 'object' || parsed.data === null || Array.isArray(parsed.data)) {
          throw new Error("Invalid backup file structure - data must be an object");
        }

        const validationResult = validateBackupData(parsed.data);
        if (!validationResult.valid) {
          throw new Error(validationResult.error || "Invalid backup data structure");
        }

        setImportData(parsed as DobBackupPayload);
        setShowImportConfirm(true);
      } catch (error) {
        toast({
          title: "Invalid Backup File",
          description: error instanceof Error ? error.message : "Unable to parse the backup file",
          variant: "destructive",
        });
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    try {
      if (!importData || !importData.data) {
        throw new Error("No import data available");
      }

      const validationResult = validateBackupData(importData.data);
      if (!validationResult.valid) {
        throw new Error(validationResult.error || "Invalid backup data structure");
      }

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('dob_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      Object.entries(importData.data).forEach(([key, value]) => {
        if (value !== undefined) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      setShowImportConfirm(false);
      setImportFile(null);
      setImportData(null);

      toast({
        title: "Import Successful",
        description: "All data has been restored. The page will reload in 2 seconds.",
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An error occurred while importing data",
        variant: "destructive",
      });
    }
  };

  const handleCancelImport = () => {
    setShowImportConfirm(false);
    setImportFile(null);
    setImportData(null);
  };

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />
      <div className="w-full px-4 md:px-6 py-6 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-7 h-7 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage application settings, security, credentials, and user access control
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    <CardTitle>General Settings</CardTitle>
                  </div>
                  <CardDescription>Configure month and award messages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentMonth">Current Month for Awards</Label>
                    <Input
                      id="currentMonth"
                      type="month"
                      value={adminSettings.currentMonth}
                      onChange={(e) => setAdminSettings({ ...adminSettings, currentMonth: e.target.value })}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Set the month for which Employee of the Month awards will be calculated
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Employee of the Month Message</Label>
                    <Textarea
                      id="message"
                      value={adminSettings.employeeOfMonthMessage}
                      onChange={(e) => setAdminSettings({ ...adminSettings, employeeOfMonthMessage: e.target.value })}
                      placeholder="Enter custom award message"
                      className="min-h-28 resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Customize the message displayed on the rankings page
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {adminSettings.employeeOfMonthMessage.length} characters
                      </span>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    Save Settings
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-purple-200 dark:border-purple-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ToggleLeft className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-purple-700 dark:text-purple-400">Feature Control</CardTitle>
                  </div>
                  <CardDescription>Enable or disable application modules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: "voiceArtist", label: "Voice Artist Module", desc: "Manage voice artists, work entries, and billing", enabled: voiceArtistEnabled },
                    { id: "attendance", label: "Daily Attendance Module", desc: "Track employee attendance and working hours", enabled: attendanceEnabled },
                    { id: "workFlow", label: "Work Flow Module", desc: "Visual task management and job assignment dashboard", enabled: workFlowEnabled },
                    { id: "videoUploadTime", label: "Video Upload Time Module", desc: "Manage daily upload schedule for all video categories", enabled: videoUploadTimeEnabled },
                  ].map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex-1">
                        <Label htmlFor={`${feature.id}Toggle`} className="text-sm font-medium cursor-pointer">
                          {feature.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {feature.desc}
                        </p>
                      </div>
                      <Switch
                        id={`${feature.id}Toggle`}
                        checked={feature.enabled}
                        onCheckedChange={(checked) => handleToggleFeature(feature.id as any, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-cyan-200 dark:border-cyan-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-cyan-600" />
                    <CardTitle className="text-cyan-700 dark:text-cyan-400">💬 Chat Box Settings</CardTitle>
                  </div>
                  <CardDescription>Configure real-time chat features and controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <Label htmlFor="chatEnabledToggle" className="text-sm font-medium cursor-pointer">
                        Enable Chat Box
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Turn on/off the real-time chat system for all users
                      </p>
                    </div>
                    <Switch
                      id="chatEnabledToggle"
                      checked={settings.enabled}
                      onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                    />
                  </div>

                  {settings.enabled && (
                    <>
                      <Separator />
                      
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex-1">
                          <Label htmlFor="fileSharingToggle" className="text-sm font-medium cursor-pointer">
                            📸 Enable File & Image Sharing
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Allow users to send images and files in chat
                          </p>
                        </div>
                        <Switch
                          id="fileSharingToggle"
                          checked={settings.fileSharingEnabled}
                          onCheckedChange={(checked) => updateSettings({ fileSharingEnabled: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex-1">
                          <Label htmlFor="moderatorOnlyToggle" className="text-sm font-medium cursor-pointer">
                            🔒 Moderator Only Chat Mode
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Only moderators and admins can send messages
                          </p>
                        </div>
                        <Switch
                          id="moderatorOnlyToggle"
                          checked={settings.moderatorOnlyMode}
                          onCheckedChange={(checked) => updateSettings({ moderatorOnlyMode: checked })}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">🧹 Chat Management</Label>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full gap-2">
                              <Trash2 className="w-4 h-4" />
                              Clear All Chat Data
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Clear All Chat Messages?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all chat messages and history. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={clearAllMessages} className="bg-destructive text-destructive-foreground">
                                Clear All Messages
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-400 space-y-2">
                          <p className="font-medium">✨ Chat Box Features:</p>
                          <ul className="space-y-1 ml-4 list-disc">
                            <li>Real-time messaging with WebSocket</li>
                            <li>Online/Offline status indicators</li>
                            <li>File & image sharing (admin controlled)</li>
                            <li>Pin important messages to the top</li>
                            <li>Timestamps and read receipts (✔️)</li>
                            <li>Mute or block specific users</li>
                            <li>Moderator-only chat mode</li>
                          </ul>
                        </div>

                        {blockedUsers.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">🚫 Blocked Users ({blockedUsers.length})</Label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {blockedUsers.map((blocked) => (
                                <div key={blocked.userId} className="flex items-center justify-between p-2 rounded border bg-red-50 dark:bg-red-950/20">
                                  <span className="text-sm">{blocked.userName}</span>
                                  <Button
                                    onClick={() => unblockUser(blocked.userId)}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    Unblock
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {mutedUsers.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">🔇 Muted Users ({mutedUsers.length})</Label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {mutedUsers.map((muted) => (
                                <div key={muted.userId} className="flex items-center justify-between p-2 rounded border bg-yellow-50 dark:bg-yellow-950/20">
                                  <span className="text-sm">{muted.userName}</span>
                                  <Button
                                    onClick={() => unmuteUser(muted.userId)}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    Unmute
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-red-700 dark:text-red-400">IP Access Control</CardTitle>
                  </div>
                  <CardDescription>Restrict access to specific IP addresses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <Label htmlFor="ipAccessToggle" className="text-sm font-medium cursor-pointer">
                        Enable IP Access Restriction
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        When enabled, only users from allowed IPs can access the system
                      </p>
                    </div>
                    <Switch
                      id="ipAccessToggle"
                      checked={ipAccess.enabled}
                      onCheckedChange={handleToggleIPAccess}
                    />
                  </div>

                  {ipAccess.enabled && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Allowed IP Addresses</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., 103.120.10.50"
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddIP()}
                            className="flex-1"
                          />
                          <Button onClick={handleAddIP} size="sm">
                            Add IP
                          </Button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {ipAccess.allowedIPs.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No IPs added. Add IP addresses to restrict access.
                            </p>
                          ) : (
                            ipAccess.allowedIPs.map((ip) => (
                              <div key={ip} className="flex items-center justify-between p-2 rounded border bg-muted/50">
                                <code className="text-sm font-mono">{ip}</code>
                                <Button
                                  onClick={() => handleRemoveIP(ip)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="text-xs text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-900">
                          <p className="font-medium mb-1">Warning:</p>
                          <p>When IP restriction is active, users from unlisted IPs will see: "Access denied: your IP is not authorized"</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-blue-700 dark:text-blue-400">Import & Export</CardTitle>
                  </div>
                  <CardDescription>Backup and restore all website data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border bg-card space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Export All Data</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Download a complete backup of all website data including employees, content performance, 
                        voice artists, work records, attendance, tasks, and all settings.
                      </p>
                      <Button onClick={handleExportData} className="w-full gap-2" variant="outline">
                        <Download className="w-4 h-4" />
                        Export Data (JSON)
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="p-4 rounded-lg border bg-card space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Import Data</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Restore website data from a previously exported backup file. 
                        This will replace all current data.
                      </p>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept=".json"
                          onChange={handleFileSelect}
                          className="cursor-pointer"
                        />
                        {importFile && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            File selected: {importFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-900">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Export creates a complete backup of all data</li>
                      <li>Import will replace all existing data</li>
                      <li>You'll be asked to confirm before importing</li>
                      <li>Keep backup files safe and secure</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 dark:border-amber-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-600" />
                    <CardTitle className="text-amber-700 dark:text-amber-400">Change Admin Login</CardTitle>
                  </div>
                  <CardDescription>Update admin credentials securely</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="currentAdminId" className="text-sm">Current Admin ID</Label>
                      <Input
                        id="currentAdminId"
                        type="text"
                        value={currentAdminId}
                        onChange={(e) => setCurrentAdminId(e.target.value)}
                        placeholder="Enter current admin ID"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="currentAdminPassword" className="text-sm">Current Password</Label>
                      <Input
                        id="currentAdminPassword"
                        type="password"
                        value={currentAdminPassword}
                        onChange={(e) => setCurrentAdminPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="newAdminId" className="text-sm">New Admin ID</Label>
                      <Input
                        id="newAdminId"
                        type="text"
                        value={newAdminId}
                        onChange={(e) => setNewAdminId(e.target.value)}
                        placeholder="Enter new admin ID"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="newAdminPassword" className="text-sm">New Password</Label>
                      <Input
                        id="newAdminPassword"
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Min 6 characters"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmNewPassword" className="text-sm">Confirm Password</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <Button onClick={handleChangeAdminCredentials} className="w-full gap-2 bg-amber-600 hover:bg-amber-700">
                    <Key className="w-4 h-4" />
                    Update Admin Credentials
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-destructive" />
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  </div>
                  <CardDescription>Irreversible actions that affect all data</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full gap-2">
                        <Trash2 className="w-4 h-4" />
                        Reset All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all performance
                          entries, employee data, and reset settings to defaults.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetAllData}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Reset Everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-blue-200 dark:border-blue-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-blue-700 dark:text-blue-400">Moderator Management</CardTitle>
                  </div>
                  <CardDescription>Add and manage moderator accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2.5">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add New Moderator
                    </h3>
                    <div className="space-y-2">
                      <Input
                        placeholder="Full Name"
                        value={newModName}
                        onChange={(e) => setNewModName(e.target.value)}
                        className="h-9"
                      />
                      <Input
                        placeholder="User ID"
                        value={newModUserId}
                        onChange={(e) => setNewModUserId(e.target.value)}
                        className="h-9"
                      />
                      <Input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={newModPassword}
                        onChange={(e) => setNewModPassword(e.target.value)}
                        className="h-9"
                      />
                      <Button onClick={handleAddModerator} className="w-full gap-2" size="sm">
                        <UserPlus className="w-4 h-4" />
                        Add Moderator
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Existing Moderators ({moderators.length})</h3>
                    {moderators.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No moderators yet. Add one above to get started.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {moderators.map((mod, index) => (
                          <div key={mod.id} className="border rounded-lg p-3 space-y-2 bg-card">
                            {editingMod === mod.id ? (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Name"
                                  value={editModName}
                                  onChange={(e) => setEditModName(e.target.value)}
                                  className="h-8 text-sm"
                                />
                                <Input
                                  placeholder="User ID"
                                  value={editModUserId}
                                  onChange={(e) => setEditModUserId(e.target.value)}
                                  className="h-8 text-sm"
                                />
                                <Input
                                  type="password"
                                  placeholder="Password"
                                  value={editModPassword}
                                  onChange={(e) => setEditModPassword(e.target.value)}
                                  className="h-8 text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleSaveEditModerator(mod.id)}
                                    size="sm"
                                    className="flex-1 h-8"
                                  >
                                    <Save className="w-3 h-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    onClick={() => setEditingMod(null)}
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 h-8"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                                      <p className="font-medium text-sm">{mod.name}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      ID: <span className="font-mono">{mod.userId}</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    onClick={() => handleEditModerator(mod)}
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 gap-1 h-8"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive" className="flex-1 gap-1 h-8">
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Moderator?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete {mod.name}? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteModerator(mod.id, mod.name)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-green-700 dark:text-green-400">Super Moderator Management</CardTitle>
                  </div>
                  <CardDescription>Create super moderators with custom permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog open={showAddSuperMod} onOpenChange={setShowAddSuperMod}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                        <UserPlus className="w-4 h-4" />
                        Create Super Moderator
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Super Moderator</DialogTitle>
                        <DialogDescription>
                          Create a new super moderator with customizable permissions
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="superModName">Full Name</Label>
                          <Input
                            id="superModName"
                            placeholder="Enter full name"
                            value={newSuperModName}
                            onChange={(e) => setNewSuperModName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="superModUserId">User ID</Label>
                          <Input
                            id="superModUserId"
                            placeholder="Enter unique user ID"
                            value={newSuperModUserId}
                            onChange={(e) => setNewSuperModUserId(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="superModPassword">Password</Label>
                          <Input
                            id="superModPassword"
                            type="password"
                            placeholder="Min 6 characters"
                            value={newSuperModPassword}
                            onChange={(e) => setNewSuperModPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddSuperModerator} className="w-full">
                          Create Super Moderator
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Super Moderators ({superModerators.length})</h3>
                    {superModerators.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No super moderators yet. Create one to get started.
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {superModerators.map((sm) => (
                          <div key={sm.id} className="border rounded-lg p-3 space-y-3 bg-card">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{sm.name}</p>
                                <p className="text-xs text-muted-foreground">ID: {sm.userId}</p>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => setEditingSuperMod(sm)}>
                                    <Edit className="w-3 h-3 mr-1" />
                                    Permissions
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Edit Permissions - {sm.name}</DialogTitle>
                                    <DialogDescription>
                                      Configure what {sm.name} can view, add, edit, or delete
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    {[
                                      { key: "Dashboard", permissions: ["View", "Add", "Edit", "Delete"] },
                                      { key: "VoiceArtist", permissions: ["View", "Add", "Edit", "Delete"] },
                                      { key: "Attendance", permissions: ["View", "Add", "Edit", "Delete"] },
                                      { key: "WorkFlow", permissions: ["View", "Add", "Edit", "Delete"] },
                                      { key: "VideoUpload", permissions: ["View", "Add", "Edit", "Delete"] },
                                      { key: "ComplaintBox", permissions: ["View", "Add"] },
                                      { key: "Requisition", permissions: ["View", "Add", "Edit", "Delete"] },
                                      { key: "Expense", permissions: ["View", "Add", "Edit", "Delete"] },
                                    ].map((section) => (
                                      <div key={section.key} className="space-y-2 p-3 border rounded-lg">
                                        <h4 className="font-medium text-sm">{section.key}</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                          {section.permissions.map((perm) => {
                                            const permKey = `can${perm}${section.key}` as keyof SuperModeratorPermissions;
                                            return (
                                              <div key={perm} className="flex items-center space-x-2">
                                                <Switch
                                                  id={`${sm.id}-${permKey}`}
                                                  checked={sm.permissions[permKey]}
                                                  onCheckedChange={(checked) => handleUpdateSuperModPermission(sm.id, permKey, checked)}
                                                />
                                                <Label htmlFor={`${sm.id}-${permKey}`} className="text-xs cursor-pointer">
                                                  {perm}
                                                </Label>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="w-full gap-1">
                                  <Trash2 className="w-3 h-3" />
                                  Delete Super Moderator
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Super Moderator?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {sm.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSuperModerator(sm.id, sm.name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Data Import</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to import data from{' '}
              <span className="font-semibold text-foreground">{importFile?.name}</span>.
              <br /><br />
              <span className="text-destructive font-medium">Warning:</span> This will replace all existing website data including:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Employee records and content performance data</li>
                <li>Voice artist details and work records</li>
                <li>Attendance records and work flow tasks</li>
                <li>All settings, moderators, and configurations</li>
              </ul>
              <br />
              {importData && (
                <div className="text-xs bg-muted p-2 rounded mt-2">
                  <p><strong>Backup Info:</strong></p>
                  <p>Exported: {new Date(importData.exportDate).toLocaleString()}</p>
                  <p>Version: {importData.version}</p>
                </div>
              )}
              <br />
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelImport}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmImport}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import & Replace Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

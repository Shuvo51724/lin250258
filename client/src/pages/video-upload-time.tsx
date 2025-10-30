import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UploadSchedule {
  id: string;
  videoCategory: string;
  channelYT: string;
  pageFB: string;
  deliverTime: string;
  uploadTime: string;
}

export default function VideoUploadTime() {
  const [schedules, setSchedules] = useState<UploadSchedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<UploadSchedule | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasPermission, userRole } = useAuth();
  const canEdit = userRole === "admin" || hasPermission("canEditVideoUpload") || hasPermission("canAddVideoUpload");

  const [formData, setFormData] = useState<Omit<UploadSchedule, "id">>({
    videoCategory: "",
    channelYT: "",
    pageFB: "",
    deliverTime: "",
    uploadTime: "",
  });

  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem("dob_upload_schedules");
        if (stored) {
          setSchedules(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load upload schedules:", error);
      }
    };
    loadData();
  }, []);

  const saveSchedules = (newSchedules: UploadSchedule[]) => {
    setSchedules(newSchedules);
    localStorage.setItem("dob_upload_schedules", JSON.stringify(newSchedules));
  };

  const handleAdd = () => {
    if (!formData.videoCategory.trim()) {
      toast({
        title: "Error",
        description: "Video Category is required",
        variant: "destructive",
      });
      return;
    }

    const newSchedule: UploadSchedule = {
      id: Date.now().toString(),
      ...formData,
    };

    saveSchedules([...schedules, newSchedule]);
    setFormData({
      videoCategory: "",
      channelYT: "",
      pageFB: "",
      deliverTime: "",
      uploadTime: "",
    });
    setIsAddingNew(false);
    toast({
      title: "Success",
      description: "Upload schedule added successfully",
    });
  };

  const handleUpdate = () => {
    if (!editingSchedule) return;

    if (!formData.videoCategory.trim()) {
      toast({
        title: "Error",
        description: "Video Category is required",
        variant: "destructive",
      });
      return;
    }

    const updatedSchedules = schedules.map(schedule =>
      schedule.id === editingSchedule.id
        ? { ...editingSchedule, ...formData }
        : schedule
    );

    saveSchedules(updatedSchedules);
    setEditingSchedule(null);
    setFormData({
      videoCategory: "",
      channelYT: "",
      pageFB: "",
      deliverTime: "",
      uploadTime: "",
    });
    toast({
      title: "Success",
      description: "Upload schedule updated successfully",
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;

    const newSchedules = schedules.filter(s => s.id !== deleteId);
    saveSchedules(newSchedules);
    setDeleteId(null);
    toast({
      title: "Success",
      description: "Upload schedule deleted successfully",
    });
  };

  const handleEdit = (schedule: UploadSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      videoCategory: schedule.videoCategory,
      channelYT: schedule.channelYT,
      pageFB: schedule.pageFB,
      deliverTime: schedule.deliverTime,
      uploadTime: schedule.uploadTime,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    setFormData({
      videoCategory: "",
      channelYT: "",
      pageFB: "",
      deliverTime: "",
      uploadTime: "",
    });
    setIsAddingNew(false);
    setEditingSchedule(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      
      <main className="flex-grow w-full px-6 py-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Video Upload Time</h1>
            <p className="text-muted-foreground">Manage daily upload schedule for all video categories</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            {canEdit && (
              <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Upload Schedule</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Video Category *</label>
                      <Input
                        placeholder="e.g., News, Entertainment, Sports"
                        value={formData.videoCategory}
                        onChange={(e) => setFormData({ ...formData, videoCategory: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Channel (YouTube)</label>
                      <Input
                        placeholder="YouTube upload time"
                        value={formData.channelYT}
                        onChange={(e) => setFormData({ ...formData, channelYT: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Page (Facebook)</label>
                      <Input
                        placeholder="Facebook upload time"
                        value={formData.pageFB}
                        onChange={(e) => setFormData({ ...formData, pageFB: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Script/Footage Deliver Time</label>
                      <Input
                        placeholder="e.g., 10:00 AM"
                        value={formData.deliverTime}
                        onChange={(e) => setFormData({ ...formData, deliverTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Upload Time</label>
                      <Input
                        placeholder="e.g., 2:00 PM"
                        value={formData.uploadTime}
                        onChange={(e) => setFormData({ ...formData, uploadTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button onClick={handleAdd}>Add Schedule</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-card-border overflow-hidden">
          <div className="print-header hidden print:block p-6 text-center border-b">
            <h2 className="text-2xl font-bold">Daily Our Bangladesh</h2>
            <h3 className="text-xl">Video Upload Time Schedule</h3>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Video Category</TableHead>
                  <TableHead className="font-bold">Channel (YT)</TableHead>
                  <TableHead className="font-bold">Page (FB)</TableHead>
                  <TableHead className="font-bold">Script/Footage Deliver Time</TableHead>
                  <TableHead className="font-bold">Upload Time</TableHead>
                  {canEdit && <TableHead className="font-bold print:hidden">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 6 : 5} className="text-center text-muted-foreground py-8">
                      No upload schedules added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{schedule.videoCategory}</TableCell>
                      <TableCell>{schedule.channelYT || "-"}</TableCell>
                      <TableCell>{schedule.pageFB || "-"}</TableCell>
                      <TableCell>{schedule.deliverTime || "-"}</TableCell>
                      <TableCell>{schedule.uploadTime || "-"}</TableCell>
                      {canEdit && (
                        <TableCell className="print:hidden">
                          <div className="flex gap-2">
                            {canEdit && (
                              <Dialog 
                                open={editingSchedule?.id === schedule.id} 
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setEditingSchedule(null);
                                    resetForm();
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(schedule)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Upload Schedule</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Video Category *</label>
                                    <Input
                                      placeholder="e.g., News, Entertainment, Sports"
                                      value={formData.videoCategory}
                                      onChange={(e) => setFormData({ ...formData, videoCategory: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Channel (YouTube)</label>
                                    <Input
                                      placeholder="YouTube upload time"
                                      value={formData.channelYT}
                                      onChange={(e) => setFormData({ ...formData, channelYT: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Page (Facebook)</label>
                                    <Input
                                      placeholder="Facebook upload time"
                                      value={formData.pageFB}
                                      onChange={(e) => setFormData({ ...formData, pageFB: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Script/Footage Deliver Time</label>
                                    <Input
                                      placeholder="e.g., 10:00 AM"
                                      value={formData.deliverTime}
                                      onChange={(e) => setFormData({ ...formData, deliverTime: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Upload Time</label>
                                    <Input
                                      placeholder="e.g., 2:00 PM"
                                      value={formData.uploadTime}
                                      onChange={(e) => setFormData({ ...formData, uploadTime: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                                  <Button onClick={handleUpdate}>Save Changes</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            )}
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(schedule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the upload schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print-header {
            display: block !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}

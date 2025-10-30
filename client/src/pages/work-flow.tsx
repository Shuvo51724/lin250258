import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, X, Briefcase } from "lucide-react";
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

interface Job {
  id: string;
  name: string;
}

interface PostType {
  id: string;
  name: string;
  jobs: Job[];
}

interface Note {
  id: string;
  to: string;
  for: string;
  message: string;
  createdBy: string;
  createdAt: string;
}

export default function WorkFlow() {
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activePostType, setActivePostType] = useState<string | null>(null);
  const [newPostTypeName, setNewPostTypeName] = useState("");
  const [newJobName, setNewJobName] = useState("");
  const [newNoteTo, setNewNoteTo] = useState("");
  const [newNoteFor, setNewNoteFor] = useState("");
  const [newNoteMessage, setNewNoteMessage] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingPostType, setEditingPostType] = useState<PostType | null>(null);
  const [editingJob, setEditingJob] = useState<{ job: Job; postTypeId: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "postType" | "job" | "note"; id: string; postTypeId?: string } | null>(null);
  const [showAddPostTypeDialog, setShowAddPostTypeDialog] = useState(false);
  const [showAddJobDialog, setShowAddJobDialog] = useState(false);
  const { toast } = useToast();
  const { hasPermission, userId, userRole } = useAuth();
  const canEdit = userRole === "admin" || hasPermission("canEditWorkFlow") || hasPermission("canAddWorkFlow");

  useEffect(() => {
    const loadData = () => {
      try {
        const storedPostTypes = localStorage.getItem("dob_work_categories");
        const storedNotes = localStorage.getItem("dob_work_notes");
        
        if (storedPostTypes) {
          setPostTypes(JSON.parse(storedPostTypes));
        }
        if (storedNotes) {
          setNotes(JSON.parse(storedNotes));
        }
      } catch (error) {
        console.error("Failed to load work flow data:", error);
      }
    };
    loadData();
  }, []);

  const savePostTypes = (newPostTypes: PostType[]) => {
    setPostTypes(newPostTypes);
    localStorage.setItem("dob_work_categories", JSON.stringify(newPostTypes));
  };

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem("dob_work_notes", JSON.stringify(newNotes));
  };

  const handleAddPostType = () => {
    if (!newPostTypeName.trim()) {
      toast({
        title: "Error",
        description: "Post Type name is required",
        variant: "destructive",
      });
      return;
    }

    const newPostType: PostType = {
      id: Date.now().toString(),
      name: newPostTypeName.trim(),
      jobs: [],
    };

    savePostTypes([...postTypes, newPostType]);
    setNewPostTypeName("");
    setShowAddPostTypeDialog(false);
    toast({
      title: "Success",
      description: "Post Type added successfully",
    });
  };

  const handleUpdatePostType = () => {
    if (!editingPostType || !editingPostType.name.trim()) {
      toast({
        title: "Error",
        description: "Post Type name is required",
        variant: "destructive",
      });
      return;
    }

    const updatedPostTypes = postTypes.map(pt => 
      pt.id === editingPostType.id ? editingPostType : pt
    );
    savePostTypes(updatedPostTypes);
    setEditingPostType(null);
    toast({
      title: "Success",
      description: "Post Type updated successfully",
    });
  };

  const handleDeletePostType = () => {
    if (!deleteTarget || deleteTarget.type !== "postType") return;
    
    const newPostTypes = postTypes.filter(pt => pt.id !== deleteTarget.id);
    savePostTypes(newPostTypes);
    setDeleteTarget(null);
    if (activePostType === deleteTarget.id) {
      setActivePostType(null);
    }
    toast({
      title: "Success",
      description: "Post Type deleted successfully",
    });
  };

  const handleAddJob = () => {
    if (!activePostType || !newJobName.trim()) {
      toast({
        title: "Error",
        description: "Job name is required",
        variant: "destructive",
      });
      return;
    }

    const newPostTypes = postTypes.map(pt => {
      if (pt.id === activePostType) {
        return {
          ...pt,
          jobs: [...pt.jobs, { id: Date.now().toString(), name: newJobName.trim() }],
        };
      }
      return pt;
    });

    savePostTypes(newPostTypes);
    setNewJobName("");
    setShowAddJobDialog(false);
    toast({
      title: "Success",
      description: "Job added successfully",
    });
  };

  const handleUpdateJob = () => {
    if (!editingJob || !editingJob.job.name.trim()) {
      toast({
        title: "Error",
        description: "Job name is required",
        variant: "destructive",
      });
      return;
    }

    const updatedPostTypes = postTypes.map(pt => {
      if (pt.id === editingJob.postTypeId) {
        return {
          ...pt,
          jobs: pt.jobs.map(j => j.id === editingJob.job.id ? editingJob.job : j),
        };
      }
      return pt;
    });
    savePostTypes(updatedPostTypes);
    setEditingJob(null);
    toast({
      title: "Success",
      description: "Job updated successfully",
    });
  };

  const handleDeleteJob = () => {
    if (!deleteTarget || deleteTarget.type !== "job" || !deleteTarget.postTypeId) return;

    const newPostTypes = postTypes.map(pt => {
      if (pt.id === deleteTarget.postTypeId) {
        return {
          ...pt,
          jobs: pt.jobs.filter(j => j.id !== deleteTarget.id),
        };
      }
      return pt;
    });

    savePostTypes(newPostTypes);
    setDeleteTarget(null);
    toast({
      title: "Success",
      description: "Job deleted successfully",
    });
  };

  const handleAddNote = () => {
    if (!newNoteTo.trim() || !newNoteFor.trim() || !newNoteMessage.trim()) {
      toast({
        title: "Error",
        description: "All fields (To, For, and Message) are required",
        variant: "destructive",
      });
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      to: newNoteTo.trim(),
      for: newNoteFor.trim(),
      message: newNoteMessage.trim(),
      createdBy: userId || "Unknown",
      createdAt: new Date().toISOString(),
    };

    saveNotes([...notes, newNote]);
    setNewNoteTo("");
    setNewNoteFor("");
    setNewNoteMessage("");
    toast({
      title: "Success",
      description: "Note added successfully",
    });
  };

  const handleUpdateNote = () => {
    if (!editingNote) return;

    const updatedNotes = notes.map(note => 
      note.id === editingNote.id ? editingNote : note
    );
    saveNotes(updatedNotes);
    setEditingNote(null);
    toast({
      title: "Success",
      description: "Note updated successfully",
    });
  };

  const handleDeleteNote = () => {
    if (!deleteTarget || deleteTarget.type !== "note") return;

    const newNotes = notes.filter(n => n.id !== deleteTarget.id);
    saveNotes(newNotes);
    setDeleteTarget(null);
    toast({
      title: "Success",
      description: "Note deleted successfully",
    });
  };

  const activePost = postTypes.find(pt => pt.id === activePostType);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader />
      
      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-3">
              Work Flow
            </h1>
            <p className="text-gray-600 text-lg">Manage your team's workflow and collaboration</p>
          </div>

          {canEdit && !activePostType && (
            <div className="mb-8 flex justify-center">
              <Dialog open={showAddPostTypeDialog} onOpenChange={setShowAddPostTypeDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-8 py-6 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <Plus className="mr-2 h-5 w-5" />
                    Add New Post Type
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Add New Post Type</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="e.g., Desk Reporter, Video Editor"
                    value={newPostTypeName}
                    onChange={(e) => setNewPostTypeName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddPostType()}
                    className="text-lg py-6"
                  />
                  <DialogFooter>
                    <Button onClick={handleAddPostType} className="w-full bg-red-600 hover:bg-red-700">
                      Add Post Type
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="mb-16">
            {!activePostType ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {postTypes.map((postType, index) => (
                  <div
                    key={postType.id}
                    className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-white" />
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPostType({ ...postType });
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Post Type</DialogTitle>
                              </DialogHeader>
                              <Input
                                placeholder="Post type name"
                                value={editingPostType?.name || ""}
                                onChange={(e) => setEditingPostType(editingPostType ? { ...editingPostType, name: e.target.value } : null)}
                                className="py-6"
                              />
                              <DialogFooter>
                                <Button onClick={handleUpdatePostType} className="bg-red-600 hover:bg-red-700">
                                  Save Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ type: "postType", id: postType.id });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{postType.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {postType.jobs.length} {postType.jobs.length === 1 ? 'job' : 'jobs'}
                    </p>
                    <Button
                      onClick={() => setActivePostType(postType.id)}
                      className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl py-5 font-semibold transition-all duration-300"
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-100 to-transparent rounded-full blur-3xl opacity-50"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                        <Briefcase className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-800">{activePost?.name}</h2>
                        <p className="text-gray-500 mt-1">{activePost?.jobs.length || 0} jobs in this category</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setActivePostType(null)}
                      variant="ghost"
                      className="h-12 w-12 rounded-xl hover:bg-gray-100"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>

                  {canEdit && (
                    <div className="mb-8">
                      <Button
                        onClick={() => setShowAddJobDialog(true)}
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Add New Job
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activePost?.jobs.map((job, index) => (
                      <div
                        key={job.id}
                        className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 hover:border-red-300 transition-all duration-300 hover:shadow-lg"
                        style={{
                          animation: `slideIn 0.4s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-800">{job.name}</h4>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                                    onClick={() => setEditingJob({ job: { ...job }, postTypeId: activePostType })}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Job</DialogTitle>
                                  </DialogHeader>
                                  <Input
                                    placeholder="Job name"
                                    value={editingJob?.job.name || ""}
                                    onChange={(e) => setEditingJob(editingJob ? { ...editingJob, job: { ...editingJob.job, name: e.target.value } } : null)}
                                    className="py-6"
                                  />
                                  <DialogFooter>
                                    <Button onClick={handleUpdateJob} className="bg-red-600 hover:bg-red-700">
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600"
                                onClick={() => setDeleteTarget({ type: "job", id: job.id, postTypeId: activePostType })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {activePost?.jobs.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                          <Briefcase className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg">No jobs yet. Add your first job to get started!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">Team Notes</h2>
              <p className="text-gray-600">Collaborate and share important messages</p>
            </div>
            
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Create New Note</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">To:</label>
                    <Input
                      placeholder="Person Name"
                      value={newNoteTo}
                      onChange={(e) => setNewNoteTo(e.target.value)}
                      className="py-6 text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">For:</label>
                    <Input
                      placeholder="Person Name"
                      value={newNoteFor}
                      onChange={(e) => setNewNoteFor(e.target.value)}
                      className="py-6 text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Message:</label>
                    <Textarea
                      placeholder="Enter your message here..."
                      value={newNoteMessage}
                      onChange={(e) => setNewNoteMessage(e.target.value)}
                      rows={4}
                      className="text-lg"
                    />
                  </div>
                  <Button 
                    onClick={handleAddNote} 
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Note
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note, index) => (
                <div
                  key={note.id}
                  className="group relative bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 shadow-md hover:shadow-xl border-2 border-yellow-200 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="inline-block bg-yellow-300 px-3 py-1 rounded-lg mb-2">
                        <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Note</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800">To: {note.to}</h4>
                      <h4 className="text-lg font-bold text-gray-800">For: {note.for}</h4>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-yellow-200"
                            onClick={() => setEditingNote({ ...note })}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Note</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-2 block">To:</label>
                              <Input
                                placeholder="Person Name"
                                value={editingNote?.to || ""}
                                onChange={(e) => setEditingNote(editingNote ? { ...editingNote, to: e.target.value } : null)}
                                className="py-6"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-2 block">For:</label>
                              <Input
                                placeholder="Person Name"
                                value={editingNote?.for || ""}
                                onChange={(e) => setEditingNote(editingNote ? { ...editingNote, for: e.target.value } : null)}
                                className="py-6"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-2 block">Message:</label>
                              <Textarea
                                placeholder="Enter your message here..."
                                value={editingNote?.message || ""}
                                onChange={(e) => setEditingNote(editingNote ? { ...editingNote, message: e.target.value } : null)}
                                rows={4}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleUpdateNote} className="bg-red-600 hover:bg-red-700">
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleteTarget({ type: "note", id: note.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">{note.message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-semibold">{note.createdBy}</span>
                    <span>•</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No notes yet. Create your first note above!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showAddJobDialog} onOpenChange={setShowAddJobDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Job</DialogTitle>
            <p className="text-gray-600">Add a new job to {activePost?.name}</p>
          </DialogHeader>
          <Input
            placeholder="Enter job name"
            value={newJobName}
            onChange={(e) => setNewJobName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddJob()}
            className="text-lg py-6"
          />
          <DialogFooter>
            <Button onClick={handleAddJob} className="w-full bg-red-600 hover:bg-red-700 py-6">
              Add Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteTarget?.type === "postType" ? "Post Type and all its jobs" : deleteTarget?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget?.type === "postType") handleDeletePostType();
                else if (deleteTarget?.type === "job") handleDeleteJob();
                else if (deleteTarget?.type === "note") handleDeleteNote();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

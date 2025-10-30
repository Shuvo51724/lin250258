import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Filter, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import type { Complaint } from "@shared/schema";
import { format } from "date-fns";

export default function ComplaintBox() {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // New complaint form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [showNewComplaintForm, setShowNewComplaintForm] = useState(false);

  // Reply form
  const [replyMessage, setReplyMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("dob_complaints");
    if (stored) {
      setComplaints(JSON.parse(stored));
    }
  }, []);

  const saveComplaints = (newComplaints: Complaint[]) => {
    setComplaints(newComplaints);
    localStorage.setItem("dob_complaints", JSON.stringify(newComplaints));
  };

  const handleSubmitComplaint = () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newComplaint: Complaint = {
      id: crypto.randomUUID(),
      title: title.trim(),
      message: message.trim(),
      submittedBy: user?.name || user?.userId || "Unknown",
      submittedByRole: userRole || "unknown",
      status: "pending",
      priority: priority,
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveComplaints([newComplaint, ...complaints]);
    setTitle("");
    setMessage("");
    setPriority("medium");
    setShowNewComplaintForm(false);

    toast({
      title: "Complaint Submitted",
      description: "Your complaint has been submitted successfully",
    });
  };

  const handleReply = (complaintId: string) => {
    if (!replyMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message",
        variant: "destructive",
      });
      return;
    }

    const updated = complaints.map(complaint => {
      if (complaint.id === complaintId) {
        return {
          ...complaint,
          replies: [
            ...complaint.replies,
            {
              id: crypto.randomUUID(),
              message: replyMessage.trim(),
              repliedBy: user?.name || user?.userId || "Unknown",
              repliedByRole: userRole || "unknown",
              timestamp: new Date().toISOString(),
            }
          ],
          updatedAt: new Date().toISOString(),
        };
      }
      return complaint;
    });

    saveComplaints(updated);
    setReplyMessage("");
    setReplyingTo(null);

    toast({
      title: "Reply Added",
      description: "Your reply has been added successfully",
    });
  };

  const handleUpdateStatus = (complaintId: string, newStatus: Complaint["status"]) => {
    const updated = complaints.map(complaint => 
      complaint.id === complaintId 
        ? { ...complaint, status: newStatus, updatedAt: new Date().toISOString() } 
        : complaint
    );
    saveComplaints(updated);

    toast({
      title: "Status Updated",
      description: `Complaint status updated to ${newStatus}`,
    });
  };

  const handleDeleteComplaint = (complaintId: string) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can delete complaints",
        variant: "destructive",
      });
      return;
    }

    const updated = complaints.filter(c => c.id !== complaintId);
    saveComplaints(updated);

    toast({
      title: "Complaint Deleted",
      description: "The complaint has been removed",
    });
  };

  const getStatusIcon = (status: Complaint["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in-progress":
        return <AlertCircle className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "closed":
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Complaint["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-300";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityColor = (priority: Complaint["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = filterStatus === "all" || complaint.status === filterStatus;
    const matchesPriority = filterPriority === "all" || complaint.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <div className="w-full px-6 py-6 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Complaint Box</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Submit and track complaints or requests
              </p>
            </div>
            <Button onClick={() => setShowNewComplaintForm(!showNewComplaintForm)} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              New Complaint
            </Button>
          </div>

          {showNewComplaintForm && (
            <Card className="mb-6 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Submit New Complaint</CardTitle>
                <CardDescription>Describe your issue or request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Title</label>
                  <Input
                    placeholder="Brief description of the issue"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Priority</label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Message</label>
                  <Textarea
                    placeholder="Describe your complaint or request in detail"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmitComplaint}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Complaint
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewComplaintForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-6 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Priority</label>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complaints List */}
          <div className="space-y-4">
            {filteredComplaints.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No complaints found</p>
                </CardContent>
              </Card>
            ) : (
              filteredComplaints.map((complaint) => (
                <Card key={complaint.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{complaint.title}</CardTitle>
                          <Badge className={`gap-1 border ${getStatusColor(complaint.status)}`}>
                            {getStatusIcon(complaint.status)}
                            {complaint.status}
                          </Badge>
                          <Badge className={`gap-1 border ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </Badge>
                        </div>
                        <CardDescription>
                          Submitted by {complaint.submittedBy} ({complaint.submittedByRole}) •{" "}
                          {format(new Date(complaint.createdAt), "PPp")}
                        </CardDescription>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Select
                            value={complaint.status}
                            onValueChange={(value: any) => handleUpdateStatus(complaint.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteComplaint(complaint.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{complaint.message}</p>
                    </div>

                    {/* Replies */}
                    {complaint.replies.length > 0 && (
                      <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                        {complaint.replies.map((reply) => (
                          <div key={reply.id} className="bg-card border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium">{reply.repliedBy}</span>
                              <Badge variant="outline" className="text-xs">
                                {reply.repliedByRole}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {format(new Date(reply.timestamp), "PPp")}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Form */}
                    {isAdmin && replyingTo === complaint.id ? (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleReply(complaint.id)} size="sm">
                            <Send className="w-3 h-3 mr-2" />
                            Send Reply
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyingTo(complaint.id)}
                      >
                        Reply
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { Mic, UserPlus, Edit, Trash2, Save, X, FileText, Printer } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface VoiceArtist {
  id: string;
  name: string;
  phone: string;
  perMinuteRate: number;
  notes: string;
  createdAt: string;
}

interface VoiceWorkEntry {
  id: string;
  date: string;
  title: string;
  artistId: string;
  artistName: string;
  minute: number;
  second: number;
  totalMin: number;
  totalBill: number;
  createdAt: string;
}

export default function VoiceArtist() {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [artists, setArtists] = useState<VoiceArtist[]>([]);
  const [workEntries, setWorkEntries] = useState<VoiceWorkEntry[]>([]);
  const [editingArtist, setEditingArtist] = useState<string | null>(null);

  // Artist form
  const [artistName, setArtistName] = useState("");
  const [artistPhone, setArtistPhone] = useState("");
  const [artistRate, setArtistRate] = useState("");
  const [artistNotes, setArtistNotes] = useState("");

  // Work entry form
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10));
  const [workTitle, setWorkTitle] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [workMinute, setWorkMinute] = useState("");
  const [workSecond, setWorkSecond] = useState("");

  // Bill report
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const storedArtists = localStorage.getItem("dob_voice_artists");
    if (storedArtists) {
      setArtists(JSON.parse(storedArtists));
    }

    const storedWork = localStorage.getItem("dob_voice_work");
    if (storedWork) {
      setWorkEntries(JSON.parse(storedWork));
    }
  }, []);

  const handleAddArtist = () => {
    if (!artistName || !artistPhone) {
      toast({
        title: "Invalid Input",
        description: "Please fill in name and phone number",
        variant: "destructive",
      });
      return;
    }

    const rate = parseFloat(artistRate) || 0;

    const newArtist: VoiceArtist = {
      id: crypto.randomUUID(),
      name: artistName,
      phone: artistPhone,
      perMinuteRate: rate,
      notes: artistNotes,
      createdAt: new Date().toISOString(),
    };

    const updated = [...artists, newArtist];
    setArtists(updated);
    localStorage.setItem("dob_voice_artists", JSON.stringify(updated));

    setArtistName("");
    setArtistPhone("");
    setArtistRate("");
    setArtistNotes("");

    toast({
      title: "Voice Artist Added",
      description: `${artistName} has been added successfully`,
    });
  };

  const handleEditArtist = (artist: VoiceArtist) => {
    setEditingArtist(artist.id);
    setArtistName(artist.name);
    setArtistPhone(artist.phone);
    setArtistRate(artist.perMinuteRate.toString());
    setArtistNotes(artist.notes);
  };

  const handleSaveEditArtist = () => {
    if (!editingArtist) return;

    const updated = artists.map(artist =>
      artist.id === editingArtist
        ? {
            ...artist,
            name: artistName,
            phone: artistPhone,
            perMinuteRate: parseFloat(artistRate) || 0,
            notes: artistNotes,
          }
        : artist
    );
    setArtists(updated);
    localStorage.setItem("dob_voice_artists", JSON.stringify(updated));
    
    setEditingArtist(null);
    setArtistName("");
    setArtistPhone("");
    setArtistRate("");
    setArtistNotes("");

    toast({
      title: "Artist Updated",
      description: "Voice artist information has been updated",
    });
  };

  const handleDeleteArtist = (id: string, name: string) => {
    const updated = artists.filter(artist => artist.id !== id);
    setArtists(updated);
    localStorage.setItem("dob_voice_artists", JSON.stringify(updated));

    toast({
      title: "Artist Removed",
      description: `${name} has been removed`,
    });
  };

  const handleAddWorkEntry = () => {
    if (!workDate || !workTitle || !selectedArtistId) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const artist = artists.find(a => a.id === selectedArtistId);
    if (!artist) return;

    const min = parseInt(workMinute) || 0;
    const sec = parseInt(workSecond) || 0;
    const totalMin = min + sec / 60;
    const totalBill = totalMin * artist.perMinuteRate;

    const newEntry: VoiceWorkEntry = {
      id: crypto.randomUUID(),
      date: workDate,
      title: workTitle,
      artistId: artist.id,
      artistName: artist.name,
      minute: min,
      second: sec,
      totalMin: parseFloat(totalMin.toFixed(2)),
      totalBill: parseFloat(totalBill.toFixed(2)),
      createdAt: new Date().toISOString(),
    };

    const updated = [...workEntries, newEntry];
    setWorkEntries(updated);
    localStorage.setItem("dob_voice_work", JSON.stringify(updated));

    setWorkDate(new Date().toISOString().slice(0, 10));
    setWorkTitle("");
    setSelectedArtistId("");
    setWorkMinute("");
    setWorkSecond("");

    toast({
      title: "Work Entry Added",
      description: `Entry for ${artist.name} has been recorded`,
    });
  };

  const handleDeleteWorkEntry = (id: string) => {
    const updated = workEntries.filter(entry => entry.id !== id);
    setWorkEntries(updated);
    localStorage.setItem("dob_voice_work", JSON.stringify(updated));

    toast({
      title: "Entry Deleted",
      description: "Work entry has been removed",
    });
  };

  const billReport = useMemo(() => {
    const filtered = workEntries.filter(entry => {
      const entryMonth = entry.date.slice(0, 7);
      return entryMonth === selectedMonth;
    });

    const grouped: Record<string, { name: string; totalMin: number; totalBill: number }> = {};

    filtered.forEach(entry => {
      if (!grouped[entry.artistId]) {
        grouped[entry.artistId] = {
          name: entry.artistName,
          totalMin: 0,
          totalBill: 0,
        };
      }
      grouped[entry.artistId].totalMin += entry.totalMin;
      grouped[entry.artistId].totalBill += entry.totalBill;
    });

    return Object.entries(grouped).map(([artistId, data]) => ({
      artistId,
      name: data.name,
      totalMin: parseFloat(data.totalMin.toFixed(2)),
      totalBill: parseFloat(data.totalBill.toFixed(2)),
    }));
  }, [workEntries, selectedMonth]);

  const totalBill = billReport.reduce((sum, item) => sum + item.totalBill, 0);

  const handlePrintBill = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />
      <div className="w-full px-6 py-6 flex-1 print:p-0">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Mic className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Voice Artist Management</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage voice artists, track work, and generate bills
          </p>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="print:hidden">
            <TabsTrigger value="setup">Voice Artist Setup</TabsTrigger>
            <TabsTrigger value="work">Voice Work Entry</TabsTrigger>
            <TabsTrigger value="bill">Voice Artist Bill</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            {isAdmin && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <CardTitle>Add New Voice Artist</CardTitle>
                  </div>
                  <CardDescription>Add external voice artists to the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="artistName">Name *</Label>
                      <Input
                        id="artistName"
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        placeholder="Enter artist name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistPhone">Phone Number *</Label>
                      <Input
                        id="artistPhone"
                        value={artistPhone}
                        onChange={(e) => setArtistPhone(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistRate">Per Minute Rate (৳)</Label>
                      <Input
                        id="artistRate"
                        type="number"
                        step="0.01"
                        value={artistRate}
                        onChange={(e) => setArtistRate(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistNotes">Notes</Label>
                      <Input
                        id="artistNotes"
                        value={artistNotes}
                        onChange={(e) => setArtistNotes(e.target.value)}
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={editingArtist ? handleSaveEditArtist : handleAddArtist} 
                    className="w-full gap-2"
                  >
                    {editingArtist ? (
                      <>
                        <Save className="w-4 h-4" />
                        Update Artist
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Add Artist
                      </>
                    )}
                  </Button>
                  {editingArtist && (
                    <Button 
                      onClick={() => {
                        setEditingArtist(null);
                        setArtistName("");
                        setArtistPhone("");
                        setArtistRate("");
                        setArtistNotes("");
                      }} 
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {isAdmin ? (
              <Card>
                <CardHeader>
                  <CardTitle>Voice Artists ({artists.length})</CardTitle>
                  <CardDescription>Manage existing voice artists</CardDescription>
                </CardHeader>
                <CardContent>
                  {artists.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No voice artists added yet. Add one above to get started.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 text-sm font-medium">SL</th>
                            <th className="text-left py-3 px-4 text-sm font-medium">Name</th>
                            <th className="text-left py-3 px-4 text-sm font-medium">Phone</th>
                            <th className="text-left py-3 px-4 text-sm font-medium">Rate (৳/min)</th>
                            <th className="text-left py-3 px-4 text-sm font-medium">Notes</th>
                            <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {artists.map((artist, index) => (
                            <tr key={artist.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4 text-sm">{index + 1}</td>
                              <td className="py-3 px-4 text-sm font-medium">{artist.name}</td>
                              <td className="py-3 px-4 text-sm">{artist.phone}</td>
                              <td className="py-3 px-4 text-sm">৳{artist.perMinuteRate.toFixed(2)}</td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">{artist.notes || "-"}</td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleEditArtist(artist)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive">
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Artist?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove {artist.name}?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteArtist(artist.id, artist.name)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">
                    Only administrators can view voice artist details
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="work" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle>Voice Artist Work Records</CardTitle>
                </div>
                <CardDescription>Record voice work entries for billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workDate">Date *</Label>
                    <Input
                      id="workDate"
                      type="date"
                      value={workDate}
                      onChange={(e) => setWorkDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="workTitle">Title *</Label>
                    <Input
                      id="workTitle"
                      value={workTitle}
                      onChange={(e) => setWorkTitle(e.target.value)}
                      placeholder="Content title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workArtist">Voice Artist *</Label>
                    <Select value={selectedArtistId} onValueChange={setSelectedArtistId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select artist" />
                      </SelectTrigger>
                      <SelectContent>
                        {artists.map(artist => (
                          <SelectItem key={artist.id} value={artist.id}>
                            {artist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workMinute">Minute</Label>
                    <Input
                      id="workMinute"
                      type="number"
                      min="0"
                      value={workMinute}
                      onChange={(e) => setWorkMinute(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workSecond">Second</Label>
                    <Input
                      id="workSecond"
                      type="number"
                      min="0"
                      max="59"
                      value={workSecond}
                      onChange={(e) => setWorkSecond(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                {selectedArtistId && (workMinute || workSecond) && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Total Duration:</span>{" "}
                      {((parseInt(workMinute) || 0) + (parseInt(workSecond) || 0) / 60).toFixed(2)} minutes
                    </p>
                    {isAdmin && (
                      <p className="text-sm">
                        <span className="font-medium">Estimated Bill:</span>{" "}
                        ৳{(((parseInt(workMinute) || 0) + (parseInt(workSecond) || 0) / 60) * 
                          (artists.find(a => a.id === selectedArtistId)?.perMinuteRate || 0)).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
                <Button onClick={handleAddWorkEntry} className="w-full gap-2">
                  <Save className="w-4 h-4" />
                  Add Work Entry
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Work Entries ({workEntries.length})</CardTitle>
                <CardDescription>All recorded voice work entries</CardDescription>
              </CardHeader>
              <CardContent>
                {workEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No work entries recorded yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium">SL</th>
                          <th className="text-left py-3 px-4 text-sm font-medium">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium">Title</th>
                          <th className="text-left py-3 px-4 text-sm font-medium">Artist</th>
                          <th className="text-left py-3 px-4 text-sm font-medium">Duration</th>
                          <th className="text-left py-3 px-4 text-sm font-medium">Total Min</th>
                          {isAdmin && <th className="text-left py-3 px-4 text-sm font-medium">Bill</th>}
                          <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workEntries.map((entry, index) => (
                          <tr key={entry.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm">{index + 1}</td>
                            <td className="py-3 px-4 text-sm">{format(new Date(entry.date), "MMM dd, yyyy")}</td>
                            <td className="py-3 px-4 text-sm">{entry.title}</td>
                            <td className="py-3 px-4 text-sm font-medium">{entry.artistName}</td>
                            <td className="py-3 px-4 text-sm">{entry.minute}m {entry.second}s</td>
                            <td className="py-3 px-4 text-sm">{entry.totalMin.toFixed(2)}</td>
                            {isAdmin && <td className="py-3 px-4 text-sm font-medium">৳{entry.totalBill.toFixed(2)}</td>}
                            <td className="py-3 px-4">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove this work entry?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteWorkEntry(entry.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bill" className="space-y-6">
            {isAdmin ? (
              <>
                <div className="flex items-center justify-between print:hidden">
                  <div className="space-y-2">
                    <Label htmlFor="billMonth">Select Month</Label>
                    <Input
                      id="billMonth"
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <Button onClick={handlePrintBill} className="gap-2">
                    <Printer className="w-4 h-4" />
                    Print Bill
                  </Button>
                </div>

                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">Daily Our Bangladesh</CardTitle>
                    <CardTitle className="text-lg">Voice Artist Bill</CardTitle>
                    <CardDescription>
                      Month of {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {billReport.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No work entries for the selected month
                      </p>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full border">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left py-3 px-4 text-sm font-medium border-r">SL</th>
                                <th className="text-left py-3 px-4 text-sm font-medium border-r">Name</th>
                                <th className="text-right py-3 px-4 text-sm font-medium border-r">Total Min</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">Total Taka (৳)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {billReport.map((item, index) => (
                                <tr key={item.artistId} className="border-b hover:bg-muted/30">
                                  <td className="py-3 px-4 text-sm border-r">{index + 1}</td>
                                  <td className="py-3 px-4 text-sm font-medium border-r">{item.name}</td>
                                  <td className="py-3 px-4 text-sm text-right border-r">{item.totalMin.toFixed(2)}</td>
                                  <td className="py-3 px-4 text-sm font-medium text-right">৳{item.totalBill.toFixed(2)}</td>
                                </tr>
                              ))}
                              <tr className="bg-muted font-semibold">
                                <td colSpan={3} className="py-3 px-4 text-sm text-right border-r">
                                  Total:
                                </td>
                                <td className="py-3 px-4 text-sm text-right">
                                  ৳{totalBill.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">
                    Only administrators can view billing reports
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
}

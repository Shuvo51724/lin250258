import { useState, useEffect, useMemo } from "react";
import { PerformanceEntry } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Download, Loader2, Search, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditableTable from "@/components/EditableTable";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const [entries, setEntries] = useState<PerformanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [filterScriptWriter, setFilterScriptWriter] = useState<string>("all");
  const [filterVideoEditor, setFilterVideoEditor] = useState<string>("all");
  const [filterMojoReporter, setFilterMojoReporter] = useState<string>("all");
  const [filterJelaReporter, setFilterJelaReporter] = useState<string>("all");
  const [filterContentStatus, setFilterContentStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Load entries from localStorage on mount
  useEffect(() => {
    const loadEntries = () => {
      try {
        const stored = localStorage.getItem("dob_entries");
        if (stored) {
          setEntries(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load entries:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEntries();
  }, []);

  // Get unique values for filter dropdowns
  const uniqueScriptWriters = useMemo(() => {
    const unique = new Set(entries.map(e => e.scriptWriter).filter(Boolean));
    return Array.from(unique);
  }, [entries]);

  const uniqueVideoEditors = useMemo(() => {
    const unique = new Set(entries.map(e => e.videoEditor).filter(Boolean));
    return Array.from(unique);
  }, [entries]);

  const uniqueMojoReporters = useMemo(() => {
    const unique = new Set(entries.map(e => e.mojoReporter).filter(Boolean));
    return Array.from(unique);
  }, [entries]);

  const uniqueJelaReporters = useMemo(() => {
    const unique = new Set(entries.map(e => e.jelaReporter).filter(Boolean));
    return Array.from(unique);
  }, [entries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = entries.filter(entry => {
      // Search filter (Title or Link)
      const matchesSearch = 
        !searchTerm ||
        (entry.title && entry.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.link && entry.link.toLowerCase().includes(searchTerm.toLowerCase()));

      // Date range filter
      const matchesDateRange = 
        (!dateStart || !entry.date || entry.date >= dateStart) &&
        (!dateEnd || !entry.date || entry.date <= dateEnd);

      // Script Writer filter
      const matchesScriptWriter = 
        filterScriptWriter === "all" || entry.scriptWriter === filterScriptWriter;

      // Video Editor filter
      const matchesVideoEditor = 
        filterVideoEditor === "all" || entry.videoEditor === filterVideoEditor;

      // Mojo Reporter filter
      const matchesMojoReporter = 
        filterMojoReporter === "all" || entry.mojoReporter === filterMojoReporter;

      // Jela Reporter filter
      const matchesJelaReporter = 
        filterJelaReporter === "all" || entry.jelaReporter === filterJelaReporter;

      // Content Status filter
      const matchesContentStatus = 
        filterContentStatus === "all" || entry.contentStatus === filterContentStatus;

      return matchesSearch && matchesDateRange && matchesScriptWriter && 
             matchesVideoEditor && matchesMojoReporter && matchesJelaReporter && 
             matchesContentStatus;
    });

    // Sort results
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (b.date || "").localeCompare(a.date || "");
        case "date-asc":
          return (a.date || "").localeCompare(b.date || "");
        case "views-desc":
          return (b.views || 0) - (a.views || 0);
        case "views-asc":
          return (a.views || 0) - (b.views || 0);
        case "engagement-desc":
          return (b.engagement || 0) - (a.engagement || 0);
        case "engagement-asc":
          return (a.engagement || 0) - (b.engagement || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [entries, searchTerm, dateStart, dateEnd, filterScriptWriter, filterVideoEditor, 
      filterMojoReporter, filterJelaReporter, filterContentStatus, sortBy]);

  const handleAddEntry = () => {
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    const newEntry: PerformanceEntry = {
      id: crypto.randomUUID(),
      date: today, // Auto-fill with current date
      link: "",
      title: "",
      views: undefined,
      reach: undefined,
      engagement: undefined,
      voiceArtist: "",
      scriptWriter: "",
      videoEditor: "",
      topicSelector: "",
      mojoReporter: "",
      jelaReporter: "",
      photoCard: "",
      seo: "",
      websiteNews: "",
      contentStatus: "writing",
      createdAt: new Date().toISOString(),
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    localStorage.setItem("dob_entries", JSON.stringify(updatedEntries));
    
    toast({
      title: "Entry Added",
      description: "New performance entry has been created",
    });
  };

  const handleUpdateEntry = (id: string, updates: Partial<PerformanceEntry>) => {
    const updatedEntries = entries.map((entry) =>
      entry.id === id ? { ...entry, ...updates } : entry
    );
    setEntries(updatedEntries);
    localStorage.setItem("dob_entries", JSON.stringify(updatedEntries));
  };

  const handleDeleteEntry = (id: string) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem("dob_entries", JSON.stringify(updatedEntries));
    
    toast({
      title: "Entry Deleted",
      description: "Performance entry has been removed",
    });
  };

  const handleExportToExcel = async () => {
    try {
      const { exportToExcel } = await import("@/lib/exportToExcel");
      // Export only filtered entries
      exportToExcel(filteredEntries);
      toast({
        title: "Export Successful",
        description: `Exported ${filteredEntries.length} filtered entries to Excel`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate Excel file",
        variant: "destructive",
      });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDateStart("");
    setDateEnd("");
    setFilterScriptWriter("all");
    setFilterVideoEditor("all");
    setFilterMojoReporter("all");
    setFilterJelaReporter("all");
    setFilterContentStatus("all");
    setSortBy("date-desc");
    
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset",
    });
  };

  const hasActiveFilters = 
    searchTerm || dateStart || dateEnd || 
    filterScriptWriter !== "all" || filterVideoEditor !== "all" || 
    filterMojoReporter !== "all" || filterJelaReporter !== "all" || 
    filterContentStatus !== "all";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />
      <div className="w-full px-6 py-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Performance Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage team performance metrics
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              className="gap-2"
              data-testid="button-export"
              disabled={filteredEntries.length === 0}
            >
              <Download className="w-4 h-4" />
              Export ({filteredEntries.length})
            </Button>
            <Button onClick={handleAddEntry} className="gap-2" data-testid="button-add-entry">
              <Plus className="w-4 h-4" />
              Add New Entry
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-card border rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Filter & Search</h2>
              {hasActiveFilters && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {filteredEntries.length} of {entries.length} results
                </span>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Search Box */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or link..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
              <Input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
              <Input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Select value={filterScriptWriter} onValueChange={setFilterScriptWriter}>
              <SelectTrigger>
                <SelectValue placeholder="Script Writer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Script Writers</SelectItem>
                {uniqueScriptWriters.map(writer => (
                  <SelectItem key={writer} value={writer}>{writer}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterVideoEditor} onValueChange={setFilterVideoEditor}>
              <SelectTrigger>
                <SelectValue placeholder="Video Editor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Video Editors</SelectItem>
                {uniqueVideoEditors.map(editor => (
                  <SelectItem key={editor} value={editor}>{editor}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMojoReporter} onValueChange={setFilterMojoReporter}>
              <SelectTrigger>
                <SelectValue placeholder="Mojo Reporter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mojo Reporters</SelectItem>
                {uniqueMojoReporters.map(reporter => (
                  <SelectItem key={reporter} value={reporter}>{reporter}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterJelaReporter} onValueChange={setFilterJelaReporter}>
              <SelectTrigger>
                <SelectValue placeholder="Jela Reporter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jela Reporters</SelectItem>
                {uniqueJelaReporters.map(reporter => (
                  <SelectItem key={reporter} value={reporter}>{reporter}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterContentStatus} onValueChange={setFilterContentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Content Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="writing">Writing Processing</SelectItem>
                <SelectItem value="footage">Footage Downloading</SelectItem>
                <SelectItem value="voiceover">Voice Over</SelectItem>
                <SelectItem value="thumbnail">Thumbnail Make</SelectItem>
                <SelectItem value="editing">Editing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="alldone">All Done</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm font-medium text-muted-foreground">Sort By:</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="views-desc">Views (High to Low)</SelectItem>
                <SelectItem value="views-asc">Views (Low to High)</SelectItem>
                <SelectItem value="engagement-desc">Engagement (High to Low)</SelectItem>
                <SelectItem value="engagement-asc">Engagement (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <EditableTable
          entries={filteredEntries}
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteEntry}
          canDelete={hasPermission("delete")}
        />
      </div>
      <Footer />
    </div>
  );
}

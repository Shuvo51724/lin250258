import { useState, useEffect, useMemo } from "react";
import { JelaReporter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Download, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export default function JelaReporterData() {
  const [reporters, setReporters] = useState<JelaReporter[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDesignation, setFilterDesignation] = useState<string>("all");
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof JelaReporter } | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  // Load reporters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dob_jela_reporters");
    if (stored) {
      setReporters(JSON.parse(stored));
    }
  }, []);

  // Get unique designations for filter
  const designations = useMemo(() => {
    const unique = new Set(reporters.map(r => r.designation).filter(Boolean));
    return Array.from(unique);
  }, [reporters]);

  // Filter reporters
  const filteredReporters = useMemo(() => {
    return reporters.filter(reporter => {
      const matchesSearch = 
        reporter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reporter.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDesignation = 
        filterDesignation === "all" || reporter.designation === filterDesignation;
      
      return matchesSearch && matchesDesignation;
    });
  }, [reporters, searchTerm, filterDesignation]);

  const handleAddReporter = () => {
    const newReporter: JelaReporter = {
      id: crypto.randomUUID(),
      name: "",
      employeeId: "",
      designation: "",
      address: "",
      phoneNumber: "",
      remarks: "",
      createdAt: new Date().toISOString(),
    };

    const updated = [newReporter, ...reporters];
    setReporters(updated);
    localStorage.setItem("dob_jela_reporters", JSON.stringify(updated));
    
    toast({
      title: "Reporter Added",
      description: "New reporter entry created",
    });
  };

  const handleUpdateReporter = (id: string, updates: Partial<JelaReporter>) => {
    const updated = reporters.map(reporter => 
      reporter.id === id ? { ...reporter, ...updates } : reporter
    );
    setReporters(updated);
    localStorage.setItem("dob_jela_reporters", JSON.stringify(updated));
  };

  const handleDeleteReporter = (id: string) => {
    const updated = reporters.filter(reporter => reporter.id !== id);
    setReporters(updated);
    localStorage.setItem("dob_jela_reporters", JSON.stringify(updated));
    
    toast({
      title: "Reporter Deleted",
      description: "Reporter record removed",
    });
  };

  const handleCellClick = (id: string, field: keyof JelaReporter, value: any) => {
    if (field === "id" || field === "createdAt") return;
    setEditingCell({ id, field });
    setEditValue(value?.toString() || "");
  };

  const handleCellBlur = () => {
    if (editingCell) {
      handleUpdateReporter(editingCell.id, { [editingCell.field]: editValue });
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const { format } = await import("date-fns");

      const data = filteredReporters.map((reporter, index) => ({
        'SL': index + 1,
        'Name': reporter.name,
        'Employee ID': reporter.employeeId,
        'Designation': reporter.designation || '',
        'Address': reporter.address || '',
        'Phone Number': reporter.phoneNumber || '',
        'Remarks': reporter.remarks || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Jela Reporter Data');

      const fileName = `Jela_Reporter_Data_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export Successful",
        description: "Reporter data exported to Excel",
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

  const renderCell = (reporter: JelaReporter, field: keyof JelaReporter) => {
    const value = reporter[field];
    const isEditing = editingCell?.id === reporter.id && editingCell?.field === field;

    if (field === "id" || field === "createdAt") {
      return null;
    }

    if (isEditing) {
      return (
        <Input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          className="h-9 text-sm"
        />
      );
    }

    return (
      <span className="text-sm">
        {value !== undefined && value !== null && value !== "" ? value.toString() : "-"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />
      <div className="w-full px-6 py-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Jela Reporter Data</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage district reporter information and records
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              className="gap-2"
              disabled={filteredReporters.length === 0}
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
            <Button onClick={handleAddReporter} className="gap-2">
              <Plus className="w-4 h-4" />
              Add New Reporter
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterDesignation} onValueChange={setFilterDesignation}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by Designation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Designations</SelectItem>
              {designations.map(des => (
                <SelectItem key={des} value={des}>{des}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reporter Table */}
        {filteredReporters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">No reporters yet</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterDesignation !== "all"
                ? "No reporters match your search criteria"
                : "Click 'Add New Reporter' to get started"
              }
            </p>
          </div>
        ) : (
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b-2">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-16">SL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-40">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-32">Employee ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-32">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-48">Address</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-32">Phone Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-48">Remarks</th>
                    {hasPermission("delete") && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-20">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y">
                  {filteredReporters.map((reporter, index) => (
                    <tr key={reporter.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(reporter.id, "name", reporter.name)}>
                        {renderCell(reporter, "name")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(reporter.id, "employeeId", reporter.employeeId)}>
                        {renderCell(reporter, "employeeId")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(reporter.id, "designation", reporter.designation)}>
                        {renderCell(reporter, "designation")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(reporter.id, "address", reporter.address)}>
                        {renderCell(reporter, "address")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(reporter.id, "phoneNumber", reporter.phoneNumber)}>
                        {renderCell(reporter, "phoneNumber")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(reporter.id, "remarks", reporter.remarks)}>
                        {renderCell(reporter, "remarks")}
                      </td>
                      {hasPermission("delete") && (
                        <td className="px-4 py-3 text-center">
                          <Button
                            onClick={() => handleDeleteReporter(reporter.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <span className="text-lg">🗑️</span>
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

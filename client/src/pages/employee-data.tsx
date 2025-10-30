import { useState, useEffect, useMemo } from "react";
import { Employee } from "@shared/schema";
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

export default function EmployeeData() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDesignation, setFilterDesignation] = useState<string>("all");
  const [filterShift, setFilterShift] = useState<string>("all");
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof Employee } | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  // Load employees from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dob_employees");
    if (stored) {
      setEmployees(JSON.parse(stored));
    }
  }, []);

  // Get unique designations and shifts for filters
  const designations = useMemo(() => {
    const unique = new Set(employees.map(e => e.designation).filter(Boolean));
    return Array.from(unique);
  }, [employees]);

  const shifts = useMemo(() => {
    const unique = new Set(employees.map(e => e.officeShift).filter(Boolean));
    return Array.from(unique);
  }, [employees]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDesignation = 
        filterDesignation === "all" || emp.designation === filterDesignation;
      
      const matchesShift = 
        filterShift === "all" || emp.officeShift === filterShift;
      
      return matchesSearch && matchesDesignation && matchesShift;
    });
  }, [employees, searchTerm, filterDesignation, filterShift]);

  const isValidTime = (time: string): boolean => {
    if (!time) return false;
    // Support both 24-hour format (HH:MM) and 12-hour format (HH:MM am/pm)
    const time24Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const time12Regex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(am|pm)$/i;
    return time24Regex.test(time) || time12Regex.test(time);
  };

  const convertTo24Hour = (time: string): { hour: number; minute: number } | null => {
    if (!time) return null;
    
    // Check if it's 12-hour format (with am/pm)
    const time12Match = time.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(am|pm)$/i);
    if (time12Match) {
      let hour = parseInt(time12Match[1]);
      const minute = parseInt(time12Match[2]);
      const period = time12Match[3].toLowerCase();
      
      if (period === 'pm' && hour !== 12) {
        hour += 12;
      } else if (period === 'am' && hour === 12) {
        hour = 0;
      }
      
      return { hour, minute };
    }
    
    // Check if it's 24-hour format
    const time24Match = time.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (time24Match) {
      return {
        hour: parseInt(time24Match[1]),
        minute: parseInt(time24Match[2])
      };
    }
    
    return null;
  };

  const calculateTotalHours = (inTime: string, outTime: string): string => {
    if (!inTime || !outTime) return "-";
    
    const inConverted = convertTo24Hour(inTime);
    const outConverted = convertTo24Hour(outTime);
    
    if (!inConverted || !outConverted) {
      return "Invalid time";
    }
    
    try {
      const inMinutes = inConverted.hour * 60 + inConverted.minute;
      const outMinutes = outConverted.hour * 60 + outConverted.minute;
      
      let totalMinutes = outMinutes - inMinutes;
      if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts
      
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      return `${hours}h ${minutes}m`;
    } catch {
      return "Invalid time";
    }
  };

  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      id: crypto.randomUUID(),
      name: "",
      employeeId: "",
      designation: "",
      holiday: "",
      salary: "",
      address: "",
      phoneNumber: "",
      officeShift: "",
      officeInTime: "",
      officeOutTime: "",
      remarks: "",
      createdAt: new Date().toISOString(),
    };

    const updated = [newEmployee, ...employees];
    setEmployees(updated);
    localStorage.setItem("dob_employees", JSON.stringify(updated));
    
    toast({
      title: "Employee Added",
      description: "New employee entry created",
    });
  };

  const handleUpdateEmployee = (id: string, updates: Partial<Employee>) => {
    const updated = employees.map(emp => 
      emp.id === id ? { ...emp, ...updates } : emp
    );
    setEmployees(updated);
    localStorage.setItem("dob_employees", JSON.stringify(updated));
  };

  const handleDeleteEmployee = (id: string) => {
    const updated = employees.filter(emp => emp.id !== id);
    setEmployees(updated);
    localStorage.setItem("dob_employees", JSON.stringify(updated));
    
    toast({
      title: "Employee Deleted",
      description: "Employee record removed",
    });
  };

  const handleCellClick = (id: string, field: keyof Employee, value: any) => {
    if (field === "id" || field === "createdAt") return;
    setEditingCell({ id, field });
    setEditValue(value?.toString() || "");
  };

  const handleCellBlur = () => {
    if (editingCell) {
      handleUpdateEmployee(editingCell.id, { [editingCell.field]: editValue });
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

      const data = filteredEmployees.map((emp, index) => ({
        'SL': index + 1,
        'Name': emp.name,
        'Employee ID': emp.employeeId,
        'Designation': emp.designation || '',
        'Holiday': emp.holiday || '',
        'Salary': emp.salary || '',
        'Address': emp.address || '',
        'Phone Number': emp.phoneNumber || '',
        'Office Shift': emp.officeShift || '',
        'Office In Time': emp.officeInTime || '',
        'Office Out Time': emp.officeOutTime || '',
        'Total Hours': calculateTotalHours(emp.officeInTime || '', emp.officeOutTime || ''),
        'Remarks': emp.remarks || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Data');

      const fileName = `Employee_Data_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export Successful",
        description: "Employee data exported to Excel",
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

  const renderCell = (employee: Employee, field: keyof Employee) => {
    const value = employee[field];
    const isEditing = editingCell?.id === employee.id && editingCell?.field === field;

    if (field === "id" || field === "createdAt") {
      return null;
    }

    if (isEditing) {
      const placeholder = (field === "officeInTime" || field === "officeOutTime") 
        ? "e.g. 08:00 am" 
        : "";
      
      return (
        <Input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
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
            <h1 className="text-2xl font-semibold text-foreground">Employee Data</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage employee information and records
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              className="gap-2"
              disabled={filteredEmployees.length === 0}
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
            <Button onClick={handleAddEmployee} className="gap-2">
              <Plus className="w-4 h-4" />
              Add New Employee
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

          <Select value={filterShift} onValueChange={setFilterShift}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by Shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              {shifts.map(shift => (
                <SelectItem key={shift} value={shift}>{shift}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Employee Table */}
        {filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">No employees yet</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterDesignation !== "all" || filterShift !== "all" 
                ? "No employees match your search criteria"
                : "Click 'Add New Employee' to get started"
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-24">Holiday</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-28">Salary</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-48">Address</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-32">Phone Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-28">Office Shift</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-28">Office In Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-28">Office Out Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-28">Total Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide min-w-48">Remarks</th>
                    {hasPermission("delete") && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide w-20">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y">
                  {filteredEmployees.map((employee, index) => (
                    <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "name", employee.name)}>
                        {renderCell(employee, "name")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "employeeId", employee.employeeId)}>
                        {renderCell(employee, "employeeId")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "designation", employee.designation)}>
                        {renderCell(employee, "designation")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "holiday", employee.holiday)}>
                        {renderCell(employee, "holiday")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "salary", employee.salary)}>
                        {renderCell(employee, "salary")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "address", employee.address)}>
                        {renderCell(employee, "address")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "phoneNumber", employee.phoneNumber)}>
                        {renderCell(employee, "phoneNumber")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "officeShift", employee.officeShift)}>
                        {renderCell(employee, "officeShift")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "officeInTime", employee.officeInTime)}>
                        {renderCell(employee, "officeInTime")}
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "officeOutTime", employee.officeOutTime)}>
                        {renderCell(employee, "officeOutTime")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-primary">
                          {calculateTotalHours(employee.officeInTime || '', employee.officeOutTime || '')}
                        </span>
                      </td>
                      <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(employee.id, "remarks", employee.remarks)}>
                        {renderCell(employee, "remarks")}
                      </td>
                      {hasPermission("delete") && (
                        <td className="px-4 py-3 text-center">
                          <Button
                            onClick={() => handleDeleteEmployee(employee.id)}
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

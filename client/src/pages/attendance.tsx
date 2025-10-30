import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Save, Printer, Download, Clock, Users, AlertCircle, Coffee, UserX, CalendarX } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeIdNumber: string;
  designation: string;
  date: string;
  inTime: string;
  outTime: string;
  workingHours: number;
  status: "Present" | "Absent" | "Late" | "Half-day" | "Leave";
  createdAt: string;
}

const OFFICE_START_TIME = "08:00";

export default function Attendance() {
  const { toast } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const storedEmployees = localStorage.getItem("dob_employees");
    if (storedEmployees) {
      const parsed = JSON.parse(storedEmployees);
      setEmployees(parsed);
    }

    const storedAttendance = localStorage.getItem("dob_attendance");
    if (storedAttendance) {
      setAttendanceRecords(JSON.parse(storedAttendance));
    }
  }, []);

  const calculateWorkingHours = (inTime: string, outTime: string): number => {
    if (!inTime || !outTime) return 0;
    
    const [inHour, inMin] = inTime.split(":").map(Number);
    const [outHour, outMin] = outTime.split(":").map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    
    const diff = outMinutes - inMinutes;
    return Math.max(0, diff / 60);
  };

  const isLate = (inTime: string): boolean => {
    if (!inTime) return false;
    const [inHour, inMin] = inTime.split(":").map(Number);
    const [startHour, startMin] = OFFICE_START_TIME.split(":").map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const startMinutes = startHour * 60 + startMin;
    
    return inMinutes > startMinutes;
  };

  const getDefaultStatus = (inTime: string, workingHours: number): AttendanceRecord["status"] => {
    if (workingHours === 0) return "Absent";
    if (isLate(inTime)) return "Late";
    if (workingHours < 4) return "Half-day";
    if (workingHours >= 8) return "Present";
    return "Present";
  };

  const handleUpdateAttendance = (
    employeeId: string,
    field: string,
    value: string
  ) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const existingRecordIndex = attendanceRecords.findIndex(
      r => r.employeeId === employeeId && r.date === selectedDate
    );

    let updated: AttendanceRecord[];

    if (existingRecordIndex !== -1) {
      const record = attendanceRecords[existingRecordIndex];
      const updatedRecord = { ...record, [field]: value };

      if (field === "inTime" || field === "outTime") {
        const inTime = field === "inTime" ? value : record.inTime;
        const outTime = field === "outTime" ? value : record.outTime;
        updatedRecord.workingHours = calculateWorkingHours(inTime, outTime);
        
        updatedRecord.status = getDefaultStatus(inTime, updatedRecord.workingHours);
      }

      updated = [...attendanceRecords];
      updated[existingRecordIndex] = updatedRecord;
    } else {
      const newRecord: AttendanceRecord = {
        id: crypto.randomUUID(),
        employeeId: employee.id,
        employeeName: employee.name,
        employeeIdNumber: employee.employeeId,
        designation: employee.designation,
        date: selectedDate,
        inTime: field === "inTime" ? value : "",
        outTime: field === "outTime" ? value : "",
        workingHours: 0,
        status: "Absent",
        createdAt: new Date().toISOString(),
      };

      if (field === "inTime" || field === "outTime") {
        newRecord.workingHours = calculateWorkingHours(
          newRecord.inTime,
          newRecord.outTime
        );
        newRecord.status = getDefaultStatus(newRecord.inTime, newRecord.workingHours);
      } else if (field === "status") {
        newRecord.status = value as AttendanceRecord["status"];
      }

      updated = [...attendanceRecords, newRecord];
    }

    setAttendanceRecords(updated);
    localStorage.setItem("dob_attendance", JSON.stringify(updated));
  };

  const handleSaveAll = () => {
    localStorage.setItem("dob_attendance", JSON.stringify(attendanceRecords));
    toast({
      title: "Attendance Saved",
      description: "All attendance records have been saved successfully",
    });
  };

  const getAttendanceForEmployee = (employeeId: string) => {
    return attendanceRecords.find(
      r => r.employeeId === employeeId && r.date === selectedDate
    );
  };

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const recordMonth = record.date.slice(0, 7);
      return recordMonth === filterMonth;
    });
  }, [attendanceRecords, filterMonth]);

  const todayRecords = useMemo(() => {
    return attendanceRecords.filter(r => r.date === selectedDate);
  }, [attendanceRecords, selectedDate]);

  const todaySummary = useMemo(() => {
    const summary = {
      totalEmployees: employees.length,
      present: 0,
      late: 0,
      leave: 0,
      absent: 0,
      halfDay: 0,
      totalHours: 0,
    };

    todayRecords.forEach(record => {
      if (record.status === "Present") summary.present++;
      else if (record.status === "Late") summary.late++;
      else if (record.status === "Leave") summary.leave++;
      else if (record.status === "Absent") summary.absent++;
      else if (record.status === "Half-day") summary.halfDay++;
      
      summary.totalHours += record.workingHours;
    });

    summary.absent = summary.totalEmployees - (summary.present + summary.late + summary.leave + summary.halfDay);

    return summary;
  }, [todayRecords, employees.length]);

  const handleExportToExcel = () => {
    const data = filteredRecords.map((record, index) => ({
      SL: index + 1,
      Name: record.employeeName,
      "Employee ID": record.employeeIdNumber,
      Designation: record.designation,
      Date: format(new Date(record.date), "MMM dd, yyyy"),
      "In Time": record.inTime || "-",
      "Out Time": record.outTime || "-",
      "Working Hours": record.workingHours.toFixed(2),
      Status: record.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    const monthName = format(new Date(filterMonth + "-01"), "MMMM-yyyy");
    XLSX.writeFile(wb, `Attendance_${monthName}.xlsx`);

    toast({
      title: "Export Successful",
      description: "Attendance records exported to Excel",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />
      <div className="w-full px-6 py-6 flex-1 print:p-0">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Daily Attendance</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage employee attendance (Office starts at {OFFICE_START_TIME})
          </p>
        </div>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Attendance Summary - {format(new Date(selectedDate), "MMM dd, yyyy")}
              </CardTitle>
              <CardDescription>Overview of today's attendance status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{todaySummary.totalEmployees}</p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Present</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{todaySummary.present}</p>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Late</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{todaySummary.late}</p>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Coffee className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Half Day</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{todaySummary.halfDay}</p>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarX className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Leave</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{todaySummary.leave}</p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <UserX className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-400">Absent</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{todaySummary.absent}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Total Working Hours Today:</span>
                  <span className="text-lg font-bold text-primary">{todaySummary.totalHours.toFixed(2)} hrs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription>
                Record daily attendance for all employees (Late auto-marked if arrival after {OFFICE_START_TIME})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 print:hidden">
                <div className="space-y-2">
                  <Label htmlFor="selectedDate">Select Date</Label>
                  <Input
                    id="selectedDate"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Button onClick={handleSaveAll} className="gap-2 mt-8">
                  <Save className="w-4 h-4" />
                  Save All
                </Button>
              </div>

              {employees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No employees found. Please add employees first in the Employee Data section.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">SL</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Employee ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Designation</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">In Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Out Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Working Hours</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee, index) => {
                        const record = getAttendanceForEmployee(employee.id);
                        return (
                          <tr key={employee.id} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-4 text-sm border-r">{index + 1}</td>
                            <td className="py-3 px-4 text-sm font-medium border-r">{employee.name}</td>
                            <td className="py-3 px-4 text-sm border-r">{employee.employeeId}</td>
                            <td className="py-3 px-4 text-sm border-r">{employee.designation}</td>
                            <td className="py-3 px-4 text-sm border-r">
                              {format(new Date(selectedDate), "MMM dd, yyyy")}
                            </td>
                            <td className="py-3 px-4 border-r">
                              <Input
                                type="time"
                                value={record?.inTime || ""}
                                onChange={(e) => handleUpdateAttendance(employee.id, "inTime", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </td>
                            <td className="py-3 px-4 border-r">
                              <Input
                                type="time"
                                value={record?.outTime || ""}
                                onChange={(e) => handleUpdateAttendance(employee.id, "outTime", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </td>
                            <td className="py-3 px-4 text-sm text-center border-r">
                              {record?.workingHours ? record.workingHours.toFixed(2) : "0.00"}
                            </td>
                            <td className="py-3 px-4">
                              <Select
                                value={record?.status || "Absent"}
                                onValueChange={(value) => handleUpdateAttendance(employee.id, "status", value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Present">Present</SelectItem>
                                  <SelectItem value="Absent">Absent</SelectItem>
                                  <SelectItem value="Late">Late</SelectItem>
                                  <SelectItem value="Half-day">Half-day</SelectItem>
                                  <SelectItem value="Leave">Leave</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>View and export attendance records</CardDescription>
                </div>
                <div className="flex gap-2 print:hidden">
                  <div className="space-y-2">
                    <Input
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <Button onClick={handleExportToExcel} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                  <Button onClick={handlePrint} variant="outline" className="gap-2">
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No attendance records for the selected month
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">SL</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Employee ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Designation</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">In Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Out Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium border-r">Working Hours</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record, index) => (
                        <tr key={record.id} className="border-b hover:bg-muted/30">
                          <td className="py-3 px-4 text-sm border-r">{index + 1}</td>
                          <td className="py-3 px-4 text-sm font-medium border-r">{record.employeeName}</td>
                          <td className="py-3 px-4 text-sm border-r">{record.employeeIdNumber}</td>
                          <td className="py-3 px-4 text-sm border-r">{record.designation}</td>
                          <td className="py-3 px-4 text-sm border-r">
                            {format(new Date(record.date), "MMM dd, yyyy")}
                          </td>
                          <td className="py-3 px-4 text-sm border-r">{record.inTime || "-"}</td>
                          <td className="py-3 px-4 text-sm border-r">{record.outTime || "-"}</td>
                          <td className="py-3 px-4 text-sm text-center border-r">
                            {record.workingHours.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              record.status === "Present" ? "bg-green-100 text-green-800" :
                              record.status === "Absent" ? "bg-red-100 text-red-800" :
                              record.status === "Late" ? "bg-yellow-100 text-yellow-800" :
                              record.status === "Half-day" ? "bg-orange-100 text-orange-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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

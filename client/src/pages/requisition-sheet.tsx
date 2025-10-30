import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Printer, Download, Calendar } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import type { RequisitionSheet, RequisitionItem } from "@shared/schema";
import * as XLSX from "xlsx";

export default function RequisitionSheetPage() {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [sheets, setSheets] = useState<RequisitionSheet[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [currentSheet, setCurrentSheet] = useState<RequisitionSheet | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("dob_requisition_sheets");
    if (stored) {
      setSheets(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const [year, month] = selectedMonth.split("-");
    const existing = sheets.find(s => s.month === month && s.year === year);
    
    if (existing) {
      setCurrentSheet(existing);
    } else {
      const newSheet: RequisitionSheet = {
        id: crypto.randomUUID(),
        month: month,
        year: year,
        items: [],
        totalAmount: 0,
        createdBy: user?.name || user?.userId || "Unknown",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentSheet(newSheet);
    }
  }, [selectedMonth, sheets, user]);

  const saveSheet = (sheet: RequisitionSheet) => {
    const updated = sheets.filter(s => s.id !== sheet.id);
    const newSheets = [...updated, sheet];
    setSheets(newSheets);
    localStorage.setItem("dob_requisition_sheets", JSON.stringify(newSheets));
    setCurrentSheet(sheet);
  };

  const handleAddItem = () => {
    if (!currentSheet) return;

    const newItem: RequisitionItem = {
      id: crypto.randomUUID(),
      sl: currentSheet.items.length + 1,
      department: "",
      itemDescription: "",
      justification: "",
      quantity: 0,
      unit: 0,
      price: 0,
      remarks: "",
    };

    const updatedSheet = {
      ...currentSheet,
      items: [...currentSheet.items, newItem],
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);

    toast({
      title: "Item Added",
      description: "New requisition item added",
    });
  };

  const handleUpdateItem = (itemId: string, field: keyof RequisitionItem, value: any) => {
    if (!currentSheet) return;

    const updatedItems = currentSheet.items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unit") {
          updated.price = updated.quantity * updated.unit;
        }
        return updated;
      }
      return item;
    });

    const totalAmount = updatedItems.reduce((sum, item) => sum + item.price, 0);

    const updatedSheet = {
      ...currentSheet,
      items: updatedItems,
      totalAmount,
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!currentSheet) return;

    const updatedItems = currentSheet.items
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, sl: index + 1 }));

    const totalAmount = updatedItems.reduce((sum, item) => sum + item.price, 0);

    const updatedSheet = {
      ...currentSheet,
      items: updatedItems,
      totalAmount,
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);

    toast({
      title: "Item Deleted",
      description: "Requisition item removed",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!currentSheet || currentSheet.items.length === 0) {
      toast({
        title: "No Data",
        description: "Add items before exporting",
        variant: "destructive",
      });
      return;
    }

    const data = currentSheet.items.map(item => ({
      "SL": item.sl,
      "Department": item.department,
      "Item Description": item.itemDescription,
      "Justification": item.justification,
      "QTY": item.quantity,
      "Unit (৳)": item.unit,
      "Price (৳)": item.price,
      "Remarks": item.remarks || "",
    }));

    data.push({
      "SL": "",
      "Department": "",
      "Item Description": "",
      "Justification": "",
      "QTY": "",
      "Unit (৳)": "Total:",
      "Price (৳)": currentSheet.totalAmount,
      "Remarks": "",
    } as any);

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Requisition");
    XLSX.writeFile(wb, `Requisition_Sheet_${currentSheet.month}_${currentSheet.year}.xlsx`);

    toast({
      title: "Excel Exported",
      description: "Requisition sheet has been exported",
    });
  };

  const monthName = useMemo(() => {
    if (!currentSheet) return "";
    const date = new Date(`${currentSheet.year}-${currentSheet.month}-01`);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentSheet]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <div className="w-full px-6 py-6 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Requisition Sheet - 2025</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage department requisitions and budgets
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="gap-2 print:hidden">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button variant="outline" onClick={handleExportExcel} className="gap-2 print:hidden">
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
          </div>

          <Card className="mb-6 shadow-sm print:hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Select Month</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="max-w-xs"
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="print:pb-2">
              <CardTitle className="text-xl text-center">
                Daily Our Bangladesh - Requisition for {monthName}
              </CardTitle>
              <CardDescription className="text-center print:hidden">
                Submitted by: {currentSheet?.createdBy}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="p-3 text-left text-sm font-semibold w-12">SL</th>
                      <th className="p-3 text-left text-sm font-semibold min-w-[120px]">Department</th>
                      <th className="p-3 text-left text-sm font-semibold min-w-[200px]">Item Description</th>
                      <th className="p-3 text-left text-sm font-semibold min-w-[150px]">Justification</th>
                      <th className="p-3 text-left text-sm font-semibold w-20">QTY</th>
                      <th className="p-3 text-left text-sm font-semibold w-24">Unit(৳)</th>
                      <th className="p-3 text-left text-sm font-semibold w-28">Price(৳)</th>
                      <th className="p-3 text-left text-sm font-semibold min-w-[120px]">Remarks</th>
                      <th className="p-3 text-center w-16 print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSheet?.items.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-2 text-sm">{item.sl}</td>
                        <td className="p-2">
                          <Input
                            value={item.department}
                            onChange={(e) => handleUpdateItem(item.id, "department", e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Department"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.itemDescription}
                            onChange={(e) => handleUpdateItem(item.id, "itemDescription", e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.justification}
                            onChange={(e) => handleUpdateItem(item.id, "justification", e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Justification"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.quantity || ""}
                            onChange={(e) => handleUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.unit || ""}
                            onChange={(e) => handleUpdateItem(item.id, "unit", parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-2">
                          <div className="h-8 flex items-center text-sm font-semibold">
                            {item.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.remarks || ""}
                            onChange={(e) => handleUpdateItem(item.id, "remarks", e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Remarks"
                          />
                        </td>
                        <td className="p-2 text-center print:hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/30">
                      <td colSpan={6} className="p-3 text-right font-semibold">Total Amount (৳):</td>
                      <td className="p-3 text-left font-bold text-lg">
                        {currentSheet?.totalAmount.toFixed(2)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-center print:hidden">
                <Button onClick={handleAddItem} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </div>
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
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}

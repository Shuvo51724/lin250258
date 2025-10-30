import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Printer, Download, Calendar } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import type { ExpenseSheet, ExpenseItem } from "@shared/schema";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export default function ExpenseSheetPage() {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [sheets, setSheets] = useState<ExpenseSheet[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [currentSheet, setCurrentSheet] = useState<ExpenseSheet | null>(null);
  const [sheetDate, setSheetDate] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const stored = localStorage.getItem("dob_expense_sheets");
    if (stored) {
      setSheets(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const [year, month] = selectedMonth.split("-");
    const existing = sheets.find(s => s.month === month && s.year === year);
    
    if (existing) {
      const needsUpdate = !existing.paidLabel || !existing.dueLabel;
      const updatedExisting = {
        ...existing,
        paidLabel: existing.paidLabel || "Paid",
        dueLabel: existing.dueLabel || "Due",
      };
      
      if (needsUpdate) {
        const updatedSheets = sheets.map(s => 
          s.id === existing.id ? updatedExisting : s
        );
        setSheets(updatedSheets);
        localStorage.setItem("dob_expense_sheets", JSON.stringify(updatedSheets));
      }
      
      setCurrentSheet(updatedExisting);
      setSheetDate(existing.date);
    } else {
      const newSheet: ExpenseSheet = {
        id: crypto.randomUUID(),
        month: month,
        year: year,
        items: [],
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
        paidLabel: "Paid",
        dueLabel: "Due",
        date: sheetDate,
        createdBy: user?.name || user?.userId || "Unknown",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentSheet(newSheet);
    }
  }, [selectedMonth, sheets, user, sheetDate]);

  const saveSheet = (sheet: ExpenseSheet) => {
    const updated = sheets.filter(s => s.id !== sheet.id);
    const newSheets = [...updated, sheet];
    setSheets(newSheets);
    localStorage.setItem("dob_expense_sheets", JSON.stringify(newSheets));
    setCurrentSheet(sheet);
  };

  const handleAddItem = () => {
    if (!currentSheet) return;

    const newItem: ExpenseItem = {
      id: crypto.randomUUID(),
      sl: currentSheet.items.length + 1,
      details: "",
      amount: 0,
    };

    const updatedSheet = {
      ...currentSheet,
      items: [...currentSheet.items, newItem],
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);

    toast({
      title: "Item Added",
      description: "New expense item added",
    });
  };

  const handleUpdateItem = (itemId: string, field: keyof ExpenseItem, value: any) => {
    if (!currentSheet) return;

    const updatedItems = currentSheet.items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );

    const totalAmount = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const dueAmount = totalAmount - currentSheet.paidAmount;

    const updatedSheet = {
      ...currentSheet,
      items: updatedItems,
      totalAmount,
      dueAmount,
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);
  };

  const handleUpdatePaid = (paid: number) => {
    if (!currentSheet) return;

    const dueAmount = currentSheet.totalAmount - paid;

    const updatedSheet = {
      ...currentSheet,
      paidAmount: paid,
      dueAmount,
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);
  };

  const handleUpdateDue = (due: number) => {
    if (!currentSheet) return;

    const paidAmount = currentSheet.totalAmount - due;

    const updatedSheet = {
      ...currentSheet,
      paidAmount,
      dueAmount: due,
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);
  };

  const handleUpdatePaidLabel = (label: string) => {
    if (!currentSheet) return;

    const updatedSheet = {
      ...currentSheet,
      paidLabel: label,
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);
  };

  const handleUpdateDueLabel = (label: string) => {
    if (!currentSheet) return;

    const updatedSheet = {
      ...currentSheet,
      dueLabel: label,
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);
  };

  const handleUpdateDate = (date: string) => {
    if (!currentSheet) return;

    const updatedSheet = {
      ...currentSheet,
      date,
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);
    setSheetDate(date);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!currentSheet) return;

    const updatedItems = currentSheet.items
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, sl: index + 1 }));

    const totalAmount = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const dueAmount = totalAmount - currentSheet.paidAmount;

    const updatedSheet = {
      ...currentSheet,
      items: updatedItems,
      totalAmount,
      dueAmount,
      updatedAt: new Date().toISOString(),
    };

    saveSheet(updatedSheet);

    toast({
      title: "Item Deleted",
      description: "Expense item removed",
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
      "Details": item.details,
      "Taka": item.amount,
    }));

    data.push(
      { "SL": "", "Details": "Total", "Taka": currentSheet.totalAmount } as any,
      { "SL": "", "Details": currentSheet.paidLabel || "Paid", "Taka": currentSheet.paidAmount } as any,
      { "SL": "", "Details": currentSheet.dueLabel || "Due", "Taka": currentSheet.dueAmount } as any,
    );

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `Expense_Sheet_${currentSheet.month}_${currentSheet.year}.xlsx`);

    toast({
      title: "Excel Exported",
      description: "Expense sheet has been exported",
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Expense Sheet</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track monthly expenses and payments
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
                Daily Our Bangladesh – Expense Month of {monthName}
              </CardTitle>
              <CardDescription className="text-center print:hidden">
                Prepared by: {currentSheet?.createdBy}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="p-3 text-left text-sm font-semibold w-16">SL</th>
                      <th className="p-3 text-left text-sm font-semibold">Details</th>
                      <th className="p-3 text-left text-sm font-semibold w-32">Taka</th>
                      <th className="p-3 text-center w-16 print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSheet?.items.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-2 text-sm">{item.sl}</td>
                        <td className="p-2">
                          <Input
                            value={item.details}
                            onChange={(e) => handleUpdateItem(item.id, "details", e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Expense details"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.amount || ""}
                            onChange={(e) => handleUpdateItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                            placeholder="0"
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
                  <tfoot className="border-t-2 border-border">
                    <tr className="bg-muted/30">
                      <td className="p-3" colSpan={2}>
                        <span className="font-bold text-base">Total</span>
                      </td>
                      <td className="p-3 font-bold text-lg">
                        {currentSheet?.totalAmount.toFixed(2)}
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                    <tr className="bg-muted/20">
                      <td className="p-3" colSpan={2}>
                        <Input
                          type="text"
                          value={currentSheet?.paidLabel || "Paid"}
                          onChange={(e) => handleUpdatePaidLabel(e.target.value)}
                          className="h-9 font-semibold print:hidden"
                          placeholder="Enter label (e.g., Paid)"
                          data-testid="input-paid-label"
                        />
                        <span className="hidden print:inline-block font-semibold">
                          {currentSheet?.paidLabel || "Paid"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={currentSheet?.paidAmount || ""}
                          onChange={(e) => handleUpdatePaid(parseFloat(e.target.value) || 0)}
                          className="h-9 font-semibold print:hidden"
                          placeholder="0"
                          data-testid="input-paid"
                        />
                        <span className="hidden print:inline-block font-semibold">
                          {currentSheet?.paidAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                    <tr className="bg-muted/10">
                      <td className="p-3" colSpan={2}>
                        <Input
                          type="text"
                          value={currentSheet?.dueLabel || "Due"}
                          onChange={(e) => handleUpdateDueLabel(e.target.value)}
                          className="h-9 font-semibold print:hidden"
                          placeholder="Enter label (e.g., Due)"
                          data-testid="input-due-label"
                        />
                        <span className="hidden print:inline-block font-semibold">
                          {currentSheet?.dueLabel || "Due"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={currentSheet?.dueAmount || ""}
                          onChange={(e) => handleUpdateDue(parseFloat(e.target.value) || 0)}
                          className="h-9 font-semibold text-destructive print:hidden"
                          placeholder="0"
                          data-testid="input-due"
                        />
                        <span className="hidden print:inline-block font-bold text-lg text-destructive">
                          {currentSheet?.dueAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Date:</span>
                  <Input
                    type="date"
                    value={sheetDate}
                    onChange={(e) => handleUpdateDate(e.target.value)}
                    className="h-8 w-40 print:hidden"
                  />
                  <span className="hidden print:inline-block text-sm">
                    {format(new Date(sheetDate), "dd/MM/yyyy")}
                  </span>
                </div>
                <Button onClick={handleAddItem} className="gap-2 print:hidden">
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
          .print\\:inline-block {
            display: inline-block !important;
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

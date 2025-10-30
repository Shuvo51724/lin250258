import { useState, useMemo } from "react";
import { PerformanceEntry } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MonthlyPerformanceReportProps {
  entries: PerformanceEntry[];
  currentMonth?: string;
}

interface CategoryReport {
  category: string;
  categoryBengali: string;
  field: keyof PerformanceEntry;
  stats: { name: string; count: number }[];
}

export default function MonthlyPerformanceReport({ 
  entries, 
  currentMonth 
}: MonthlyPerformanceReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const filterEntriesByMonth = (entries: PerformanceEntry[], targetMonth?: string) => {
    if (!targetMonth) {
      const now = new Date();
      targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    return entries.filter((entry) => {
      if (!entry.createdAt) return false;
      const entryDate = new Date(entry.createdAt);
      const entryMonth = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;
      return entryMonth === targetMonth;
    });
  };

  const calculateCategoryStats = (
    entries: PerformanceEntry[],
    field: keyof PerformanceEntry
  ): { name: string; count: number }[] => {
    const countMap = new Map<string, number>();

    entries.forEach((entry) => {
      const value = entry[field];
      if (value && typeof value === "string" && value.trim() !== "") {
        const currentCount = countMap.get(value) || 0;
        countMap.set(value, currentCount + 1);
      }
    });

    return Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const monthlyReport = useMemo((): CategoryReport[] => {
    const monthlyEntries = filterEntriesByMonth(entries, currentMonth);

    return [
      {
        category: "Script Writer",
        categoryBengali: "স্ক্রিপ্ট লেখক",
        field: "scriptWriter",
        stats: calculateCategoryStats(monthlyEntries, "scriptWriter"),
      },
      {
        category: "Video Editor",
        categoryBengali: "ভিডিও এডিটর",
        field: "videoEditor",
        stats: calculateCategoryStats(monthlyEntries, "videoEditor"),
      },
      {
        category: "Photo Card Maker",
        categoryBengali: "ফটো কার্ড তৈরিকারী",
        field: "photoCard",
        stats: calculateCategoryStats(monthlyEntries, "photoCard"),
      },
      {
        category: "Website News Reporter",
        categoryBengali: "ওয়েবসাইট নিউজ রিপোর্টার",
        field: "websiteNews",
        stats: calculateCategoryStats(monthlyEntries, "websiteNews"),
      },
      {
        category: "SEO Specialist",
        categoryBengali: "এসইও বিশেষজ্ঞ",
        field: "seo",
        stats: calculateCategoryStats(monthlyEntries, "seo"),
      },
      {
        category: "Voice Artist",
        categoryBengali: "ভয়েস আর্টিস্ট",
        field: "voiceArtist",
        stats: calculateCategoryStats(monthlyEntries, "voiceArtist"),
      },
      {
        category: "Mojo Reporter",
        categoryBengali: "মোজো রিপোর্টার",
        field: "mojoReporter",
        stats: calculateCategoryStats(monthlyEntries, "mojoReporter"),
      },
      {
        category: "Jela Reporter",
        categoryBengali: "জেলা রিপোর্টার",
        field: "jelaReporter",
        stats: calculateCategoryStats(monthlyEntries, "jelaReporter"),
      },
    ];
  }, [entries, currentMonth]);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      
      const worksheetData: any[] = [
        ["📊 Monthly Performance Report"],
        [`Month: ${currentMonth || new Date().toISOString().slice(0, 7)}`],
        [],
        ["Category", "Name", "Total Tasks"],
      ];

      monthlyReport.forEach((category) => {
        if (category.stats.length > 0) {
          category.stats.forEach((stat, index) => {
            worksheetData.push([
              index === 0 ? category.category : "",
              stat.name,
              stat.count,
            ]);
          });
          worksheetData.push([]);
        }
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      worksheet["!cols"] = [
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");

      const fileName = `Monthly_Performance_Report_${currentMonth || new Date().toISOString().slice(0, 7)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const hasData = monthlyReport.some((category) => category.stats.length > 0);

  return (
    <Card className="mt-8 border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <span>📊</span>
            <span>Monthly Performance Report</span>
          </CardTitle>
          <Button
            onClick={handleExportReport}
            disabled={isExporting || !hasData}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Download Report"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!hasData ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">No performance data available for the current month.</p>
            <p className="text-sm mt-2">Add entries above to see the monthly report.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {monthlyReport.map((category) => {
              if (category.stats.length === 0) return null;

              return (
                <div key={category.field} className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">
                    {category.category} ({category.categoryBengali})
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="text-right font-semibold w-32">Total Tasks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.stats.map((stat, index) => (
                          <TableRow 
                            key={`${category.field}-${stat.name}`}
                            className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                          >
                            <TableCell className="font-medium">{stat.name}</TableCell>
                            <TableCell className="text-right">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                                {stat.count}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useMemo } from "react";
import { PerformanceEntry } from "@shared/schema";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Printer, Trophy } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import MonthlyPerformanceReport from "@/components/MonthlyPerformanceReport";

interface RankingData {
  name: string;
  count: number;
}

export default function Rankings() {
  const [entries, setEntries] = useState<PerformanceEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("dob_entries");
    if (stored) {
      const parsedEntries: PerformanceEntry[] = JSON.parse(stored);
      setEntries(parsedEntries);

      const months = Array.from(
        new Set(
          parsedEntries.map((entry) => {
            const date = new Date(entry.createdAt);
            return format(date, "yyyy-MM");
          })
        )
      ).sort((a, b) => b.localeCompare(a));

      setAvailableMonths(months);
      if (months.length > 0 && !selectedMonth) {
        setSelectedMonth(months[0]);
      }
    }
  }, []);

  const filteredEntries = useMemo(() => {
    if (!selectedMonth) return entries;
    return entries.filter((entry) => {
      const entryMonth = format(new Date(entry.createdAt), "yyyy-MM");
      return entryMonth === selectedMonth;
    });
  }, [entries, selectedMonth]);

  const calculateRankings = (field: keyof PerformanceEntry): RankingData[] => {
    const counts: Record<string, number> = {};

    filteredEntries.forEach((entry) => {
      const value = entry[field];
      if (value && typeof value === "string" && value.trim()) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const scriptWriterRankings = calculateRankings("scriptWriter");
  const videoEditorRankings = calculateRankings("videoEditor");
  const mojoReporterRankings = calculateRankings("mojoReporter");
  const jelaReporterRankings = calculateRankings("jelaReporter");

  const handlePrint = () => {
    window.print();
  };

  const RankingCard = ({ title, rankings, icon: Icon }: { title: string; rankings: RankingData[]; icon: any }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {rankings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data for this month</p>
        ) : (
          rankings.slice(0, 2).map((ranking, index) => (
            <div
              key={ranking.name}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              data-testid={`ranking-${title.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index === 0 ? "bg-yellow-500/20" : "bg-slate-500/20"
                }`}>
                  <Trophy className={`w-5 h-5 ${index === 0 ? "text-yellow-600" : "text-slate-600"}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">{ranking.name}</p>
                  <p className="text-xs text-muted-foreground">{ranking.count} entries</p>
                </div>
              </div>
              <Badge variant={index === 0 ? "default" : "secondary"} className="gap-1">
                <Award className="w-3 h-3" />
                {index === 0 ? "1st" : "2nd"}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />
      <div className="w-full px-6 py-6 print:p-0 flex-1">
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Monthly Rankings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Top performers by category
            </p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48 h-12" data-testid="select-month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {format(new Date(month + "-01"), "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handlePrint} variant="outline" className="gap-2" data-testid="button-print">
              <Printer className="w-4 h-4" />
              Print Report
            </Button>
          </div>
        </div>

        {selectedMonth && (
          <div className="mb-6 print:mb-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-primary" />
                  <div>
                    <h2 className="font-semibold text-lg">
                      Employee of the Month - {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Congratulations to our top performers this month!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RankingCard title="Script Writer" rankings={scriptWriterRankings} icon={Award} />
          <RankingCard title="Video Editor" rankings={videoEditorRankings} icon={Award} />
          <RankingCard title="Mojo Reporter" rankings={mojoReporterRankings} icon={Award} />
          <RankingCard title="Jela Reporter" rankings={jelaReporterRankings} icon={Award} />
        </div>

        <MonthlyPerformanceReport entries={entries} currentMonth={selectedMonth} />
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
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
}

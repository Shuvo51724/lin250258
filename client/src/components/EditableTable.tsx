import { useState } from "react";
import { PerformanceEntry } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ContentStatusBadge, { type ContentStatus } from "@/components/ContentStatusBadge";

interface EditableTableProps {
  entries: PerformanceEntry[];
  onUpdateEntry: (id: string, updates: Partial<PerformanceEntry>) => void;
  onDeleteEntry: (id: string) => void;
  canDelete?: boolean;
}

interface EditingCell {
  entryId: string;
  field: keyof PerformanceEntry;
}

export default function EditableTable({ entries, onUpdateEntry, onDeleteEntry, canDelete = true }: EditableTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [fetchingLinks, setFetchingLinks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleCellClick = (entryId: string, field: keyof PerformanceEntry, currentValue: any) => {
    if (field === "id" || field === "createdAt") return;
    
    setEditingCell({ entryId, field });
    // Format date for date input
    if (field === "date") {
      setEditValue(currentValue || "");
    } else {
      setEditValue(currentValue?.toString() || "");
    }
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const { entryId, field } = editingCell;
      
      let value: any = editValue;
      if (field === "views" || field === "reach" || field === "engagement") {
        value = editValue ? parseFloat(editValue) : undefined;
      }

      onUpdateEntry(entryId, { [field]: value });
      setEditingCell(null);
    }
  };

  const handleLinkChange = async (entryId: string, link: string) => {
    onUpdateEntry(entryId, { link });

    if (link && (link.includes("youtube.com") || link.includes("youtu.be"))) {
      setFetchingLinks(new Set(fetchingLinks).add(entryId));

      try {
        const response = await fetch("/api/youtube/video-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: link }),
        });

        if (response.ok) {
          const data = await response.json();
          onUpdateEntry(entryId, {
            title: data.title,
            views: data.views,
          });
          toast({
            title: "YouTube Data Fetched",
            description: "Title and views updated successfully",
          });
        } else {
          toast({
            title: "Failed to Fetch",
            description: "Could not retrieve YouTube video data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching YouTube data:", error);
        toast({
          title: "Error",
          description: "Failed to connect to YouTube API",
          variant: "destructive",
        });
      } finally {
        setFetchingLinks((prev) => {
          const next = new Set(prev);
          next.delete(entryId);
          return next;
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const isEditing = (entryId: string, field: keyof PerformanceEntry) => {
    return editingCell?.entryId === entryId && editingCell?.field === field;
  };

  const renderCell = (entry: PerformanceEntry, field: keyof PerformanceEntry) => {
    const value = entry[field];
    const isFetching = fetchingLinks.has(entry.id);

    if (isEditing(entry.id, field)) {
      // Use date input type for date field
      if (field === "date") {
        return (
          <Input
            type="date"
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={handleKeyDown}
            className="h-10 text-sm"
            data-testid={`input-${field}-${entry.id}`}
          />
        );
      }
      
      return (
        <Input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          className="h-10 text-sm"
          data-testid={`input-${field}-${entry.id}`}
        />
      );
    }

    if (field === "link" && value) {
      return (
        <div className="flex items-center gap-2">
          <span className="truncate text-sm">{value as string}</span>
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <a
              href={value as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      );
    }

    return (
      <span className="text-sm">
        {value !== undefined && value !== null && value !== "" ? value.toString() : "-"}
      </span>
    );
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No entries yet</h3>
        <p className="text-sm text-muted-foreground">Click "Add New Entry" to get started</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b-2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground w-16">SL</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-36 bg-blue-50/50">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-64">Link</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-48">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Views</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Reach</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Engagement</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Voice Artist</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Script Writer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Video Editor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Topic Selector</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Mojo Reporter</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Jela Reporter</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Photo Card</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">SEO</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-32">Website News</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground min-w-48 bg-purple-50/50">Content Status</th>
              {canDelete && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-foreground w-20">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-card divide-y">
            {entries.map((entry, index) => (
              <tr key={entry.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-entry-${index}`}>
                <td className="px-4 py-3 text-sm font-medium text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50 bg-blue-50/30" onClick={() => handleCellClick(entry.id, "date", entry.date)}>
                  {renderCell(entry, "date")}
                </td>
                <td
                  className="px-4 py-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleCellClick(entry.id, "link", entry.link)}
                  onBlur={() => {
                    if (isEditing(entry.id, "link")) {
                      handleLinkChange(entry.id, editValue);
                      setEditingCell(null);
                    }
                  }}
                >
                  {renderCell(entry, "link")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "title", entry.title)}>
                  {renderCell(entry, "title")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "views", entry.views)}>
                  {renderCell(entry, "views")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "reach", entry.reach)}>
                  {renderCell(entry, "reach")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "engagement", entry.engagement)}>
                  {renderCell(entry, "engagement")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "voiceArtist", entry.voiceArtist)}>
                  {renderCell(entry, "voiceArtist")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "scriptWriter", entry.scriptWriter)}>
                  {renderCell(entry, "scriptWriter")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "videoEditor", entry.videoEditor)}>
                  {renderCell(entry, "videoEditor")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "topicSelector", entry.topicSelector)}>
                  {renderCell(entry, "topicSelector")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "mojoReporter", entry.mojoReporter)}>
                  {renderCell(entry, "mojoReporter")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "jelaReporter", entry.jelaReporter)}>
                  {renderCell(entry, "jelaReporter")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "photoCard", entry.photoCard)}>
                  {renderCell(entry, "photoCard")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "seo", entry.seo)}>
                  {renderCell(entry, "seo")}
                </td>
                <td className="px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => handleCellClick(entry.id, "websiteNews", entry.websiteNews)}>
                  {renderCell(entry, "websiteNews")}
                </td>
                <td className="px-4 py-3 bg-purple-50/30">
                  <ContentStatusBadge
                    status={entry.contentStatus}
                    onStatusChange={(status: ContentStatus) => onUpdateEntry(entry.id, { contentStatus: status })}
                  />
                </td>
                {canDelete && (
                  <td className="px-4 py-3 text-center">
                    <Button
                      onClick={() => onDeleteEntry(entry.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid={`button-delete-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type ContentStatus = 
  | "writing" 
  | "footage" 
  | "voiceover" 
  | "thumbnail" 
  | "editing" 
  | "ready" 
  | "alldone" 
  | "published";

interface StatusConfig {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const STATUS_CONFIG: Record<ContentStatus, StatusConfig> = {
  writing: {
    label: "Writing Processing",
    emoji: "📝",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
  },
  footage: {
    label: "Footage Downloading",
    emoji: "🎥",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
  },
  voiceover: {
    label: "Voice Over",
    emoji: "🎙️",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
  },
  thumbnail: {
    label: "Thumbnail Make",
    emoji: "🖼️",
    color: "text-pink-700",
    bgColor: "bg-pink-100",
    borderColor: "border-pink-300",
  },
  editing: {
    label: "Editing",
    emoji: "✂️",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
  },
  ready: {
    label: "Ready",
    emoji: "✅",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
  },
  alldone: {
    label: "All Done",
    emoji: "🚀",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-300",
  },
  published: {
    label: "Published",
    emoji: "🌐",
    color: "text-teal-700",
    bgColor: "bg-teal-100",
    borderColor: "border-teal-300",
  },
};

interface ContentStatusBadgeProps {
  status?: ContentStatus;
  onStatusChange: (status: ContentStatus) => void;
}

export default function ContentStatusBadge({ status, onStatusChange }: ContentStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentStatus = status || "writing";
  const config = STATUS_CONFIG[currentStatus];

  return (
    <Select
      value={currentStatus}
      onValueChange={(value) => onStatusChange(value as ContentStatus)}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger 
        className={`h-auto w-full max-w-[200px] border ${config.borderColor} ${config.bgColor} hover:opacity-80 transition-opacity`}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue>
          <div className="flex items-center gap-2 py-1">
            <span className="text-base">{config.emoji}</span>
            <span className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {Object.entries(STATUS_CONFIG).map(([key, value]) => (
          <SelectItem key={key} value={key} className="cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-base">{value.emoji}</span>
              <span className="text-sm">{value.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

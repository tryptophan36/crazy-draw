import { Minus, Plus, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface PropertiesPanelProps {
  brushSize: number
  activeColor: string
  onBrushSizeChange: (size: number) => void
  onColorChange: (color: string) => void
}

export function PropertiesPanel({ brushSize, activeColor, onBrushSizeChange, onColorChange }: PropertiesPanelProps) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-6 bg-white/90 backdrop-blur-2xl border border-white/20 shadow-xl shadow-purple-500/10 px-6 py-3 rounded-full transition-all hover:scale-[1.01]">
        {/* Color Picker */}
        <div className="flex items-center gap-2 pr-4 border-r border-border/50">
          <div className="flex -space-x-1.5">
            {["#000000", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"].map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={cn(
                  "size-6 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 hover:z-10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  activeColor === color && "scale-110 z-10 ring-2 ring-offset-2 ring-primary"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button className="size-8 rounded-full bg-linear-to-br from-pink-100 to-blue-100 border border-white/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Palette className="size-4" />
          </button>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onBrushSizeChange(Math.max(1, brushSize - 1))}
            className="size-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            <Minus className="size-4" />
          </button>
          <div className="flex items-center gap-2 min-w-[60px] justify-center">
            <div
              className="rounded-full bg-foreground transition-all duration-300"
              style={{ width: brushSize, height: brushSize, maxWidth: 24, maxHeight: 24 }}
            />
            <span className="text-xs font-medium text-muted-foreground w-4 text-center">
              {brushSize}
            </span>
          </div>
          <button
            onClick={() => onBrushSizeChange(Math.min(20, brushSize + 1))}
            className="size-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

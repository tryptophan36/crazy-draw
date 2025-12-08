import { Pencil, Eraser, MousePointer2, Undo2, Redo2, Trash2, Square, Circle, Triangle } from "lucide-react"
import { ToolButton } from "./tool-button"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { setActiveTool } from "@/lib/store/canvasSlice"
import type { Tool } from "@/lib/store/types"
import type { RootState } from "@/lib/store/store"

export function Toolbar() {
  const dispatch = useAppDispatch()
  const { activeTool } = useAppSelector((state: RootState) => state.canvas)

  const handleToolSelect = (tool: Tool) => {
    dispatch(setActiveTool(tool))
  }

  const handleUndo = () => {
    // TODO: Implement undo functionality
    console.log("Undo")
  }

  const handleRedo = () => {
    // TODO: Implement redo functionality
    console.log("Redo")
  }

  const handleClear = () => {
    // TODO: Implement clear functionality
    console.log("Clear canvas")
  }
  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-6 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2 bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg shadow-purple-500/5 p-2 rounded-2xl">
        <ToolButton
          icon={MousePointer2}
          label="Select"
          isActive={activeTool === "select"}
          onClick={() => handleToolSelect("select")}
        />
        <ToolButton
          icon={Pencil}
          label="Draw"
          isActive={activeTool === "pencil"}
          onClick={() => handleToolSelect("pencil")}
        />
        <ToolButton
          icon={Eraser}
          label="Erase"
          isActive={activeTool === "eraser"}
          onClick={() => handleToolSelect("eraser")}
        />
        <div className="h-px w-full bg-border my-1" />
        <ToolButton
          icon={Square}
          label="Rectangle"
          isActive={activeTool === "rect"}
          onClick={() => handleToolSelect("rect")}
        />
        <ToolButton
          icon={Circle}
          label="Circle"
          isActive={activeTool === "circle"}
          onClick={() => handleToolSelect("circle")}
        />
        <ToolButton
          icon={Triangle}
          label="Triangle"
          isActive={activeTool === "triangle"}
          onClick={() => handleToolSelect("triangle")}
        />
      </div>

      <div className="pointer-events-auto flex flex-col gap-2 bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg shadow-purple-500/5 p-2 rounded-2xl">
        <ToolButton icon={Undo2} label="Undo" onClick={handleUndo} />
        <ToolButton icon={Redo2} label="Redo" onClick={handleRedo} />
        <ToolButton
          icon={Trash2}
          label="Clear"
          onClick={handleClear}
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
        />
      </div>
    </div>
  )
}

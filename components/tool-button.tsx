import { cn } from "@/lib/utils"
import { ComponentProps } from "react"

interface ToolButtonProps extends ComponentProps<"button"> {
  icon: React.ElementType
  label: string
  isActive?: boolean
}

export function ToolButton({
  icon: Icon,
  label,
  isActive = false,
  className,
  ...props
}: ToolButtonProps) {
  return (
    <button
      className={cn(
        "group relative size-10 rounded-xl flex items-center justify-center transition-all",
        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        isActive && "bg-muted/80 text-foreground",
        className
      )}
      aria-label={label}
      data-tooltip={label}
      {...props}
    >
      <Icon className="size-5" />
      <span className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
        {label}
      </span>
    </button>
  )
}

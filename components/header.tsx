import { Share2 } from "lucide-react"

export function Header() {
  return (
    <header className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
      {/* Left: Logo & Title */}
      <div className="pointer-events-auto flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-white/20 shadow-sm px-5 py-3 rounded-2xl transition-all hover:shadow-md hover:scale-[1.02]">
        <div className="size-8 rounded-xl bg-linear-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-inner">
          C
        </div>
        <div className="flex flex-col">
          <h1 className="font-semibold text-sm leading-none">Canvas.io</h1>
          <span className="text-xs text-muted-foreground">Untitled Project</span>
        </div>
      </div>

      {/* Center: Timer & Status */}
      <div className="pointer-events-auto hidden md:flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white/20 shadow-sm px-6 py-3 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          Resets in <span className="text-foreground font-semibold">12:34:56</span>
        </span>
      </div>

      {/* Right: Actions & Users */}
      <div className="pointer-events-auto flex items-center gap-3">
        <UserPresence />
        <button className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-sm flex items-center justify-center text-foreground transition-all hover:bg-white hover:shadow-md active:scale-95">
          <Share2 className="size-4" />
        </button>
        <button className="h-10 px-5 rounded-full bg-foreground text-background font-medium text-sm shadow-lg shadow-foreground/10 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95">
          Share
        </button>
      </div>
    </header>
  )
}

function UserPresence() {
  return (
    <div className="flex -space-x-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="size-10 rounded-full border-2 border-white bg-linear-to-br from-indigo-100 to-purple-100 shadow-sm flex items-center justify-center text-xs font-medium text-indigo-600 transition-transform hover:translate-y-[-2px] hover:z-10"
        >
          U{i}
        </div>
      ))}
      <div className="size-10 rounded-full border-2 border-white bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shadow-sm">
        +4
      </div>
    </div>
  )
}

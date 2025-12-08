"use client"

import { useEffect, useRef, useState } from "react"
import { Header } from "./header"
import { Toolbar } from "./toolbar"
import { PropertiesPanel } from "./properties-panel"
import dynamic from 'next/dynamic';
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import { setColor, setBrushWidth } from "@/lib/store/canvasSlice"
import type { RootState } from "@/lib/store/store"

// Dynamically import the CanvasComponent with no SSR
const CanvasComponent = dynamic(() => import('./CanvasComponent'), {
  ssr: false,
});

export function CanvasLayout() {
  const dispatch = useAppDispatch()
  const { color: activeColor, brushWidth: brushSize } = useAppSelector((state: RootState) => state.canvas)
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Update canvas dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: window.innerHeight - 64, // Subtract header height
        })
      }
    }

    // Initial update
    updateDimensions()

    // Add event listener for window resize
    window.addEventListener('resize', updateDimensions)
    
    // Cleanup
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        
        <div className="flex-1 relative" ref={containerRef}>
          {dimensions.width > 0 && dimensions.height > 0 && (
            <>
              <CanvasComponent 
                width={dimensions.width}
                height={dimensions.height}
              />
              <Toolbar />
            </>
          )}
        </div>
        
        <PropertiesPanel 
          brushSize={brushSize}
          activeColor={activeColor}
          onBrushSizeChange={(size) => dispatch(setBrushWidth(size))}
          onColorChange={(color) => dispatch(setColor(color))}
        />
      </div>
    </div>
  )
}

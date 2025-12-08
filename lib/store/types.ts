// Canvas tool types
export type Tool = 'select' | 'pencil' | 'eraser' | 'rect' | 'circle' | 'triangle';

// Canvas state interface
export interface CanvasState {
  activeTool: Tool;
  color: string;
  brushWidth: number;
  // Canvas persistence state
  canvasId: string | null;
  canvasData: string | null; // Serialized Fabric.js JSON
  isDirty: boolean; // Has unsaved changes
  lastSaved: string | null; // ISO timestamp
}


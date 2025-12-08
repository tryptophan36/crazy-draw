import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CanvasState, Tool } from './types';

const initialState: CanvasState = {
  activeTool: 'pencil',
  color: '#000000',
  brushWidth: 5,
  // Canvas persistence state
  canvasId: null,
  canvasData: null,
  isDirty: false,
  lastSaved: null,
};

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    setActiveTool: (state, action: PayloadAction<Tool>) => {
      state.activeTool = action.payload;
    },
    setColor: (state, action: PayloadAction<string>) => {
      state.color = action.payload;
    },
    setBrushWidth: (state, action: PayloadAction<number>) => {
      state.brushWidth = action.payload;
    },
    // Canvas persistence actions
    setCanvasId: (state, action: PayloadAction<string | null>) => {
      state.canvasId = action.payload;
    },
    setCanvasData: (state, action: PayloadAction<string | null>) => {
      state.canvasData = action.payload;
      state.isDirty = true; // Mark as dirty when data changes
    },
    setDirty: (state, action: PayloadAction<boolean>) => {
      state.isDirty = action.payload;
    },
    setLastSaved: (state, action: PayloadAction<string | null>) => {
      state.lastSaved = action.payload;
      state.isDirty = false; // Clear dirty flag when saved
    },
    // Load canvas data (for restoring from state)
    loadCanvas: (state, action: PayloadAction<{ id: string; data: string; lastSaved: string }>) => {
      state.canvasId = action.payload.id;
      state.canvasData = action.payload.data;
      state.lastSaved = action.payload.lastSaved;
      state.isDirty = false;
    },
    // Clear canvas state
    clearCanvas: (state) => {
      state.canvasData = null;
      state.isDirty = false;
      state.lastSaved = null;
    },
  },
});

export const { 
  setActiveTool, 
  setColor, 
  setBrushWidth,
  setCanvasId,
  setCanvasData,
  setDirty,
  setLastSaved,
  loadCanvas,
  clearCanvas,
} = canvasSlice.actions;
export default canvasSlice.reducer;


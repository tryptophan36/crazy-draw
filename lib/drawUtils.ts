import { Rect, Circle, Triangle, PencilBrush } from 'fabric';
import type { Object, Canvas } from 'fabric';
import type { Tool } from '@/lib/store/types';

// Try to import EraserBrush, but it might not be available in all versions
let EraserBrush: any = null;
try {
  const fabricModule = require('fabric');
  EraserBrush = fabricModule.EraserBrush || (fabricModule as any).default?.EraserBrush;
} catch (e) {
  // EraserBrush not available
}

/**
 * Generates a unique ID for Fabric objects
 */
function generateObjectId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createShape(
  tool: Tool,
  pointer: { x: number; y: number },
  color: string,
  brushWidth: number
): Object | null {
  const objectId = generateObjectId();
  
  switch (tool) {
    case 'rect':
      const rect = new Rect({
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: color,
        strokeWidth: brushWidth,
        selectable: false,
      });
      (rect as any).data = { id: objectId };
      return rect;
    case 'circle':
      const circle = new Circle({
        left: pointer.x,
        top: pointer.y,
        radius: 0,
        fill: 'transparent',
        stroke: color,
        strokeWidth: brushWidth,
        selectable: false,
      });
      (circle as any).data = { id: objectId };
      return circle;
    case 'triangle':
      const triangle = new Triangle({
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: color,
        strokeWidth: brushWidth,
        selectable: false,
      });
      (triangle as any).data = { id: objectId };
      return triangle;
    default:
      return null;
  }
}

/**
 * Updates a shape during drawing based on the tool type
 */
export function updateShape(
  tool: Tool,
  shape: Object,
  startPoint: { x: number; y: number },
  currentPoint: { x: number; y: number }
): void {
  switch (tool) {
    case 'rect':
      (shape as Rect).set({
        width: currentPoint.x - startPoint.x,
        height: currentPoint.y - startPoint.y,
      });
      break;
    case 'circle':
      const radius = calculateCircleRadius(startPoint, currentPoint);
      (shape as Circle).set({
        radius: radius,
        left: startPoint.x - radius,
        top: startPoint.y - radius,
      });
      break;
    case 'triangle':
      (shape as Triangle).set({
        width: Math.abs(currentPoint.x - startPoint.x),
        height: Math.abs(currentPoint.y - startPoint.y),
        left: Math.min(startPoint.x, currentPoint.x),
        top: Math.min(startPoint.y, currentPoint.y),
      });
      break;
  }
}

/**
 * Calculates the radius for a circle based on start and end points
 */
function calculateCircleRadius(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number }
): number {
  return (
    Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
    ) / 2
  );
}

/**
 * Sets up the pencil brush for drawing
 */
export function setupPencilBrush(
  canvas: Canvas,
  color: string,
  brushWidth: number
): void {
  canvas.isDrawingMode = true;
  
  // Ensure freeDrawingBrush exists and is properly configured
  if (!canvas.freeDrawingBrush) {
    // Initialize the brush if it doesn't exist
    canvas.freeDrawingBrush = new PencilBrush(canvas);
  }
  
  // Set brush properties
  if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = brushWidth;
  }
}

/**
 * Sets up the eraser brush
 */
export function setupEraserBrush(
  canvas: Canvas,
  brushWidth: number
): void {
  canvas.isDrawingMode = true;
  
  // Try to use EraserBrush if available (Fabric.js v6+)
  if (EraserBrush) {
    // Check if we need to create a new EraserBrush or switch from PencilBrush
    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new EraserBrush(canvas);
    } else {
      // Check if current brush is not an EraserBrush
      const brushType = canvas.freeDrawingBrush.constructor.name;
      if (brushType !== 'EraserBrush') {
        canvas.freeDrawingBrush = new EraserBrush(canvas);
      }
    }
    
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = brushWidth;
    }
  } else {
    // Fallback: use PencilBrush with white color
    setupEraserFallback(canvas, brushWidth);
  }
}

/**
 * Fallback eraser implementation using PencilBrush
 */
function setupEraserFallback(canvas: Canvas, brushWidth: number): void {
  if (!canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush = new PencilBrush(canvas);
  }
  
  if (canvas.freeDrawingBrush) {
    // Use white color as a simple eraser (works on white/light backgrounds)
    canvas.freeDrawingBrush.color = '#ffffff';
    canvas.freeDrawingBrush.width = brushWidth * 2; // Make eraser slightly larger
  }
}

/**
 * Checks if a tool is a shape tool
 */
export function isShapeTool(tool: Tool): boolean {
  return ['rect', 'circle', 'triangle'].includes(tool);
}

/**
 * Checks if a tool is a drawing tool (pencil or eraser)
 */
export function isDrawingTool(tool: Tool): boolean {
  return ['pencil', 'eraser'].includes(tool);
}


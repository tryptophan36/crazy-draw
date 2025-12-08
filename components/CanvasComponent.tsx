import React, { useEffect, useRef, useCallback } from 'react';
import fabric from 'fabric';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { setCanvasData, setCanvasId, setLastSaved } from '@/lib/store/canvasSlice';
import type { Tool } from '@/lib/store/types';
import type { RootState } from '@/lib/store/store';
import {
  createShape,
  updateShape,
  setupPencilBrush,
  setupEraserBrush,
  isShapeTool,
  isDrawingTool,
} from '@/lib/drawUtils';

interface CanvasComponentProps {
  width: number;
  height: number;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({ width, height }) => {
  const dispatch = useAppDispatch();
  const { activeTool, color, brushWidth, canvasData, canvasId } = useAppSelector((state: RootState) => state.canvas);
  
  const canvasRef = useRef<fabric.Canvas>(null);
  const isDrawing = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const currentShape = useRef<fabric.Object | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  
  // Yjs refs for real-time collaboration
  const ydocRef = useRef<Y.Doc | null>(null);
  const objectsMapRef = useRef<Y.Map<any> | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const isApplyingRemoteUpdateRef = useRef(false);

  // Refs to access latest Redux state in event handlers without re-creating handlers
  const activeToolRef = useRef<Tool>(activeTool);
  const colorRef = useRef<string>(color);
  const brushWidthRef = useRef<number>(brushWidth);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    brushWidthRef.current = brushWidth;
  }, [brushWidth]);


  /**
   * Generates a unique ID for Fabric objects
   */
  const generateObjectId = useCallback((): string => {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Ensures an object has a unique ID
   */
  const ensureObjectId = useCallback((obj: fabric.Object): void => {
    const objWithData = obj as any;
    if (!objWithData.data || !objWithData.data.id) {
      if (!objWithData.data) {
        objWithData.data = {};
      }
      objWithData.data.id = generateObjectId();
    }
  }, [generateObjectId]);

  /**
   * Syncs a Fabric object to Yjs objectsMap
   */
  const syncObjectToYjs = useCallback((obj: fabric.Object): void => {
    if (isApplyingRemoteUpdateRef.current || !objectsMapRef.current) return;
    
    try {
      ensureObjectId(obj);
      const objWithData = obj as any;
      const objectId = objWithData.data.id;
      const objectJson = obj.toJSON();
      
      // Store the object in Yjs map
      objectsMapRef.current.set(objectId, objectJson);
    } catch (error) {
      console.error('Error syncing object to Yjs:', error);
    }
  }, [ensureObjectId]);

  /**
   * Removes an object from Yjs objectsMap
   */
  const removeObjectFromYjs = useCallback((obj: fabric.Object): void => {
    if (isApplyingRemoteUpdateRef.current || !objectsMapRef.current) return;
    
    try {
      const objWithData = obj as any;
      if (objWithData.data && objWithData.data.id) {
        objectsMapRef.current.delete(objWithData.data.id);
      }
    } catch (error) {
      console.error('Error removing object from Yjs:', error);
    }
  }, []);

  const serializeCanvas = useCallback((canvas: fabric.Canvas) => {
    try {
      const json = JSON.stringify(canvas.toJSON());
      dispatch(setCanvasData(json));
      
      // Generate canvas ID if it doesn't exist
      if (!canvasId) {
        const newId = `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        dispatch(setCanvasId(newId));
      }
      
      // Debounced save (for future DB implementation)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
       
        dispatch(setLastSaved(new Date().toISOString()));
        console.log('Canvas state saved to Redux:', {
          id: canvasId || 'new',
          dataLength: json.length,
        });
      }, 2000); // 2 second debounce
    } catch (error) {
      console.error('Error serializing canvas:', error);
    }
  }, [dispatch, canvasId]);

  const setupEventListeners = useCallback((canvas: fabric.Canvas, fabric: any) => {
    // Mouse down event
    canvas.on('mouse:down', (options) => {
      if (!options.pointer) return;
      
      isDrawing.current = true;
      startPoint.current = { x: options.pointer.x, y: options.pointer.y };
      
      const tool = activeToolRef.current;
      const currentColor = colorRef.current;
      const currentBrushWidth = brushWidthRef.current;

      if (tool === 'pencil') {
        setupPencilBrush(canvas, currentColor, currentBrushWidth);
      } else if (tool === 'eraser') {
        setupEraserBrush(canvas, currentBrushWidth);
      } else if (isShapeTool(tool)) {
        const pointer = canvas.getPointer(options.e);
        const shape = createShape(tool, pointer, currentColor, currentBrushWidth);
        
        if (shape) {
          currentShape.current = shape;
          canvas.add(shape);
          // Sync to Yjs immediately when shape is added
          syncObjectToYjs(shape);
        }
      }
    });

    // Mouse move event
    canvas.on('mouse:move', (options) => {
      if (!isDrawing.current || !startPoint.current) return;
      
      const tool = activeToolRef.current;

      if (isShapeTool(tool) && currentShape.current) {
        const pointer = canvas.getPointer(options.e);
        updateShape(tool, currentShape.current, startPoint.current, pointer);
        canvas.renderAll();
      }
    });

    // Mouse up event
    canvas.on('mouse:up', () => {
      isDrawing.current = false;
      startPoint.current = null;
      
      const tool = activeToolRef.current;

      if (isDrawingTool(tool)) {
        const currentColor = colorRef.current;
        const currentBrushWidth = brushWidthRef.current;
        if (tool === 'pencil') {
          setupPencilBrush(canvas, currentColor, currentBrushWidth);
        } else if (tool === 'eraser') {
          setupEraserBrush(canvas, currentBrushWidth);
        }
      } else if (currentShape.current) {
        // Make the shape selectable after creation
        currentShape.current.set('selectable', true);
        currentShape.current = null;
      }
    });

    // Listen to canvas changes to update Redux state and Yjs
    // When an object is added (pencil drawing, shapes)
    canvas.on('object:added', (e) => {
      const obj = e.target;
      if (obj) {
        ensureObjectId(obj);
        syncObjectToYjs(obj);
      }
      serializeCanvas(canvas);
    });

    // When an object is modified (moved, resized, etc.)
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (obj) {
        syncObjectToYjs(obj);
      }
      serializeCanvas(canvas);
    });

    // When an object is removed (deleted)
    canvas.on('object:removed', (e) => {
      const obj = e.target;
      if (obj) {
        removeObjectFromYjs(obj);
      }
      serializeCanvas(canvas);
    });

    // When a path is created (for pencil/eraser drawing)
    canvas.on('path:created', (e) => {
      const path = e.path;
      if (path) {
        ensureObjectId(path);
        syncObjectToYjs(path);
      }
      serializeCanvas(canvas);
    });

    // Note: object:modified already covers moved, scaled, rotated, etc.
  }, [serializeCanvas, ensureObjectId, syncObjectToYjs, removeObjectFromYjs]);

  // Handle tool change via Redux state
  useEffect(() => {
    if (canvasRef.current) {
      const tool = activeTool;
      const currentColor = color;
      const currentBrushWidth = brushWidth;
      
      if (tool === 'pencil') {
        setupPencilBrush(canvasRef.current, currentColor, currentBrushWidth);
      } else if (tool === 'eraser') {
        setupEraserBrush(canvasRef.current, currentBrushWidth);
      } else {
        canvasRef.current.isDrawingMode = false;
      }
      
      if (tool === 'select') {
        canvasRef.current.selection = true;
        canvasRef.current.forEachObject((obj: fabric.Object) => {
          obj.selectable = true;
        });
      } else {
        canvasRef.current.selection = false;
        canvasRef.current.forEachObject((obj: fabric.Object) => {
          obj.selectable = false;
        });
      }
    }
  }, [activeTool, color, brushWidth]);

  // Initialize Yjs and WebRTC provider
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create Y.Doc for shared canvas state
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create objectsMap to store shared Fabric object JSON
    const objectsMap = ydoc.getMap('objects');
    objectsMapRef.current = objectsMap;

    // Create WebRTC provider for P2P syncing (zero server cost)
    // Using a fixed room name for global shared canvas
    const provider = new WebrtcProvider('crazy-draw-global-canvas', ydoc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
    });
    providerRef.current = provider;

    console.log('Yjs initialized with WebRTC provider');

    // Listen to remote updates from Yjs
    objectsMap.observe((event: Y.YMapEvent<any>) => {
      if (!canvasRef.current || isApplyingRemoteUpdateRef.current) return;

      const canvas = canvasRef.current;
      isApplyingRemoteUpdateRef.current = true;

      try {
        event.keysChanged.forEach((objectId) => {
          const objectJson = objectsMap.get(objectId);
          
          if (objectJson) {
            // Check if object already exists in canvas
            let existingObj: fabric.Object | null = null;
            canvas.forEachObject((obj: fabric.Object) => {
              const objWithData = obj as any;
              if (objWithData.data && objWithData.data.id === objectId) {
                existingObj = obj;
              }
            });

            if (existingObj) {
              // Update existing object
              (existingObj as any).set(objectJson as any);
              (existingObj as any).setCoords();
            } else {
              // Add new object
              fabric.util.enlivenObjects([objectJson]).then((objects: any[]) => {
                objects.forEach((obj: any) => {
                  if (obj && typeof obj.set === 'function') {
                    // Only add Fabric objects, not filters/shadows/etc
                    const objWithData = obj as any;
                    if (!objWithData.data) objWithData.data = {};
                    objWithData.data.id = objectId;
                    canvas.add(obj);
                  }
                });
                canvas.renderAll();
              });
            }
          } else {
            // Object was deleted
            canvas.forEachObject((obj: fabric.Object) => {
              const objWithData = obj as any;
              if (objWithData.data && objWithData.data.id === objectId) {
                canvas.remove(obj);
              }
            });
            canvas.renderAll();
          }
        });
      } catch (error) {
        console.error('Error applying remote Yjs update:', error);
      } finally {
        isApplyingRemoteUpdateRef.current = false;
      }
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
      providerRef.current = null;
      objectsMapRef.current = null;
      ydocRef.current = null;
    };
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let canvas: fabric.Canvas | null = null;
    let isMounted = true;

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.setDimensions({ width, height });
      }
    };

    const init = async () => {
      const fabricModule = await import('fabric');
      const fabric = (fabricModule as any).fabric || fabricModule;

      if (!isMounted) return;

      // Capture initial canvasData to avoid stale closure
      const initialCanvasData = canvasData;

      if (!canvasRef.current) {
        canvas = new fabric.Canvas('drawing-canvas', {
          width,
          height,
          backgroundColor: 'transparent',
          isDrawingMode: false,
        });

        canvasRef.current = canvas;
      } else {
        canvas = canvasRef.current;
      }

      setupEventListeners(canvas!, fabric);

      // Load canvas data from Redux if available (only on initial mount)
      if (initialCanvasData && !isInitializedRef.current && canvas) {
        try {
          canvas.loadFromJSON(initialCanvasData, () => {
            if (canvas) {
              // Ensure all loaded objects have IDs
              canvas.forEachObject((obj: fabric.Object) => {
                ensureObjectId(obj);
                // Sync existing objects to Yjs
                if (objectsMapRef.current) {
                  syncObjectToYjs(obj);
                }
              });
              canvas.renderAll();
            }
            isInitializedRef.current = true;
            console.log('Canvas loaded from Redux state');
          });
        } catch (error) {
          console.error('Error loading canvas from Redux state:', error);
          isInitializedRef.current = true;
        }
      } else {
        isInitializedRef.current = true;
      }

      window.addEventListener('resize', handleResize);
    };

    init();

    return () => {
      isMounted = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height, setupEventListeners, ensureObjectId, syncObjectToYjs]);



  return (
    <div className="relative w-full h-full">
      <canvas id="drawing-canvas" style={{ touchAction: 'none' }} />
    </div>
  );
};

export default CanvasComponent;

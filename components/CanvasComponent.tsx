import React, { useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { useAppSelector } from '@/lib/store/hooks';
import type { Tool } from '@/lib/store/types';
import type { RootState } from '@/lib/store/store';
import type { Canvas, Object } from 'fabric';
import {
  createShape,
  updateShape,
  setupPencilBrush,
  setupEraserBrush,
  isShapeTool,
  isDrawingTool,
} from '@/lib/drawUtils';
import {
  syncObjectToYjs,
  removeObjectFromYjs,
  applyYjsUpdateToFabric,
  syncAllObjectsToYjs,
  ensureObjectId,
} from '@/lib/yjsSync';

interface CanvasComponentProps {
  width: number;
  height: number;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({ width, height }) => {
  const { activeTool, color, brushWidth, canvasData } = useAppSelector((state: RootState) => state.canvas);
  
  const canvasRef = useRef<Canvas | null>(null);
  const isDrawing = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const currentShape = useRef<Object | null>(null);
  const isInitializedRef = useRef(false);
  
  // Yjs refs for real-time collaboration
  const ydocRef = useRef<Y.Doc | null>(null);
  const objectsMapRef = useRef<Y.Map<any> | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const isApplyingRemoteUpdateRef = useRef(false);
  const fabricUtilRef = useRef<any>(null);

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
   * Wrapper to sync object to Yjs (uses utility function)
   */
  const handleSyncObjectToYjs = useCallback((obj: Object): void => {
    syncObjectToYjs(obj, objectsMapRef.current, isApplyingRemoteUpdateRef.current);
  }, []);

  /**
   * Wrapper to remove object from Yjs (uses utility function)
   */
  const handleRemoveObjectFromYjs = useCallback((obj: Object): void => {
    removeObjectFromYjs(obj, objectsMapRef.current, isApplyingRemoteUpdateRef.current);
  }, []);

  const setupEventListeners = useCallback((canvas: Canvas, fabric: any) => {
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
          handleSyncObjectToYjs(shape);
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

    // Listen to canvas changes to sync to Yjs
    // When an object is added (pencil drawing, shapes)
    canvas.on('object:added', (e) => {
      const obj = e.target;
      if (obj) {
        ensureObjectId(obj);
        handleSyncObjectToYjs(obj);
      }
    });

    // When an object is modified (moved, resized, etc.)
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (obj) {
        handleSyncObjectToYjs(obj);
      }
    });

    // When an object is removed (deleted)
    canvas.on('object:removed', (e) => {
      const obj = e.target;
      if (obj) {
        handleRemoveObjectFromYjs(obj);
      }
    });

    // When a path is created (for pencil/eraser drawing)
    canvas.on('path:created', (e) => {
      const path = e.path;
      if (path) {
        ensureObjectId(path);
        handleSyncObjectToYjs(path);
      }
    });

    // Note: object:modified already covers moved, scaled, rotated, etc.
  }, [handleSyncObjectToYjs, handleRemoveObjectFromYjs]);

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
        canvasRef.current.forEachObject((obj: Object) => {
          obj.selectable = true;
        });
      } else {
        canvasRef.current.selection = false;
        canvasRef.current.forEachObject((obj: Object) => {
          obj.selectable = false;
        });
      }
    }
  }, [activeTool, color, brushWidth]);

  // Initialize Yjs and WebRTC provider
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Pre-load fabric util for enlivenObjects
    import('fabric').then((fabricModule) => {
      fabricUtilRef.current = (fabricModule as any).util;
    });

    // Get room ID from URL query parameter, default to 'default' if not provided
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room') || 'default';
    
    console.log(`[WebRTC] Initializing with room: ${roomId}`);

    // Create Y.Doc for shared canvas state
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create objectsMap to store shared Fabric object JSON
    const objectsMap = ydoc.getMap('objects');
    objectsMapRef.current = objectsMap;

    // Create WebRTC provider for P2P syncing using local signaling server only
    const localSignalingUrl = `ws://localhost:4444?room=${roomId}`;
    const provider = new WebrtcProvider(roomId, ydoc, {
      signaling: [localSignalingUrl],
    });
    providerRef.current = provider;

    console.log(`[WebRTC] Provider initialized with local signaling server: ${localSignalingUrl}`);

    // Log provider status changes
    provider.on('status', (event: { connected: boolean }) => {
      console.log(`[WebRTC] Provider status: ${event.connected ? 'connected' : 'disconnected'}`);
    });

    // Log connected peers count using awareness API
    const awareness = provider.awareness;
    const updatePeerCount = () => {
      const peers = Array.from(awareness.getStates().keys());
      console.log(`[WebRTC] Connected peers: ${peers.length}`);
    };

    // Initial peer count
    updatePeerCount();

    // Listen for awareness changes (peers joining/leaving)
    awareness.on('change', () => {
      updatePeerCount();
    });

    // Listen to remote updates from Yjs
    objectsMap.observe(async (event: Y.YMapEvent<any>) => {
      if (!canvasRef.current) return;

      await applyYjsUpdateToFabric(
        event,
        objectsMap,
        canvasRef.current,
        fabricUtilRef.current,
        isApplyingRemoteUpdateRef
      );
    });

    return () => {
      console.log(`[WebRTC] Cleaning up provider for room: ${roomId}`);
      provider.destroy();
      ydoc.destroy();
      providerRef.current = null;
      objectsMapRef.current = null;
      ydocRef.current = null;
      fabricUtilRef.current = null;
    };
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let canvas: Canvas | null = null;
    let isMounted = true;

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.setDimensions({ width, height });
      }
    };

    const init = async () => {
      const fabricModule = await import('fabric');
      const fabric = fabricModule as any;

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
      // Note: This is for initial load only. After that, Yjs handles all syncing
      if (initialCanvasData && !isInitializedRef.current && canvas) {
        try {
          canvas.loadFromJSON(initialCanvasData, () => {
            if (canvas) {
              // Ensure all loaded objects have IDs
              canvas.forEachObject((obj: Object) => {
                ensureObjectId(obj);
              });
              // Sync all existing objects to Yjs (only if not applying remote update)
              if (objectsMapRef.current) {
                syncAllObjectsToYjs(canvas, objectsMapRef.current, isApplyingRemoteUpdateRef.current);
              }
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
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height, setupEventListeners, canvasData]);



  return (
    <div className="relative w-full h-full">
      <canvas id="drawing-canvas" style={{ touchAction: 'none' }} />
    </div>
  );
};

export default CanvasComponent;

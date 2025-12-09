import * as Y from 'yjs';
import type { Object, Canvas } from 'fabric';

/**
 * Generates a unique ID for Fabric objects
 */
export function generateObjectId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Ensures an object has a unique ID
 */
export function ensureObjectId(obj: Object): string {
  const objWithData = obj as any;
  if (!objWithData.data || !objWithData.data.id) {
    if (!objWithData.data) {
      objWithData.data = {};
    }
    objWithData.data.id = generateObjectId();
  }
  return objWithData.data.id;
}

/**
 * Syncs a Fabric object to Yjs objectsMap
 * Should be called when a local Fabric object is added, modified, or updated
 */
export function syncObjectToYjs(
  obj: Object,
  objectsMap: Y.Map<any> | null,
  isApplyingRemote: boolean
): void {
  if (isApplyingRemote || !objectsMap) return;

  try {
    const objectId = ensureObjectId(obj);
    const objectJson = obj.toJSON(); // Include custom data property
    
    // Store the object in Yjs map
    objectsMap.set(objectId, objectJson);
  } catch (error) {
    console.error('Error syncing object to Yjs:', error);
  }
}

/**
 * Removes an object from Yjs objectsMap
 * Should be called when a local Fabric object is deleted
 */
export function removeObjectFromYjs(
  obj: Object,
  objectsMap: Y.Map<any> | null,
  isApplyingRemote: boolean
): void {
  if (isApplyingRemote || !objectsMap) return;

  try {
    const objWithData = obj as any;
    if (objWithData.data && objWithData.data.id) {
      objectsMap.delete(objWithData.data.id);
    }
  } catch (error) {
    console.error('Error removing object from Yjs:', error);
  }
}

/**
 * Applies remote Yjs updates to Fabric canvas
 * Uses fabric.util.enlivenObjects() to recreate Fabric objects from JSON
 */
export async function applyYjsUpdateToFabric(
  event: Y.YMapEvent<any>,
  objectsMap: Y.Map<any>,
  canvas: Canvas,
  fabricUtil: any,
  isApplyingRemoteRef: { current: boolean }
): Promise<void> {
  if (isApplyingRemoteRef.current) return;

  isApplyingRemoteRef.current = true;

  try {
    for (const objectId of event.keysChanged) {
      const objectJson = objectsMap.get(objectId);

      if (objectJson) {
        // Object was added or updated
        await applyObjectUpdate(canvas, objectId, objectJson, fabricUtil);
      } else {
        // Object was deleted
        removeObjectFromCanvas(canvas, objectId);
      }
    }

    canvas.renderAll();
  } catch (error) {
    console.error('Error applying remote Yjs update:', error);
  } finally {
    isApplyingRemoteRef.current = false;
  }
}

/**
 * Applies a single object update to the canvas
 */
async function applyObjectUpdate(
  canvas: Canvas,
  objectId: string,
  objectJson: any,
  fabricUtil: any
): Promise<void> {
  // Check if object already exists in canvas
  let existingObj: Object | null = null;
  canvas.forEachObject((obj: Object) => {
    const objWithData = obj as any;
    if (objWithData.data && objWithData.data.id === objectId) {
      existingObj = obj;
    }
  });

  if (existingObj) {
    // Update existing object properties
    try {
      (existingObj as any).set(objectJson);
      (existingObj as any).setCoords();
    } catch (error) {
      console.error('Error updating existing object:', error);
    }
  } else {
    // Add new object using enlivenObjects
    try {
      const util = fabricUtil || await getFabricUtil();
      const objects = await util.enlivenObjects([objectJson]);
      
      objects.forEach((obj: any) => {
        if (obj && typeof obj.set === 'function') {
          // Ensure the object has the correct ID
          const objWithData = obj as any;
          if (!objWithData.data) objWithData.data = {};
          objWithData.data.id = objectId;
          canvas.add(obj);
        }
      });
    } catch (error) {
      console.error('Error enlivening object:', error);
    }
  }
}

/**
 * Removes an object from the canvas by ID
 */
function removeObjectFromCanvas(canvas: Canvas, objectId: string): void {
  canvas.forEachObject((obj: Object) => {
    const objWithData = obj as any;
    if (objWithData.data && objWithData.data.id === objectId) {
      canvas.remove(obj);
    }
  });
}

/**
 * Gets fabric.util, loading it if necessary
 */
async function getFabricUtil(): Promise<any> {
  const fabricModule = await import('fabric');
  return (fabricModule as any).util;
}

/**
 * Syncs all existing canvas objects to Yjs
 * Useful for initial sync when loading a canvas
 */
export function syncAllObjectsToYjs(
  canvas: Canvas,
  objectsMap: Y.Map<any> | null,
  isApplyingRemote: boolean
): void {
  if (isApplyingRemote || !objectsMap) return;

  try {
    canvas.forEachObject((obj: Object) => {
      syncObjectToYjs(obj, objectsMap, isApplyingRemote);
    });
  } catch (error) {
    console.error('Error syncing all objects to Yjs:', error);
  }
}


import React, { useState, useEffect, useRef } from 'react';
import { Layers, Locate, Lock, Unlock, Edit, Eye } from 'lucide-react';
import type { GardenPlant, UserLawn } from '../types/garden';
import { useLanguage } from '../services/i18n';
import { useNavigate } from 'react-router-dom';

import getPlantIcon from './PlantIcon';

interface GardenCanvasProps {
  geoPolygon: [number, number][][];
  scaledPolygon: [number, number][] | null;
  isEditMode: boolean;
  onPolygonChange?: (poly: [number, number][]) => void;
  plants: GardenPlant[];
  plantNames?: Record<string, string>; // plantId -> display name
  onPlantMove?: (id: string, x: number, y: number) => void;
  onPlantLockToggle?: (id: string) => void;
  buildings?: any[];
  housePosition?: { x: number; y: number };
  houseGeoPosition?: { lat: number; lng: number } | null;
  lawns?: UserLawn[];
  onLawnsChange?: (lawns: UserLawn[]) => void;
  onEditModeChange?: (editMode: boolean) => void;
}

// Converts WGS84 (lng, lat) to dimensionless Web Mercator (x, y) coordinates
function toMercator(lng: number, lat: number): [number, number] {
  const x = lng * (Math.PI / 180);
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latRad = clampedLat * (Math.PI / 180);
  const y = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  return [x, y];
}

// Converts dimensionless Web Mercator (x, y) coordinates back to WGS84 (lng, lat)
function toWgs84(x: number, y: number): [number, number] {
  const lng = x * (180 / Math.PI);
  const latRad = 2 * Math.atan(Math.exp(y)) - Math.PI / 2;
  const lat = latRad * (180 / Math.PI);
  return [lng, lat];
}

// Compute bounding box from Mercator coordinates
function mercatorBounds(mercCoords: [number, number][]) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  mercCoords.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });
  return { minX, maxX, minY, maxY };
}

// Project Mercator coordinates to SVG 0-100 space using a given bounding box
function projectMercatorWithBounds(
  mercCoords: [number, number][],
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): [number, number][] {
  if (mercCoords.length === 0) return [];
  const { minX, maxX, minY, maxY } = bounds;
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  const maxRange = Math.max(rangeX, rangeY) || 0.0001;
  const size = 80;
  const margin = 10;
  return mercCoords.map(([x, y]) => {
    const svgX = margin + ((x - minX) / maxRange) * size + (rangeX < maxRange ? ((maxRange - rangeX) / maxRange) * (size / 2) : 0);
    const svgY = (margin + size) - ((y - minY) / maxRange) * size - (rangeY < maxRange ? ((maxRange - rangeY) / maxRange) * (size / 2) : 0);
    return [svgX, svgY] as [number, number];
  });
}

function isPointInSvgPolygon(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const GardenCanvas: React.FC<GardenCanvasProps> = ({
  geoPolygon,
  isEditMode,
  onPolygonChange,
  plants,
  plantNames = {},
  onPlantMove,
  onPlantLockToggle,
  buildings,
  housePosition,
  houseGeoPosition,
  lawns = [],
  onLawnsChange,
  onEditModeChange
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [localPolygon, setLocalPolygon] = useState<[number, number][]>([]);
  const [localPlantPositions, setLocalPlantPositions] = useState<Record<string, { x: number; y: number }>>({});
  const showPolygonEditor = false;
  
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ clientX: number; clientY: number; offsetX: number; offsetY: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'plant' | 'lawn';
    targetId: string;
  } | null>(null);

  const [draggingPlant, setDraggingPlant] = useState<{
    id: string;
    dragOffset: { x: number; y: number };
  } | null>(null);

  const [draggingVertex, setDraggingVertex] = useState<{
    index: number;
    dragOffset: { x: number; y: number };
  } | null>(null);

  const [draggingLawn, setDraggingLawn] = useState<{
    id: string;
    startPoints: [number, number][];
    startClickPt: { x: number; y: number };
  } | null>(null);

  const [draggingLawnVertex, setDraggingLawnVertex] = useState<{
    lawnId: string;
    vertexIdx: number;
    dragOffset: { x: number; y: number };
  } | null>(null);

  // Converts client screen coordinates (clientX, clientY) to SVG canvas coordinates
  const screenToSvgCoords = (clientX: number, clientY: number, svgElement: SVGSVGElement): { x: number; y: number } => {
    const pt = svgElement.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgElement.getScreenCTM();
    if (ctm) {
      const svgP = pt.matrixTransform(ctm.inverse());
      return { x: svgP.x, y: svgP.y };
    }
    return { x: clientX, y: clientY };
  };

  // Dismiss context menu when clicking anywhere else
  useEffect(() => {
    if (!contextMenu) return;
    const handleOutsideClick = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('contextmenu', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('contextmenu', handleOutsideClick);
    };
  }, [contextMenu]);

  const serializedGeoPolygon = JSON.stringify(geoPolygon);

  // Bounding box of the parcel geo ring in Mercator space — shared reference for projection
  const parcelMercatorInfo = React.useMemo(() => {
    const ring = geoPolygon?.[0] ?? [];
    if (ring.length === 0) return null;
    
    // Clean ring (remove duplicate last point if present)
    let cleanRing = [...ring];
    if (cleanRing.length > 3 && cleanRing[0][0] === cleanRing[cleanRing.length - 1][0] && cleanRing[0][1] === cleanRing[cleanRing.length - 1][1]) {
      cleanRing = cleanRing.slice(0, -1);
    }
    
    const mercRing = cleanRing.map(([lng, lat]) => toMercator(lng, lat));
    const bounds = mercatorBounds(mercRing);
    return { mercRing, bounds };
  }, [serializedGeoPolygon]);

  const projectGeoToSvg = React.useCallback((lng: number, lat: number): [number, number] => {
    if (!parcelMercatorInfo) return [0, 0];
    const merc = toMercator(lng, lat);
    const projected = projectMercatorWithBounds([merc], parcelMercatorInfo.bounds);
    return projected[0];
  }, [parcelMercatorInfo]);

  const projectGeoListToSvg = React.useCallback((coords: [number, number][]): [number, number][] => {
    if (!parcelMercatorInfo) return [];
    const mercCoords = coords.map(([lng, lat]) => toMercator(lng, lat));
    return projectMercatorWithBounds(mercCoords, parcelMercatorInfo.bounds);
  }, [parcelMercatorInfo]);

  useEffect(() => {
    if (parcelMercatorInfo) {
      const projected = projectMercatorWithBounds(parcelMercatorInfo.mercRing, parcelMercatorInfo.bounds);
      setLocalPolygon(projected);
    }
  }, [parcelMercatorInfo]);

  useEffect(() => {
    setLocalPlantPositions(prev => {
      const positions: Record<string, { x: number; y: number }> = {};
      plants.forEach(p => {
        if (draggingPlant && draggingPlant.id === p.id) {
          positions[p.id] = prev[p.id] || { x: p.position.x, y: p.position.y };
        } else {
          positions[p.id] = { x: p.position.x, y: p.position.y };
        }
      });
      return positions;
    });
  }, [plants, draggingPlant]);

  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [backgroundLayer, setBackgroundLayer] = useState<'none' | 'bgt'>('bgt');

  // WMS BGT & Street Backdrop configuration
  const backdropInfo = React.useMemo(() => {
    if (!parcelMercatorInfo) return null;
    const { minX, maxX, minY, maxY } = parcelMercatorInfo.bounds;
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const maxRange = Math.max(rangeX, rangeY) || 0.0001;
    const padding = 2.0; // Extend map to show surroundings fully (e.g. 5x parcel size)

    // Calculate projection base (square area containing the parcel)
    const offsetX = rangeX < maxRange ? ((maxRange - rangeX) / 2) : 0;
    const offsetY = rangeY < maxRange ? ((maxRange - rangeY) / 2) : 0;

    const projMinX = minX - offsetX;
    const projMinY = minY - offsetY;

    // Calculate extended background map bounding box in Mercator coordinates
    const bgMinX = projMinX - padding * maxRange;
    const bgMaxX = projMinX + maxRange + padding * maxRange;
    const bgMinY = projMinY - padding * maxRange;
    const bgMaxY = projMinY + maxRange + padding * maxRange;

    // Calculate SVG dimensions for the extended background image (for streets WMS)
    // Project the corners of the bounding box to SVG space using the parcel's Mercator bounds
    const projectedTL = projectMercatorWithBounds([[bgMinX, bgMaxY]], parcelMercatorInfo.bounds);
    const projectedBR = projectMercatorWithBounds([[bgMaxX, bgMinY]], parcelMercatorInfo.bounds);

    let x = 0, y = 0, width = 0, height = 0;
    if (projectedTL.length > 0 && projectedBR.length > 0) {
      x = projectedTL[0][0];
      y = projectedTL[0][1];
      width = projectedBR[0][0] - x;
      height = projectedBR[0][1] - y;
    }

    // Convert Mercator coordinates back to WGS84 for the WMS request parameters
    const [bgMinLng, bgMinLat] = toWgs84(bgMinX, bgMinY);
    const [bgMaxLng, bgMaxLat] = toWgs84(bgMaxX, bgMaxY);

    const streetsUrl = `https://service.pdok.nl/brt/topraster/wms/v1_0?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&LAYERS=top25raster&CRS=EPSG:4326&BBOX=${bgMinLat},${bgMinLng},${bgMaxLat},${bgMaxLng}&WIDTH=1000&HEIGHT=1000`;

    // Calculate BGT WMTS Tiles using Web Mercator formulas directly
    const getTileCoords = (xm: number, ym: number, zoom: number) => {
      const xTile = ((xm + Math.PI) / (2 * Math.PI)) * Math.pow(2, zoom);
      const yTile = ((Math.PI - ym) / (2 * Math.PI)) * Math.pow(2, zoom);
      return { xTile, yTile };
    };

    const getTileMercatorBounds = (col: number, row: number, zoom: number) => {
      const numTiles = Math.pow(2, zoom);
      const xLeft = (col / numTiles) * 2 * Math.PI - Math.PI;
      const xRight = ((col + 1) / numTiles) * 2 * Math.PI - Math.PI;
      const yTop = Math.PI - (row / numTiles) * 2 * Math.PI;
      const yBottom = Math.PI - ((row + 1) / numTiles) * 2 * Math.PI;
      return { xLeft, xRight, yTop, yBottom };
    };

    // Calculate optimal zoom level based on desired bounding box width in Mercator coordinates
    const desiredWidth = maxRange * (1 + 2 * padding);
    const z = Math.min(19, Math.max(14, Math.floor(Math.log2((2 * Math.PI) / desiredWidth)) + 1));

    const tl = getTileCoords(bgMinX, bgMaxY, z);
    const br = getTileCoords(bgMaxX, bgMinY, z);

    const minCol = Math.floor(tl.xTile);
    const maxCol = Math.floor(br.xTile);
    const minRow = Math.floor(tl.yTile);
    const maxRow = Math.floor(br.yTile);

    const bgtTiles: { id: string; url: string; x: number; y: number; width: number; height: number }[] = [];

    const colCount = Math.max(0, maxCol - minCol + 1);
    const rowCount = Math.max(0, maxRow - minRow + 1);

    if (colCount * rowCount <= 100) {
      for (let col = minCol; col <= maxCol; col++) {
        for (let row = minRow; row <= maxRow; row++) {
          const { xLeft, xRight, yTop, yBottom } = getTileMercatorBounds(col, row, z);

          const projectedTileTL = projectMercatorWithBounds([[xLeft, yTop]], parcelMercatorInfo.bounds);
          const projectedTileBR = projectMercatorWithBounds([[xRight, yBottom]], parcelMercatorInfo.bounds);

          if (projectedTileTL.length > 0 && projectedTileBR.length > 0) {
            const [xMin, yMin] = projectedTileTL[0];
            const [xMax, yMax] = projectedTileBR[0];
            const url = `https://service.pdok.nl/lv/bgt/wmts/v1_0/achtergrondvisualisatie/EPSG:3857/${z}/${col}/${row}.png`;

            // Add a small overlap (0.1 SVG units) to eliminate tile gaps completely
            const overlap = 0.1;
            bgtTiles.push({
              id: `${z}-${col}-${row}`,
              url,
              x: xMin,
              y: yMin,
              width: xMax - xMin + overlap,
              height: yMax - yMin + overlap
            });
          }
        }
      }
    }

    return { bgtTiles, streetsUrl, x, y, width, height };
  }, [parcelMercatorInfo]);

  // Find the building polygon that contains the house position (or closest one)
  const houseCentroid = React.useMemo(() => {
    let targetX = 0;
    let targetY = 0;
    if (houseGeoPosition) {
      const projected = projectGeoToSvg(houseGeoPosition.lng, houseGeoPosition.lat);
      targetX = projected[0];
      targetY = projected[1];
    } else if (housePosition) {
      targetX = housePosition.x;
      targetY = housePosition.y;
    } else {
      return null;
    }

    if (buildings && buildings.length > 0 && parcelMercatorInfo) {
      for (const b of buildings) {
        const outerRing: [number, number][] = Array.isArray(b.polygon[0]?.[0]) ? b.polygon[0] : b.polygon;
        const projected = projectGeoListToSvg(outerRing);
        if (projected.length > 0 && isPointInSvgPolygon(targetX, targetY, projected)) {
          let sumX = 0, sumY = 0;
          projected.forEach(([x, y]) => {
            sumX += x;
            sumY += y;
          });
          return { x: sumX / projected.length, y: sumY / projected.length };
        }
      }
    }
    return { x: targetX, y: targetY };
  }, [houseGeoPosition, housePosition, buildings, projectGeoToSvg, projectGeoListToSvg, parcelMercatorInfo]);

  const handlePlantPointerDown = (e: React.PointerEvent, plantId: string, x: number, y: number) => {
    const plant = plants.find(p => p.id === plantId);
    if ((isEditMode && !showPolygonEditor) || (plant?.locked)) return;
    if (e.button !== 0) return; // Only drag with left click
    e.stopPropagation();
    
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const pt = screenToSvgCoords(e.clientX, e.clientY, svgEl);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    setDraggingPlant({
      id: plantId,
      dragOffset: { x: pt.x - x, y: pt.y - y }
    });
  };

  const handlePlantPointerMove = (e: React.PointerEvent) => {
    if (!draggingPlant || !svgRef.current) return;
    if (e.buttons === 0) {
      setDraggingPlant(null);
      return;
    }
    const pt = screenToSvgCoords(e.clientX, e.clientY, svgRef.current);
    const newX = Math.max(2, Math.min(98, pt.x - draggingPlant.dragOffset.x));
    const newY = Math.max(2, Math.min(98, pt.y - draggingPlant.dragOffset.y));

    setLocalPlantPositions(prev => ({
      ...prev,
      [draggingPlant.id]: { x: newX, y: newY }
    }));
  };

  const handlePlantPointerUp = (e: React.PointerEvent) => {
    if (!draggingPlant) return;
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);
    
    const finalPos = localPlantPositions[draggingPlant.id] || { x: 50, y: 50 };
    onPlantMove?.(draggingPlant.id, finalPos.x, finalPos.y);
    setDraggingPlant(null);
  };

  const handleVertexPointerDown = (e: React.PointerEvent, index: number, x: number, y: number) => {
    if (!showPolygonEditor) return;
    e.stopPropagation();
    
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const pt = screenToSvgCoords(e.clientX, e.clientY, svgEl);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    setDraggingVertex({
      index,
      dragOffset: { x: pt.x - x, y: pt.y - y }
    });
  };

  const handleVertexPointerMove = (e: React.PointerEvent) => {
    if (!draggingVertex || !svgRef.current) return;
    if (e.buttons === 0) {
      setDraggingVertex(null);
      return;
    }
    const pt = screenToSvgCoords(e.clientX, e.clientY, svgRef.current);
    const newX = Math.max(0, Math.min(100, pt.x - draggingVertex.dragOffset.x));
    const newY = Math.max(0, Math.min(100, pt.y - draggingVertex.dragOffset.y));

    const updated = [...localPolygon];
    updated[draggingVertex.index] = [newX, newY];
    setLocalPolygon(updated);
  };

  const handleVertexPointerUp = (e: React.PointerEvent) => {
    if (!draggingVertex) return;
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    onPolygonChange?.(localPolygon);
    setDraggingVertex(null);
  };

  const handleLawnDragStart = (e: React.PointerEvent, lawn: UserLawn) => {
    if (!isEditMode) return;
    if (e.button !== 0) return; // Only drag with left click
    e.stopPropagation();
    
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const pt = screenToSvgCoords(e.clientX, e.clientY, svgEl);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDraggingLawn({
      id: lawn.id,
      startPoints: [...lawn.points.map((p) => [...p] as [number, number])],
      startClickPt: pt
    });
  };

  const handleLawnPointerMove = (e: React.PointerEvent) => {
    if (!draggingLawn || !svgRef.current) return;
    if (e.buttons === 0) {
      setDraggingLawn(null);
      return;
    }
    const pt = screenToSvgCoords(e.clientX, e.clientY, svgRef.current);
    const deltaX = pt.x - draggingLawn.startClickPt.x;
    const deltaY = pt.y - draggingLawn.startClickPt.y;

    const newPoints = draggingLawn.startPoints.map(([x, y]) => [
      Math.max(2, Math.min(98, x + deltaX)),
      Math.max(2, Math.min(98, y + deltaY))
    ] as [number, number]);

    if (lawns && onLawnsChange) {
      onLawnsChange(lawns.map((l: UserLawn) => l.id === draggingLawn.id ? { ...l, points: newPoints } : l));
    }
  };

  const handleLawnPointerUp = (e: React.PointerEvent) => {
    if (!draggingLawn) return;
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);
    setDraggingLawn(null);
  };

  const handleLawnVertexPointerDown = (e: React.PointerEvent, lawnId: string, vertexIdx: number, x: number, y: number) => {
    if (e.button !== 0) return; // Only drag with left click
    e.stopPropagation();
    
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const pt = screenToSvgCoords(e.clientX, e.clientY, svgEl);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDraggingLawnVertex({
      lawnId,
      vertexIdx,
      dragOffset: { x: pt.x - x, y: pt.y - y }
    });
  };

  const handleLawnVertexPointerMove = (e: React.PointerEvent) => {
    if (!draggingLawnVertex || !svgRef.current) return;
    if (e.buttons === 0) {
      setDraggingLawnVertex(null);
      return;
    }
    const pt = screenToSvgCoords(e.clientX, e.clientY, svgRef.current);
    const newX = Math.max(2, Math.min(98, pt.x - draggingLawnVertex.dragOffset.x));
    const newY = Math.max(2, Math.min(98, pt.y - draggingLawnVertex.dragOffset.y));

    if (lawns && onLawnsChange) {
      onLawnsChange(lawns.map((l: UserLawn) => {
        if (l.id === draggingLawnVertex.lawnId) {
          const newPoints = [...l.points];
          newPoints[draggingLawnVertex.vertexIdx] = [newX, newY];
          return { ...l, points: newPoints };
        }
        return l;
      }));
    }
  };

  const handleLawnVertexPointerUp = (e: React.PointerEvent) => {
    if (!draggingLawnVertex) return;
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);
    setDraggingLawnVertex(null);
  };

  const handleAddVertex = (idx: number) => {
    if (!showPolygonEditor) return;
    const p1 = localPolygon[idx];
    const p2 = localPolygon[(idx + 1) % localPolygon.length];
    
    const midX = (p1[0] + p2[0]) / 2;
    const midY = (p1[1] + p2[1]) / 2;

    const updated = [...localPolygon];
    updated.splice(idx + 1, 0, [midX, midY]);
    setLocalPolygon(updated);
    onPolygonChange?.(updated);
  };

  const handleVertexDoubleClick = (idx: number) => {
    if (!showPolygonEditor || localPolygon.length <= 3) return;
    const updated = localPolygon.filter((_, i) => i !== idx);
    setLocalPolygon(updated);
    onPolygonChange?.(updated);
  };

  const handlePanStart = (e: React.PointerEvent) => {
    // Only start panning if not editing polygon and not dragging any element
    if (showPolygonEditor || draggingPlant || draggingVertex) return;
    if (e.button !== 0) return; // Only pan with left click
    setIsPanning(true);
    setPanStart({
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX,
      offsetY,
    });
    // Capture pointer to receive move events outside svg bounds
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePanEnd = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setIsPanning(false);
    setPanStart(null);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };
  const handlePanMove = (e: React.PointerEvent) => {
    if (!isPanning || !panStart) return;
    if (e.buttons === 0) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    const dx = e.clientX - panStart.clientX;
    const dy = e.clientY - panStart.clientY;
    // Convert pixel delta to SVG units (viewport size / element pixel size)
    const svgDx = (dx / svgRect.width) * (100 / zoom);
    const svgDy = (dy / svgRect.height) * (100 / zoom);
    // Add (not subtract) — dragging right should move content right
    setOffsetX(panStart.offsetX + svgDx);
    setOffsetY(panStart.offsetY + svgDy);
  };

  const pointsString = localPolygon.map(([x, y]) => `${x},${y}`).join(' ');

  const midpoints = localPolygon.map((p, idx) => {
    const nextP = localPolygon[(idx + 1) % localPolygon.length];
    return {
      index: idx,
      x: (p[0] + nextP[0]) / 2,
      y: (p[1] + nextP[1]) / 2
    };
  });

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-slate-100"
      // Prevent pinch-to-zoom on the page level
      style={{ touchAction: 'none' }}
      ref={(el) => {
        if (el) {
          el.onwheel = (e) => {
            e.preventDefault();
            const zoomStep = 0.001 * e.deltaY;
            setZoom((z) => Math.min(3, Math.max(0.5, z - zoomStep)));
          };
        }
      }}
    >
      <div ref={containerRef} className="relative w-full h-full bg-slate-50 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />

        <svg 
          ref={svgRef}
          className="w-full h-full drop-shadow-xl select-none" 
          viewBox={`${-offsetX} ${-offsetY} ${100 / zoom} ${100 / zoom}`}
          onPointerDown={handlePanStart}
          onPointerMove={e => {
            handlePlantPointerMove(e);
            handleVertexPointerMove(e);
            handleLawnPointerMove(e);
            handleLawnVertexPointerMove(e);
            handlePanMove(e);
          }}
          onPointerUp={e => {
            handlePanEnd(e);
            setDraggingPlant(null);
            setDraggingVertex(null);
            setDraggingLawn(null);
            setDraggingLawnVertex(null);
          }}
        >
          {/* Faint BGT Background Map Tiles (PDOK WMTS) */}
          {backgroundLayer === 'bgt' && backdropInfo && backdropInfo.bgtTiles && (
            <g opacity="0.6">
              {backdropInfo.bgtTiles.map((tile) => (
                <image
                  key={tile.id}
                  href={tile.url}
                  x={tile.x}
                  y={tile.y}
                  width={tile.width}
                  height={tile.height}
                />
              ))}
            </g>
          )}



          {localPolygon.length > 0 && (
            <polygon 
              points={pointsString} 
              fill="#dcfce7"
              fillOpacity={backgroundLayer !== 'none' ? "0.4" : "1.0"}
              stroke="#10b981"
              strokeWidth="0.8"
              className="transition-colors duration-300"
            />
          )}

          {/* Lawns rendering */}
          {lawns && lawns.map((lawn: UserLawn) => {
            const pointsStr = lawn.points.map(([x, y]: [number, number]) => `${x},${y}`).join(' ');
            const isTerrace = lawn.type === 'terrace';
            return (
              <g key={lawn.id}>
                <polygon
                  points={pointsStr}
                  fill={isTerrace ? "#94a3b8" : "#a3e635"} // Slate-grey for terrace, lime green for lawn
                  fillOpacity="0.4"
                  stroke={isTerrace ? "#475569" : "#65a30d"}
                  strokeWidth="0.5"
                  strokeDasharray="1.5 1"
                  className={isEditMode ? "cursor-move" : ""}
                  onPointerDown={e => handleLawnDragStart(e, lawn)}
                  onPointerUp={handleLawnPointerUp}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (isEditMode && onLawnsChange) {
                      const confirmMsg = isTerrace
                        ? (language === 'nl' ? "Weet je zeker dat je dit terras wilt verwijderen?" : "Are you sure you want to delete this terrace?")
                        : (language === 'nl' ? "Weet je zeker dat je dit gazon wilt verwijderen?" : "Are you sure you want to delete this lawn?");
                      if (confirm(confirmMsg)) {
                        onLawnsChange(lawns.filter((l: UserLawn) => l.id !== lawn.id));
                      }
                    }
                  }}
                  onContextMenu={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setContextMenu({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        type: 'lawn',
                        targetId: lawn.id
                      });
                    }
                  }}
                />
                
                {/* Drag handles for lawn/terrace corners - only when in edit mode */}
                {isEditMode && lawn.points.map(([x, y]: [number, number], vertexIdx: number) => (
                  <circle
                    key={`${lawn.id}-vertex-${vertexIdx}`}
                    cx={x}
                    cy={y}
                    r="1.5"
                    className={`fill-white stroke-[0.4] cursor-pointer transition-colors duration-200 ${
                      isTerrace
                        ? 'stroke-slate-600 hover:fill-slate-100 hover:stroke-slate-800'
                        : 'stroke-lime-600 hover:fill-lime-100 hover:stroke-lime-800'
                    }`}
                    onPointerDown={e => handleLawnVertexPointerDown(e, lawn.id, vertexIdx, x, y)}
                    onPointerUp={handleLawnVertexPointerUp}
                  />
                ))}
              </g>
            );
          })}
          
          {showPolygonEditor && localPolygon.map(([x, y], idx) => (
            <g key={`vertex-${idx}`}>
              <circle
                cx={x}
                cy={y}
                r="2"
                className="fill-white stroke-blue-500 stroke-[0.5] cursor-pointer hover:fill-blue-100 hover:stroke-blue-700 transition-colors duration-200"
                onPointerDown={e => handleVertexPointerDown(e, idx, x, y)}
                onPointerUp={handleVertexPointerUp}
                onDoubleClick={() => handleVertexDoubleClick(idx)}
              />
              <text x={x} y={y - 3} textAnchor="middle" className="text-[2.5px] fill-blue-600 font-bold select-none">{idx + 1}</text>
            </g>
          ))}

          {showPolygonEditor && midpoints.map((mid) => (
            <g 
              key={`mid-${mid.index}`}
              onClick={() => handleAddVertex(mid.index)}
              className="cursor-plus hover:scale-125 transition-transform origin-center"
            >
              <circle
                cx={mid.x}
                cy={mid.y}
                r="1.2"
                className="fill-blue-50 stroke-blue-400 stroke-[0.3]"
              />
              <text 
                x={mid.x} 
                y={mid.y + 0.5} 
                textAnchor="middle" 
                className="text-[1.8px] fill-blue-500 font-bold pointer-events-none select-none"
              >
                +
              </text>
            </g>
          ))}

          {buildings && buildings.length > 0 && parcelMercatorInfo && (() => {

            return (
              <g>
                {buildings.map(b => {
                  // b.polygon from getPolygonsFromGeometry is rings[][] — outer ring is [0]
                  const outerRing: [number, number][] = Array.isArray(b.polygon[0]?.[0]) ? b.polygon[0] : b.polygon;
                  const projected = projectGeoListToSvg(outerRing);
                  if (projected.length === 0) return null;
                  return (
                    <polygon key={b.id}
                      points={projected.map(([x, y]) => `${x},${y}`).join(' ')}
                      fill="#6b7280"
                      opacity="0.7"
                      stroke="#111827"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </g>
            );
          })()}

          {houseCentroid && (
            <g transform={`translate(${houseCentroid.x}, ${houseCentroid.y})`}>
              {/* White backing circle with orange border */}
              <circle r="1.8" fill="white" opacity="0.95" stroke="#f59e0b" strokeWidth="0.3" className="drop-shadow-sm" />
              {/* Native SVG orange house shape */}
              <path d="M-0.9 0.2 L0 -0.7 L0.9 0.2 L0.7 0.2 L0.7 0.9 L-0.7 0.9 L-0.7 0.2 Z" fill="#d97706" />
            </g>
          )}

          {!showPolygonEditor && plants.map(plant => {
            const pos = localPlantPositions[plant.id] || plant.position;
            const Icon = getPlantIcon(plant.type);
            const isLocked = plant.locked;
            const fullName = plantNames?.[plant.id] || plant.nickname || plant.plantId || 'Plant';
            const shortName = fullName.length > 10 ? fullName.slice(0, 10) + '…' : fullName;
            const isDragging = draggingPlant?.id === plant.id;
            return (
              <g 
                key={plant.id} 
                transform={`translate(${pos.x}, ${pos.y})`}
              >
                <g
                  style={{ 
                    cursor: isLocked ? 'not-allowed' : (isEditMode ? 'default' : 'grab'),
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                  }}
                  className={`group select-none hover:scale-[1.35] ${isEditMode ? 'opacity-40 pointer-events-none' : ''}`}
                  onPointerDown={e => handlePlantPointerDown(e, plant.id, pos.x, pos.y)}
                  onPointerUp={handlePlantPointerUp}
                  onContextMenu={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setContextMenu({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        type: 'plant',
                        targetId: plant.id
                      });
                    }
                  }}
                >
                  <title>{fullName}{isLocked ? ' (locked)' : ''}</title>
                  {/* Plant circle — smaller r=0.9 */}
                  <circle r="0.9" fill="white" stroke={isLocked ? '#f87171' : '#10b981'} strokeWidth="0.22" />
                  <foreignObject x="-0.6" y="-0.6" width="1.2" height="1.2" style={{ pointerEvents: 'none' }}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon className="w-0.85 h-0.85 text-emerald-600" />
                    </div>
                  </foreignObject>
                  
                  {/* Lock badge — scaled down and translated closer */}
                  <g
                    transform="translate(0.7, -0.7) scale(0.65)"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); onPlantLockToggle?.(plant.id); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle r="0.65" fill="white" stroke={isLocked ? '#f87171' : '#cbd5e1'} strokeWidth="0.12" />
                    {isLocked
                      ? <path d="M-0.3 0.07 h0.6 v0.4 h-0.6 z M-0.18 0.07 v-0.18 a0.18 0.18 0 0 1 0.36 0 v0.18" fill="none" stroke="#ef4444" strokeWidth="0.12" strokeLinecap="round"/>
                      : <path d="M-0.3 0.07 h0.6 v0.4 h-0.6 z M-0.18 0.07 v-0.18 a0.18 0.18 0 0 1 0.33 -0.08" fill="none" stroke="#94a3b8" strokeWidth="0.12" strokeLinecap="round"/>
                    }
                  </g>
                  
                  {/* Name below */}
                  <text 
                    y="1.8" 
                    textAnchor="middle"
                    fill="#475569"
                    style={{ fontSize: '0.85px', pointerEvents: 'none', userSelect: 'none', fontWeight: 600 }}
                  >
                    {shortName}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Compass Rose */}
        <div className="absolute bottom-6 right-6 flex flex-col items-center gap-1 bg-white/95 backdrop-blur px-3 py-3 rounded-2xl shadow-md border border-slate-100 select-none z-10">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-slate-200" />
            
            {/* Arrow/Pointer */}
            <div className="relative w-0.5 h-7 bg-slate-300 flex items-center justify-center">
              {/* North tip */}
              <div className="absolute top-0 w-0 h-0 border-l-[3.5px] border-r-[3.5px] border-b-[7px] border-l-transparent border-r-transparent border-b-rose-500 -translate-y-[2px]" />
              {/* South tip */}
              <div className="absolute bottom-0 w-0 h-0 border-l-[3.5px] border-r-[3.5px] border-t-[7px] border-l-transparent border-r-transparent border-t-slate-400 translate-y-[2px]" />
            </div>
            
            {/* Label N */}
            <span className="absolute top-0.5 text-[8px] font-black text-rose-500 leading-none">N</span>
            {/* Label S */}
            <span className="absolute bottom-0.5 text-[8px] font-black text-slate-400 leading-none">S</span>
            {/* Label W */}
            <span className="absolute left-1 text-[8px] font-black text-slate-400 leading-none">W</span>
            {/* Label E */}
            <span className="absolute right-1 text-[8px] font-black text-slate-400 leading-none">
              {language === 'nl' ? 'O' : 'E'}
            </span>
          </div>
        </div>

        <div className="absolute top-4 left-4 flex flex-col items-start gap-2.5 z-25">
          <button 
            onClick={() => setShowLayerMenu(prev => !prev)} 
            className={`p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-md transition-all border hover:scale-105 active:scale-95 ${
              backgroundLayer !== 'none'
                ? 'border-emerald-500 text-emerald-600 bg-emerald-50/80 hover:bg-emerald-50' 
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title={language === 'nl' ? "Kaartlagen selecteren" : "Select map layers"}
          >
            <Layers className="w-5 h-5" />
          </button>

          <button 
            onClick={() => {
              setZoom(1);
              setOffsetX(0);
              setOffsetY(0);
            }} 
            className="p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-md transition-all border border-slate-200 text-slate-500 hover:bg-slate-50 hover:scale-105 active:scale-95 flex items-center justify-center"
            title={language === 'nl' ? "Hercenteren op adres" : "Center on address"}
          >
            <Locate className="w-5 h-5 text-slate-600" />
          </button>
          
          {showLayerMenu && (
            <div className="mt-1 bg-white/95 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 min-w-[150px] animate-in fade-in slide-in-from-top-2 duration-150 select-none">
              <span className="px-2.5 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                {language === 'nl' ? "Achtergrond" : "Background"}
              </span>
              <button
                onClick={() => { setBackgroundLayer('none'); setShowLayerMenu(false); }}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  backgroundLayer === 'none'
                    ? 'bg-emerald-50 text-emerald-600 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {language === 'nl' ? "Geen achtergrond" : "No background"}
              </button>
              <button
                onClick={() => { setBackgroundLayer('bgt'); setShowLayerMenu(false); }}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  backgroundLayer === 'bgt'
                    ? 'bg-emerald-50 text-emerald-600 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {language === 'nl' ? "BGT Achtergrond (PDOK)" : "BGT Background (PDOK)"}
              </button>

            </div>
          )}
        {contextMenu && (
          <div
            className="absolute bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl py-2 px-1 min-w-[160px] z-[100] animate-in fade-in zoom-in-95 duration-100 select-none"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.type === 'plant' && (() => {
              const isLocked = plants.find(p => p.id === contextMenu.targetId)?.locked;
              return (
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => {
                      onPlantLockToggle?.(contextMenu.targetId);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors flex items-center gap-2"
                  >
                    {isLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                        {language === 'nl' ? 'Plant ontgrendelen' : 'Unlock plant'}
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        {language === 'nl' ? 'Plant vergrendelen' : 'Lock plant'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const plant = plants.find(p => p.id === contextMenu.targetId);
                      if (plant) {
                        const fullName = plantNames?.[plant.id] || plant.nickname || plant.plantId || 'Plant';
                        navigate(`/inventory?search=${encodeURIComponent(fullName)}`);
                      }
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    {language === 'nl' ? 'Bekijken in inventaris' : 'View in inventory'}
                  </button>
                </div>
              );
            })()}
            {contextMenu.type === 'lawn' && (() => {
              const targetLawn = lawns.find(l => l.id === contextMenu.targetId);
              const isTerrace = targetLawn?.type === 'terrace';
              return (
                <button
                  onClick={() => {
                    onEditModeChange?.(true);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Edit className="w-3.5 h-3.5 text-emerald-500" />
                  {isTerrace 
                    ? (language === 'nl' ? 'Terras bewerken' : 'Edit terrace')
                    : (language === 'nl' ? 'Gazon bewerken' : 'Edit lawn')
                  }
                </button>
              );
            })()}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default GardenCanvas;

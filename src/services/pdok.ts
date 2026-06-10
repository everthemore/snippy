/**
 * PDOK Locatieserver & OGC API Features Integration
 * Documentation: https://api.pdok.nl/bzk/locatieserver/7/v3_1/
 */

const LOCATIESERVER_BASE = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1';
const OGC_PERCELEN_BASE = 'https://api.pdok.nl/kadaster/brk-kadastrale-percelen/ogc/v1';
const OGC_BAG_BASE = 'https://api.pdok.nl/kadaster/bag/ogc/v2';

function isPointInPolygon(lng: number, lat: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
// Helper to extract polygon rings (outer ring) from GeoJSON geometry (Polygon or MultiPolygon)
function getPolygonsFromGeometry(geometry: any): [number, number][][][] {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') {
    return [geometry.coordinates]; // Single polygon
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates; // Array of polygons
  }
  return [];
}


function getCentroidDistance(lng: number, lat: number, coordinates: [number, number][][]): number {
  const ring = coordinates[0];
  let sumLng = 0;
  let sumLat = 0;
  ring.forEach(([ptLng, ptLat]) => {
    sumLng += ptLng;
    sumLat += ptLat;
  });
  const avgLng = sumLng / ring.length;
  const avgLat = sumLat / ring.length;
  const dLng = avgLng - lng;
  const dLat = avgLat - lat;
  return dLng * dLng + dLat * dLat;
}

export interface Suggestion {
  id: string;
  weergavenaam: string;
}

export interface LookupResult {
  centroide_rd: string; // e.g. "POINT(155000 463000)"
  centroide_ll: string; // e.g. "POINT(4.89 52.37)"
  geometrie_rd: string;
}

export interface ParcelInfo {
  type: "Polygon";
  coordinates: [number, number][][];
  areaValue: number;
  nationalRef: string;
  guessedSoil: 'clay' | 'sand' | 'loam' | 'peat';
  guessedSunlight: 'full_sun' | 'partial_shade' | 'full_shade';
}

export const pdokService = {
  /**
   * Search for an address suggestion
   */
  async suggest(query: string): Promise<Suggestion[]> {
    const response = await fetch(`${LOCATIESERVER_BASE}/suggest?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.response.docs;
  },

  /**
   * Get coordinates for a suggestion ID
   */
  async lookup(id: string): Promise<LookupResult> {
    const response = await fetch(`${LOCATIESERVER_BASE}/lookup?id=${id}`);
    const data = await response.json();
    return data.response.docs[0];
  },

  /**
   * Get the parcel polygon from Kadaster WFS using coordinates
   * Note: This uses the modern OGC API Features cadastralparcel layer
   */
  async getParcel(lat: number, lng: number): Promise<ParcelInfo> {
    console.log(`Querying Kadaster OGC Features for ${lat}, ${lng}`);
    
    // Construct a tiny bounding box around the coordinate (approx 15 meters)
    const delta = 0.00015;
    const latMin = lat - delta;
    const latMax = lat + delta;
    const lngMin = lng - delta;
    const lngMax = lng + delta;

    const url = `${OGC_PERCELEN_BASE}/collections/cadastralparcel/items?bbox=${lngMin},${latMin},${lngMax},${latMax}&crs=http://www.opengis.net/def/crs/OGC/1.3/CRS84&limit=15`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Kadaster API response error");
      const data = await response.json();
      
      let feature = null;
      
      // 1. Try to find the parcel that actually contains the address coordinate
      for (const f of data.features || []) {
        if (f.geometry) {
          const polygons = getPolygonsFromGeometry(f.geometry);
          for (const poly of polygons) {
            const outerRing = poly[0];
            if (isPointInPolygon(lng, lat, outerRing)) {
              feature = f;
              break;
            }
          }
          if (feature) break;
        }
      }

      // 2. If no parcel directly contains the point (e.g., precision/boundary issues), find the closest one
      if (!feature && data.features && data.features.length > 0) {
        let minDistance = Infinity;
        for (const f of data.features) {
          if (f.geometry) {
            const polygons = getPolygonsFromGeometry(f.geometry);
            for (const poly of polygons) {
              const dist = getCentroidDistance(lng, lat, poly);
              if (dist < minDistance) {
                minDistance = dist;
                feature = f;
              }
            }
          }
        }
      }

      // 3. Fallback to the first feature
      if (!feature) {
        feature = data.features?.[0];
      }

      if (!feature || !feature.geometry) {
        throw new Error("No parcel found at location");
      }

      const coordinates = feature.geometry.coordinates;
      const areaValue = feature.properties?.area_value || 150;
      const nationalRef = feature.properties?.national_cadastral_reference || "Unknown Kadaster Ref";

      // 1. Guess Soil Type based on Dutch coordinates (Geographic Heuristic)
      let guessedSoil: 'clay' | 'sand' | 'loam' | 'peat' = 'sand';
      if (lat > 52.8 && lng > 6.4) {
        guessedSoil = 'peat'; // Drenthe / Groningen peat bogs
      } else if (lat < 51.2) {
        guessedSoil = 'loam'; // Limburg Loess/Loam
      } else if (lng < 5.0) {
        guessedSoil = 'clay'; // West-NL (Zeeland, Holland, Flevoland clay polders)
      } else {
        guessedSoil = 'sand'; // Veluwe / Utrechtse Heuvelrug / East NL
      }

      // 2. Guess Sunlight Orientation based on Parcel shape
      // Calculate bounding box width/height in coordinates
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const ring = coordinates[0];
      ring.forEach(([ptLng, ptLat]: [number, number]) => {
        if (ptLng < minX) minX = ptLng;
        if (ptLng > maxX) maxX = ptLng;
        if (ptLat < minY) minY = ptLat;
        if (ptLat > maxY) maxY = ptLat;
      });

      const width = maxX - minX;
      const height = maxY - minY;
      
      // Heuristic: If parcel is longer North-South (height > width), it likely has a south-facing garden (full sun)
      // If it is wider East-West, it gets partial morning/afternoon sun.
      let guessedSunlight: 'full_sun' | 'partial_shade' | 'full_shade' = 'partial_shade';
      if (height > width * 1.2) {
        guessedSunlight = 'full_sun';
      } else if (width > height * 1.5) {
        guessedSunlight = 'partial_shade';
      } else {
        guessedSunlight = 'full_sun'; // Default to a sunny garden
      }

      return {
        type: "Polygon",
        coordinates,
        areaValue,
        nationalRef,
        guessedSoil,
        guessedSunlight
      };
    } catch (e) {
      console.warn("Failed to fetch Kadaster parcel, falling back to mock polygon", e);
      // Fallback response
      return {
        type: "Polygon",
        coordinates: [
          [
            [lng - 0.0001, lat - 0.0001],
            [lng + 0.0001, lat - 0.0001],
            [lng + 0.0001, lat + 0.0001],
            [lng - 0.0001, lat + 0.0001],
            [lng - 0.0001, lat - 0.0001]
          ]
        ],
        areaValue: 200,
        nationalRef: "Fallback Ref 123",
        guessedSoil: 'sand',
        guessedSunlight: 'full_sun'
      };
    }
  },
  async getBuildingsForParcel(lat: number, lng: number, parcelCoords?: [number, number][][]): Promise<any[]> {
    // Use BAG (Basisregistraties Adressen en Gebouwen) pand collection for buildings
    // BRK only contains cadastral parcels — buildings are in BAG
    const delta = 0.0003; // ~30m radius
    const latMin = lat - delta;
    const latMax = lat + delta;
    const lngMin = lng - delta;
    const lngMax = lng + delta;
    const url = `${OGC_BAG_BASE}/collections/pand/items?bbox=${lngMin},${latMin},${lngMax},${latMax}&f=json&limit=20&crs=http://www.opengis.net/def/crs/OGC/1.3/CRS84`;
    console.debug('[PDOK buildings] fetching:', url);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('[PDOK buildings] HTTP error:', response.status, response.statusText);
        throw new Error(`Building API error: ${response.status}`);
      }
      const data = await response.json();
      console.debug('[PDOK buildings] features count:', data.features?.length, data);
      let buildings = (data.features || []).map((f: any) => ({
        id: f.id,
        // getPolygonsFromGeometry returns rings[][][], so [0] = outer ring array [[lng,lat],...]
        polygon: getPolygonsFromGeometry(f.geometry)[0] ?? []
      }));

      // Filter buildings to only keep the ones intersecting or containing the parcel
      if (parcelCoords && parcelCoords[0] && parcelCoords[0].length > 0) {
        const outerRing = parcelCoords[0];
        buildings = buildings.filter((b: any) => {
          if (!b.polygon || b.polygon.length === 0) return false;
          
          const buildingOuterRing: [number, number][] = Array.isArray(b.polygon[0]?.[0])
            ? b.polygon[0]
            : b.polygon;

          if (buildingOuterRing.length === 0) return false;

          // Check 1: Is the centroid of the building inside the parcel?
          let sumLng = 0, sumLat = 0;
          buildingOuterRing.forEach(([bLng, bLat]: [number, number]) => {
            sumLng += bLng;
            sumLat += bLat;
          });
          const avgLng = sumLng / buildingOuterRing.length;
          const avgLat = sumLat / buildingOuterRing.length;
          if (isPointInPolygon(avgLng, avgLat, outerRing)) return true;

          // Check 2: Is the address point inside the building?
          if (isPointInPolygon(lng, lat, buildingOuterRing)) return true;

          return false;
        });
      }

      console.debug('[PDOK buildings] mapped & filtered:', buildings.length, buildings[0]);
      return buildings;
    } catch (e) {
      console.warn('[PDOK buildings] Failed to fetch:', e);
      return [];
    }
  }
};

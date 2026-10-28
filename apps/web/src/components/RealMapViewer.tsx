"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { RouteCandidate, RouteSegment, Coordinate } from "@/lib/api";
import { 
  MapPin, 
  Layers, 
  Navigation, 
  Compass, 
  Locate, 
  Info, 
  ShieldAlert, 
  CheckCircle,
  Eye,
  Maximize2,
  Key,
  ChevronDown,
  Check,
  Globe,
  Sparkles,
  ChevronUp,
  GripVertical,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  RotateCw,
  RefreshCw,
  X,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Volume2,
  VolumeX,
  Target
} from "lucide-react";

interface RealMapViewerProps {
  origin: Coordinate;
  destination: Coordinate;
  waypoints?: { id: string; name: string; coord: Coordinate }[];
  onSetOrigin: (coord: Coordinate) => void;
  onSetDestination: (coord: Coordinate) => void;
  onSetWaypoint?: (coord: Coordinate) => void;
  candidate: RouteCandidate | null;
  alternatives?: RouteCandidate[];
  onSelectCandidate?: (cand: RouteCandidate) => void;
  onSelectSegment?: (segment: RouteSegment) => void;
  selectedSegment?: RouteSegment | null;
  selectionMode: "origin" | "destination" | "waypoint" | "view";
  setSelectionMode: (mode: "origin" | "destination" | "waypoint" | "view") => void;
  onOpenApiKeys?: () => void;
}

interface TileLayerDef {
  name: string;
  category: "google" | "free" | "carto" | "mapbox";
  url: string;
  attribution: string;
  subdomains?: string;
  description: string;
}

export function RealMapViewer({
  origin,
  destination,
  waypoints = [],
  onSetOrigin,
  onSetDestination,
  onSetWaypoint,
  candidate,
  alternatives = [],
  onSelectCandidate,
  onSelectSegment,
  selectedSegment,
  selectionMode,
  setSelectionMode,
  onOpenApiKeys
}: RealMapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const waypointMarkersRef = useRef<any[]>([]);
  const routeLayersRef = useRef<any[]>([]);
  const segmentLayerRef = useRef<any>(null);
  const gpsMarkerRef = useRef<any>(null);

  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [googleKey, setGoogleKey] = useState<string>("");
  // Default to OpenStreetMap Standard: 100% free, real street names & campus buildings
  const [activeLayer, setActiveLayer] = useState<string>("osm");
  const [mapReady, setMapReady] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<RouteSegment | null>(null);
  const [isDockedBarExpanded, setIsDockedBarExpanded] = useState(true);

  // Map Reset & Auto-Healing States (Fixes any tile loading problems)
  const [isResettingMap, setIsResettingMap] = useState(false);
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  const [mapTileFailure, setMapTileFailure] = useState(false);
  const tileErrorCountRef = useRef(0);

  // Draggable Controls State
  const [dockPos, setDockPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingDock, setIsDraggingDock] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  // Google Navigation Mode States
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStepIdx, setNavStepIdx] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [currentGpsCoord, setCurrentGpsCoord] = useState<Coordinate | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync Mapbox & Google Keys from localStorage and custom events
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("safepath_mapbox_token") || "";
    const gKey = localStorage.getItem("safepath_google_key") || "";
    setMapboxToken(token);
    setGoogleKey(gKey);

    const handleKeyUpdate = (e: any) => {
      const newToken = e.detail?.mapboxToken !== undefined 
        ? e.detail.mapboxToken 
        : (localStorage.getItem("safepath_mapbox_token") || "");
      const newGKey = e.detail?.googleKey !== undefined 
        ? e.detail.googleKey 
        : (localStorage.getItem("safepath_google_key") || "");
      
      setMapboxToken(newToken);
      setGoogleKey(newGKey);

      if (newGKey && !gKey) {
        setActiveLayer("google_hybrid");
      } else if (newToken && !token) {
        setActiveLayer("mapbox_sat");
      }
    };

    window.addEventListener("safepath:apikeys_updated", handleKeyUpdate);
    return () => window.removeEventListener("safepath:apikeys_updated", handleKeyUpdate);
  }, []);

  // Draggable Control Dock Handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!dockRef.current || !mapContainerRef.current) return;
    const dockRect = dockRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      offsetX: clientX - dockRect.left,
      offsetY: clientY - dockRect.top,
    };
    setIsDraggingDock(true);
  };

  useEffect(() => {
    if (!isDraggingDock) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!mapContainerRef.current || !dockRef.current) return;
      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const dockRect = dockRef.current.getBoundingClientRect();

      let newX = e.clientX - containerRect.left - dragOffsetRef.current.offsetX;
      let newY = e.clientY - containerRect.top - dragOffsetRef.current.offsetY;

      // Clamp within map bounds
      newX = Math.max(8, Math.min(containerRect.width - dockRect.width - 8, newX));
      newY = Math.max(8, Math.min(containerRect.height - dockRect.height - 8, newY));

      setDockPos({ x: Math.round(newX), y: Math.round(newY) });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!mapContainerRef.current || !dockRef.current || !e.touches[0]) return;
      const touch = e.touches[0];
      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const dockRect = dockRef.current.getBoundingClientRect();

      let newX = touch.clientX - containerRect.left - dragOffsetRef.current.offsetX;
      let newY = touch.clientY - containerRect.top - dragOffsetRef.current.offsetY;

      newX = Math.max(8, Math.min(containerRect.width - dockRect.width - 8, newX));
      newY = Math.max(8, Math.min(containerRect.height - dockRect.height - 8, newY));

      setDockPos({ x: Math.round(newX), y: Math.round(newY) });
    };

    const handleMouseUp = () => {
      setIsDraggingDock(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDraggingDock]);

  // Close theme menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Comprehensive, clean layer configurations (watermark-free default options)
  const currentTileLayers: Record<string, TileLayerDef> = {
    // 1. OpenStreetMap Standard (100% Free, Reliable, Global Street Map)
    osm: {
      name: "OpenStreetMap Standard",
      category: "free",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: "abc",
      description: "Official global street map (100% Free, Maximum Reliability)"
    },

    // 2. Esri World Street Map (Detailed vector-like streets with landmarks)
    esri_streets: {
      name: "Esri Street Map",
      category: "free",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; Esri, HERE, Garmin, USGS',
      subdomains: "",
      description: "Clean vector-like street map (100% Free, High Reliability)"
    },

    // 3. OSM Humanitarian (High-contrast pedestrian navigation style)
    osm_hot: {
      name: "OSM Humanitarian",
      category: "free",
      url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      attribution: '&copy; OpenStreetMap contributors & Humanitarian Team',
      subdomains: "abc",
      description: "High-contrast pedestrian navigation style"
    },

    // 4. Esri Satellite HD (True color high-res aerial imagery)
    satellite: {
      name: "Esri Satellite HD",
      category: "free",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      subdomains: "",
      description: "High-resolution satellite imagery (100% Free)"
    },

    // 5. Google Satellite (Hybrid with roads - confirmed working)
    google_hybrid: {
      name: "Google Satellite (Hybrid)",
      category: "google",
      url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      subdomains: "0123",
      attribution: '&copy; Google Maps Platform',
      description: "Google Satellite imagery with labeled roads"
    },

    // 6. CartoDB Voyager
    voyager: {
      name: "Carto Voyager",
      category: "carto",
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      description: "Carto urban basemap"
    },

    // 7. CartoDB Positron: Minimalist clean light map (great for highlighting routes)
    positron: {
      name: "Carto Positron (Light)",
      category: "carto",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      description: "Clean minimalist light map (Best for highlighting routes)"
    },

    // 8. Carto Dark Matter (High contrast dark mode)
    dark: {
      name: "Carto Dark Matter",
      category: "carto",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: "abcd",
      description: "Carto high-contrast dark theme"
    },

    // Legacy fallback alias for google_streets (points to OSM)
    google_streets: {
      name: "OpenStreetMap Standard",
      category: "free",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: "abc",
      description: "Official global street map (100% Free)"
    },

    // 9. Mapbox HD (If token provided)
    ...(mapboxToken ? {
      mapbox_sat: {
        name: "Mapbox Sat HD",
        category: "mapbox" as const,
        url: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
        attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
        description: "Mapbox high-res satellite streets"
      },
      mapbox_streets: {
        name: "Mapbox Streets",
        category: "mapbox" as const,
        url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
        attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
        description: "Custom styled Mapbox vector streets"
      }
    } : {})
  };

  // Full Map View Reload and Tile Cache Reset (Guarantees map recovery anytime)
  const handleReloadAndResetMap = useCallback(() => {
    if (typeof window === "undefined") return;
    setIsResettingMap(true);
    setMapNotice("Reloading and restoring map view...");

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) {
        setIsResettingMap(false);
        return;
      }

      // If tiles failed, fall back to OSM Standard
      let layerKey = activeLayer;
      if (mapTileFailure) {
        layerKey = "osm";
        setActiveLayer("osm");
        setMapTileFailure(false);
      }

      const cfg = currentTileLayers[layerKey] || currentTileLayers.osm;

      // Clean old tile layer
      if (tileLayerRef.current) {
        try {
          map.removeLayer(tileLayerRef.current);
        } catch (e) {}
      }

      // Re-create tile layer freshly
      const newLayer = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains || "abc",
        maxZoom: 20,
      }).addTo(map);

      tileErrorCountRef.current = 0;
      newLayer.on("tileerror", () => {
        tileErrorCountRef.current++;
        if (tileErrorCountRef.current >= 3) {
          setMapTileFailure(true);
        }
      });
      newLayer.on("tileload", () => {
        tileErrorCountRef.current = 0;
        setMapTileFailure(false);
      });

      newLayer.bringToBack();
      tileLayerRef.current = newLayer;

      // Multi-phase layout sizing invalidations
      try {
        if (map && (map as any)._container) map.invalidateSize(false);
      } catch (e) {}
      setTimeout(() => {
        try {
          if (map && (map as any)._container) map.invalidateSize(false);
        } catch (e) {}
      }, 150);

      // Center view or fit route
      if (candidate?.segments && candidate.segments.length > 0) {
        const coords: [number, number][] = [];
        candidate.segments.forEach((seg) => {
          if (seg.coords) seg.coords.forEach((c) => coords.push([c.lat, c.lon]));
        });
        if (coords.length > 1) {
          map.fitBounds(L.latLngBounds(coords), { padding: [40, 60], maxZoom: 18 });
        }
      } else if (origin?.lat && origin?.lon) {
        map.setView([origin.lat, origin.lon], 16);
      }

      setTimeout(() => {
        setIsResettingMap(false);
        setMapNotice("✓ Map restored & visible");
        setTimeout(() => setMapNotice(null), 2500);
      }, 500);
    });
  }, [activeLayer, mapTileFailure, candidate, origin, destination, currentTileLayers]);

  // Listen for global reset event from top banner
  useEffect(() => {
    const handleGlobalReload = () => handleReloadAndResetMap();
    window.addEventListener("safepath:reload_map", handleGlobalReload);
    return () => window.removeEventListener("safepath:reload_map", handleGlobalReload);
  }, [handleReloadAndResetMap]);

  // Initialize Leaflet Map with robust invalidateSize calls to guarantee tile loading
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;
    let handleResize: (() => void) | null = null;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      // Default center: KITS Warangal Entrance (18.0542, 79.5357)
      const initialLat = origin?.lat || 18.0542;
      const initialLon = origin?.lon || 79.5357;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 16,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Set Tile Layer
      const cfg = currentTileLayers[activeLayer] || currentTileLayers.voyager || currentTileLayers.osm;
      const tileLayer = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains || "abc",
        maxZoom: 20,
      }).addTo(map);

      tileLayer.on("tileerror", () => {
        tileErrorCountRef.current++;
        if (tileErrorCountRef.current >= 3) {
          setMapTileFailure(true);
        }
      });
      tileLayer.on("tileload", () => {
        tileErrorCountRef.current = 0;
        setMapTileFailure(false);
      });

      tileLayer.bringToBack();

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
      setMapReady(true);

      // Safe invalidateSize helper that never throws if container is unmounted or detached
      const safeInvalidate = (options: any = false) => {
        try {
          if (isMounted && map && (map as any)._container && mapInstanceRef.current) {
            map.invalidateSize(options);
          }
        } catch (e) {
          // ignore when map is unmounting/unloaded
        }
      };

      timeouts.push(setTimeout(() => safeInvalidate(false), 100));
      timeouts.push(setTimeout(() => safeInvalidate(false), 350));
      timeouts.push(setTimeout(() => safeInvalidate(false), 800));

      // Ensure tile availability after movement
      const handleMovement = () => {
        safeInvalidate({ debounceMoveend: true });
      };

      map.on("moveend", handleMovement);
      map.on("zoomend", handleMovement);
      map.on("dragend", handleMovement);

      handleResize = () => safeInvalidate(false);
      window.addEventListener("resize", handleResize);

      // ResizeObserver to detect layout / sidebar transitions and maintain crystal clear visibility
      if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          safeInvalidate(false);
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      // Click to place Origin, Waypoint, or Destination
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        const currentMode = (mapContainerRef.current as any)?._selectionMode || "origin";
        if (currentMode === "origin") {
          onSetOrigin({ lat: +lat.toFixed(6), lon: +lng.toFixed(6) });
        } else if (currentMode === "destination") {
          onSetDestination({ lat: +lat.toFixed(6), lon: +lng.toFixed(6) });
        } else if (currentMode === "waypoint" && onSetWaypoint) {
          onSetWaypoint({ lat: +lat.toFixed(6), lon: +lng.toFixed(6) });
        }
      });
    });

    return () => {
      isMounted = false;
      setMapReady(false);
      timeouts.forEach(clearTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (handleResize) {
        window.removeEventListener("resize", handleResize);
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update selectionMode ref on container so map click handler has current state
  useEffect(() => {
    if (mapContainerRef.current) {
      (mapContainerRef.current as any)._selectionMode = selectionMode;
    }
  }, [selectionMode]);

  // Update Tile Layer when user toggles theme or updates API keys
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || typeof window === "undefined") return;
    import("leaflet").then((L) => {
      const cfg = currentTileLayers[activeLayer] || currentTileLayers.voyager || currentTileLayers.osm;
      if (tileLayerRef.current) {
        try {
          mapInstanceRef.current.removeLayer(tileLayerRef.current);
        } catch (e) {}
      }
      const newLayer = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains || "abc",
        maxZoom: 20,
      }).addTo(mapInstanceRef.current);

      tileErrorCountRef.current = 0;
      newLayer.on("tileerror", () => {
        tileErrorCountRef.current++;
        if (tileErrorCountRef.current >= 3) {
          setMapTileFailure(true);
        }
      });
      newLayer.on("tileload", () => {
        tileErrorCountRef.current = 0;
        setMapTileFailure(false);
      });
      
      newLayer.bringToBack();
      try {
        if (mapInstanceRef.current && (mapInstanceRef.current as any)._container) {
          mapInstanceRef.current.invalidateSize(false);
        }
      } catch (e) {}
      setTimeout(() => {
        try {
          if (mapInstanceRef.current && (mapInstanceRef.current as any)._container) {
            mapInstanceRef.current.invalidateSize(false);
          }
        } catch (e) {}
      }, 150);
    });
  }, [mapReady, activeLayer, mapboxToken, googleKey]);

  // Update Origin, Destination, and Intermediate Waypoint Markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // 1. Origin Pin (Green 'A')
      if (origin?.lat && origin?.lon) {
        const originHtml = `
          <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
            <div style="background-color:#16a34a;color:white;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(22,163,74,0.45);border:2.5px solid #ffffff;">
              <span style="transform:rotate(45deg);font-weight:900;font-size:13px;letter-spacing:-0.5px;">A</span>
            </div>
          </div>
        `;
        const originIcon = L.divIcon({
          html: originHtml,
          className: "custom-map-pin",
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -34],
        });

        if (originMarkerRef.current) {
          originMarkerRef.current.setLatLng([origin.lat, origin.lon]);
        } else {
          const marker = L.marker([origin.lat, origin.lon], {
            icon: originIcon,
            draggable: true,
            zIndexOffset: 1000,
          }).addTo(map);

          marker.bindPopup("<b>Source / Origin (A)</b><br>Drag or click map to move");
          marker.on("dragend", (e: any) => {
            const pos = e.target.getLatLng();
            onSetOrigin({ lat: +pos.lat.toFixed(6), lon: +pos.lng.toFixed(6) });
          });
          originMarkerRef.current = marker;
        }
      }

      // 2. Destination Pin (Red 'B')
      if (destination?.lat && destination?.lon) {
        const destHtml = `
          <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
            <div style="background-color:#dc2626;color:white;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(220,38,38,0.45);border:2.5px solid #ffffff;">
              <span style="transform:rotate(45deg);font-weight:900;font-size:13px;letter-spacing:-0.5px;">B</span>
            </div>
          </div>
        `;
        const destIcon = L.divIcon({
          html: destHtml,
          className: "custom-map-pin",
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -34],
        });

        if (destMarkerRef.current) {
          destMarkerRef.current.setLatLng([destination.lat, destination.lon]);
        } else {
          const marker = L.marker([destination.lat, destination.lon], {
            icon: destIcon,
            draggable: true,
            zIndexOffset: 1000,
          }).addTo(map);

          marker.bindPopup("<b>Destination (B)</b><br>Drag or click map to move");
          marker.on("dragend", (e: any) => {
            const pos = e.target.getLatLng();
            onSetDestination({ lat: +pos.lat.toFixed(6), lon: +pos.lng.toFixed(6) });
          });
          destMarkerRef.current = marker;
        }
      }

      // 3. Intermediate Waypoint Pins (Blue '1', '2', ...)
      waypointMarkersRef.current.forEach((m) => map.removeLayer(m));
      waypointMarkersRef.current = [];

      waypoints.forEach((wp, wIdx) => {
        const wpHtml = `
          <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
            <div style="background-color:#2563eb;color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,0.45);border:2px solid #ffffff;font-weight:bold;font-size:12px;">
              ${wIdx + 1}
            </div>
          </div>
        `;
        const wpIcon = L.divIcon({
          html: wpHtml,
          className: "custom-wp-pin",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const wpMarker = L.marker([wp.coord.lat, wp.coord.lon], {
          icon: wpIcon,
          draggable: true,
          zIndexOffset: 900,
        }).addTo(map);

        wpMarker.bindPopup(`<b>Stop #${wIdx + 1}</b><br>${wp.name}`);
        waypointMarkersRef.current.push(wpMarker);
      });
    });
  }, [mapReady, origin, destination, waypoints]);

  // Render Routes (Road-Following Curves & Street Paths)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Clean old route layers
      routeLayersRef.current.forEach((layer) => map.removeLayer(layer));
      routeLayersRef.current = [];

      if (!candidate || !candidate.segments || candidate.segments.length === 0) return;

      const allBoundsCoords: [number, number][] = [];

      // Render Alternative Candidates (subtle dashed lines)
      alternatives.forEach((alt) => {
        if (alt.id === candidate.id) return;
        const altCoords: [number, number][] = [];
        alt.segments.forEach((seg) => {
          if (seg.coords) {
            seg.coords.forEach((c) => altCoords.push([c.lat, c.lon]));
          }
        });

        if (altCoords.length > 1) {
          const altPoly = L.polyline(altCoords, {
            color: "#94a3b8",
            weight: 4,
            dashArray: "6 6",
            opacity: 0.6,
          }).addTo(map);

          altPoly.bindTooltip(`Alternative: ${alt.name}`, { sticky: true });
          altPoly.on("click", () => {
            if (onSelectCandidate) onSelectCandidate(alt);
          });
          routeLayersRef.current.push(altPoly);
        }
      });

      // Render Primary Candidate Segments (Road-Aligned)
      candidate.segments.forEach((seg, idx) => {
        if (!seg.coords || seg.coords.length < 2) return;
        const segPoints: [number, number][] = seg.coords.map((c) => [c.lat, c.lon]);
        allBoundsCoords.push(...segPoints);

        // Segment color based on accessibility & risk
        let segColor = "#2563eb"; // Safe Blue
        if (seg.accessibility_prob < 0.6 || seg.robust_risk > 0.45) {
          segColor = "#ea580c"; // Orange warning
        }
        if (!seg.is_lit) {
          segColor = "#7c3aed"; // Purple unlit
        }

        // Glow shadow layer for real-time visibility
        const shadow = L.polyline(segPoints, {
          color: segColor,
          weight: 9,
          opacity: 0.22,
          lineCap: "round",
          lineJoin: "round"
        }).addTo(map);
        routeLayersRef.current.push(shadow);

        // Main road-following route line
        const line = L.polyline(segPoints, {
          color: segColor,
          weight: 5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        const stepProv = seg.provenance?.find(p => p.attribute_name === "maneuver");
        const maneuverDesc = stepProv ? stepProv.source : `Segment #${idx + 1}`;

        line.bindTooltip(
          `<div style="font-size:11px;font-family:sans-serif;padding:3px;">
            <b>${maneuverDesc}</b><br/>
            Distance: <b>${seg.distance_m}m</b> • Arrival: <b>${new Date(seg.expected_arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b><br/>
            Slope: <b>${seg.slope_pct}%</b> • Access: <b>${Math.round(seg.accessibility_prob * 100)}%</b><br/>
            Risk: <b>${seg.robust_risk}</b> • Lighting: <b>${seg.is_lit ? "☀️ Lit" : "🌙 Unlit"}</b>
          </div>`,
          { sticky: true }
        );

        line.on("mouseover", () => setHoveredSegment(seg));
        line.on("mouseout", () => setHoveredSegment(null));
        line.on("click", () => {
          if (onSelectSegment) onSelectSegment(seg);
        });

        routeLayersRef.current.push(line);
      });

      // Fit bounds to show entire route with comfortable padding
      if (allBoundsCoords.length > 0 && !isNavigating) {
        const bounds = L.latLngBounds(allBoundsCoords);
        map.fitBounds(bounds, { padding: [40, 60], maxZoom: 18 });
      }
    });
  }, [mapReady, candidate, alternatives, isNavigating]);

  // Turn-by-Turn Real-Time Google Navigation Simulator
  useEffect(() => {
    if (!isNavigating || !isSimulating || !candidate || !candidate.segments || candidate.segments.length === 0) {
      return;
    }

    const allRoutePoints: Coordinate[] = [];
    candidate.segments.forEach(seg => {
      if (seg.coords) allRoutePoints.push(...seg.coords);
    });

    if (allRoutePoints.length === 0) return;

    let ptIdx = 0;
    setCurrentGpsCoord(allRoutePoints[0]);

    const interval = setInterval(() => {
      ptIdx += 1;
      if (ptIdx >= allRoutePoints.length) {
        setIsSimulating(false);
        return;
      }

      const currentPt = allRoutePoints[ptIdx];
      setCurrentGpsCoord(currentPt);

      // Identify which segment index we are currently on
      let accum = 0;
      for (let s = 0; s < candidate.segments.length; s++) {
        const segLen = candidate.segments[s].coords?.length || 0;
        accum += segLen;
        if (ptIdx < accum) {
          setNavStepIdx(s);
          break;
        }
      }

      // Smoothly pan map to follow GPS marker
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([currentPt.lat, currentPt.lon], { animate: true, duration: 0.6 });
      }
    }, 1200 / simSpeed);

    return () => clearInterval(interval);
  }, [isNavigating, isSimulating, simSpeed, candidate]);

  // GPS Marker Layer
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (!isNavigating || !currentGpsCoord) {
        if (gpsMarkerRef.current) {
          map.removeLayer(gpsMarkerRef.current);
          gpsMarkerRef.current = null;
        }
        return;
      }

      const gpsHtml = `
        <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:#38bdf8;opacity:0.6;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:18px;height:18px;border-radius:50%;background:#0284c7;border:3px solid #ffffff;box-shadow:0 3px 12px rgba(2,132,199,0.6);display:flex;align-items:center;justify-content:center;color:white;">
            <div style="width:4px;height:4px;border-radius:50%;background:#ffffff;"></div>
          </div>
        </div>
      `;

      const gpsIcon = L.divIcon({
        html: gpsHtml,
        className: "custom-gps-beacon",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (gpsMarkerRef.current) {
        gpsMarkerRef.current.setLatLng([currentGpsCoord.lat, currentGpsCoord.lon]);
      } else {
        const marker = L.marker([currentGpsCoord.lat, currentGpsCoord.lon], {
          icon: gpsIcon,
          zIndexOffset: 2000,
        }).addTo(map);
        gpsMarkerRef.current = marker;
      }
    });
  }, [isNavigating, currentGpsCoord]);

  // Highlight selected segment
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (segmentLayerRef.current) {
        map.removeLayer(segmentLayerRef.current);
        segmentLayerRef.current = null;
      }

      if (selectedSegment && selectedSegment.coords && selectedSegment.coords.length >= 2) {
        const pts: [number, number][] = selectedSegment.coords.map((c) => [c.lat, c.lon]);
        const highlight = L.polyline(pts, {
          color: "#e11d48",
          weight: 8,
          opacity: 0.95,
          lineCap: "round",
        }).addTo(map);
        segmentLayerRef.current = highlight;
      }
    });
  }, [selectedSegment]);

  // Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = +pos.coords.latitude.toFixed(6);
        const lon = +pos.coords.longitude.toFixed(6);
        onSetOrigin({ lat, lon });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], 17);
        }
      },
      () => setIsLocating(false),
      { timeout: 8000 }
    );
  };

  // Zoom to Fit Route
  const handleFitRoute = () => {
    if (!mapInstanceRef.current || !candidate?.segments) return;
    import("leaflet").then((L) => {
      const coords: [number, number][] = [];
      candidate.segments.forEach((seg) => {
        if (seg.coords) seg.coords.forEach((c) => coords.push([c.lat, c.lon]));
      });
      if (coords.length > 0) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(coords), { padding: [40, 60] });
      }
    });
  };

  const activeNavSegment = candidate?.segments?.[navStepIdx];
  const activeManeuver = activeNavSegment?.provenance?.find(p => p.attribute_name === "maneuver")?.source || "Follow campus street pathway";

  return (
    <div className="relative isolate z-0 w-full h-[600px] lg:h-[640px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      {/* Dynamic Leaflet control clearance & guaranteed crisp tile visibility */}
      <style jsx global>{`
        .leaflet-bottom.leaflet-right {
          bottom: ${isDockedBarExpanded && candidate && !isNavigating ? "58px" : "14px"} !important;
          transition: bottom 0.2s ease-in-out;
        }
        .leaflet-bottom.leaflet-left {
          bottom: ${isDockedBarExpanded && candidate && !isNavigating ? "58px" : "14px"} !important;
        }
        .leaflet-container {
          background-color: #f8fafc !important;
          font-family: inherit;
          width: 100% !important;
          height: 100% !important;
        }
        .leaflet-container img,
        .leaflet-tile,
        .leaflet-tile-container img {
          max-width: none !important;
          max-height: none !important;
        }
        .leaflet-tile {
          visibility: inherit !important;
          filter: brightness(1) contrast(1.02);
        }
        .leaflet-tile-loaded {
          opacity: 1 !important;
        }
      `}</style>

      {/* Tile Loading Warning Banner with 1-Click Fix */}
      {mapTileFailure && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1250] max-w-lg w-[90%] bg-amber-600/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-xl flex items-center justify-between text-xs font-medium animate-in fade-in slide-in-from-top-2 border border-amber-400">
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-200" />
            <span className="truncate">Tiles slow or blocked on current provider</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveLayer("osm");
              setTimeout(() => handleReloadAndResetMap(), 50);
            }}
            className="px-3 py-1 rounded-lg bg-white text-amber-900 font-bold text-[11px] hover:bg-amber-100 transition-colors shrink-0 shadow-sm flex items-center gap-1"
          >
            <RotateCw className="w-3 h-3 text-amber-800" />
            <span>Switch to Free OSM</span>
          </button>
        </div>
      )}

      {/* Reassurance Notice Toast */}
      {mapNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1250] bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{mapNotice}</span>
        </div>
      )}

      {/* Real-Time Google Navigation Top Turn-by-Turn Card HUD */}
      {isNavigating && activeNavSegment && (
        <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-[1200] bg-emerald-950/95 backdrop-blur-xl border border-emerald-700/60 rounded-2xl p-3.5 shadow-2xl text-white flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              {activeManeuver.includes("right") ? (
                <CornerUpRight className="w-6 h-6 stroke-[2.5]" />
              ) : activeManeuver.includes("left") ? (
                <CornerUpLeft className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <ArrowUp className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-black font-mono tracking-tight text-white">
                  {activeNavSegment.distance_m} m
                </span>
                <span className="text-xs text-emerald-300 font-medium truncate">
                  {activeManeuver}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 font-mono truncate mt-0.5">
                Speed: 1.2 m/s • Step #{navStepIdx + 1} of {candidate?.segments?.length || 1} • {activeNavSegment.is_lit ? "☀️ Lit Walkway" : "🌙 Unlit Corridor"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 transition-colors"
              title={soundEnabled ? "Mute Voice Guidance" : "Enable Voice Guidance"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-emerald-500" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsNavigating(false);
                setIsSimulating(false);
                handleFitRoute();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      )}

      {/* Map Header Overlay: Mode Selector & Live Hint */}
      {!isNavigating && (
        <div className="absolute top-3 left-3 z-[1050] flex flex-wrap items-center gap-2">
          {/* Selection Mode Control */}
          <div className="flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectionMode("origin")}
              className={`px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                selectionMode === "origin"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
              <span>Origin (A)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode("destination")}
              className={`px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                selectionMode === "destination"
                  ? "bg-rose-600 text-white shadow-xs font-bold"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
              <span>Dest (B)</span>
            </button>
            {waypoints.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectionMode("waypoint")}
                className={`px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                  selectionMode === "waypoint"
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-300" />
                <span>Stop ({waypoints.length})</span>
              </button>
            )}
          </div>

          {/* Live Help Hint */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-[11px] text-slate-600 font-medium">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {selectionMode === "origin"
                ? "Click map to set Origin (A)"
                : selectionMode === "destination"
                ? "Click map to set Destination (B)"
                : "Click map to position Stop"}
            </span>
          </div>
        </div>
      )}

      {/* Draggable & Movable Controls Bar (Free positioning anywhere on screen) */}
      {!isNavigating && (
        <div
          ref={dockRef}
          style={
            dockPos
              ? { left: `${dockPos.x}px`, top: `${dockPos.y}px`, right: "auto", position: "absolute" }
              : { top: "16px", right: "16px", position: "absolute" }
          }
          className={`absolute top-4 right-4 z-20 flex items-center space-x-2 select-none transition-shadow ${
            isDraggingDock ? "opacity-95 scale-[1.02] shadow-xl ring-2 ring-blue-500/50" : ""
          }`}
        >
          {/* Grip Drag Handle */}
          <div
            onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
            className="p-1.5 px-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-slate-500 hover:text-slate-900 cursor-grab active:cursor-grabbing flex items-center gap-1 text-[11px] font-semibold"
            title="Click and drag to move this control bar anywhere on screen"
          >
            <GripVertical className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wider text-slate-400">Drag</span>
          </div>

          {/* Start Real-Time Navigation Button */}
          {candidate && (
            <button
              type="button"
              onClick={() => {
                setIsNavigating(true);
                setIsSimulating(true);
                setNavStepIdx(0);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center space-x-1.5 text-xs font-bold"
              title="Start Real-Time Google Turn-by-Turn Navigation"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate</span>
            </button>
          )}

          {/* Compact Map Theme Dropdown Menu */}
          <div className="relative" ref={themeMenuRef}>
            <button
              type="button"
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-all flex items-center space-x-1.5 text-xs font-semibold"
              title="Switch Map Theme & Layers"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-bold text-slate-900 truncate max-w-[110px]">
                {currentTileLayers[activeLayer]?.name || "OpenStreetMap"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${themeMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white/98 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl z-[1200] py-2 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 max-h-96 overflow-y-auto">
                {/* Category: Recommended Urban Basemaps */}
                <div className="py-1">
                  <div className="px-3 py-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Standard Basemaps
                    </span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                      100% FREE
                    </span>
                  </div>
                  {["osm", "esri_streets", "osm_hot", "positron"].map((k) => {
                    const item = currentTileLayers[k];
                    if (!item) return null;
                    const isSelected = activeLayer === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setActiveLayer(k);
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between text-xs transition-colors ${
                          isSelected ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal truncate">{item.description}</p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Category: Satellite & Specialized */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Satellite & Dark Modes
                  </div>
                  {["satellite", "google_hybrid", "dark", "voyager"].map((k) => {
                    const item = currentTileLayers[k];
                    if (!item) return null;
                    const isSelected = activeLayer === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setActiveLayer(k);
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between text-xs transition-colors ${
                          isSelected ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal truncate">{item.description}</p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Category: Mapbox (if configured) */}
                {mapboxToken && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Mapbox HD (Token Active)
                    </div>
                    {["mapbox_sat", "mapbox_streets"].map((k) => {
                      const item = currentTileLayers[k];
                      if (!item) return null;
                      const isSelected = activeLayer === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setActiveLayer(k);
                            setThemeMenuOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left flex items-center justify-between text-xs transition-colors ${
                            isSelected ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal truncate">{item.description}</p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* API Keys Configuration Button */}
          <button
            type="button"
            onClick={() => {
              if (typeof onOpenApiKeys === "function") {
                onOpenApiKeys();
              } else if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("safepath:open_apikeys"));
              }
            }}
            title="Configure Mapbox / Google / ORS API Keys"
            className="px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors flex items-center space-x-1.5 text-xs font-semibold"
          >
            <Key className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Keys</span>
            {(mapboxToken || googleKey) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Custom API Key Active" />
            )}
          </button>

          {/* Fit Route Button */}
          {candidate && (
            <button
              type="button"
              onClick={handleFitRoute}
              title="Fit map to full route"
              className="p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Reload / Reset Map Button (Solves map loading problem) */}
          <button
            type="button"
            onClick={handleReloadAndResetMap}
            title="Reload & Reset Map view (solves any blank tiles or sizing issues)"
            disabled={isResettingMap}
            className="px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors flex items-center space-x-1.5 text-xs font-semibold"
          >
            <RotateCw className={`w-3.5 h-3.5 text-blue-600 ${isResettingMap ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Reload Map</span>
          </button>

          {/* Locate Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            title="Use my current GPS location"
            disabled={isLocating}
            className="p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            <Locate className={`w-4 h-4 ${isLocating ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      )}

      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full min-h-[500px] z-0 cursor-crosshair bg-slate-100" />

      {/* Floating Quick Map Reload & Fix Pill (Always available anytime) */}
      {!isNavigating && (
        <div className="absolute bottom-3.5 right-14 z-20">
          <button
            type="button"
            onClick={handleReloadAndResetMap}
            disabled={isResettingMap}
            className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-300 shadow-md text-slate-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all text-xs font-semibold flex items-center space-x-1.5"
            title="Click to reload map and fix any blank tiles or sizing lag"
          >
            <RotateCw className={`w-3.5 h-3.5 text-blue-600 ${isResettingMap ? "animate-spin" : ""}`} />
            <span>Fix / Reload Map</span>
          </button>
        </div>
      )}

      {/* Real-Time Google Navigation Bottom Tray HUD */}
      {isNavigating && candidate && (
        <div className="absolute bottom-0 inset-x-0 z-30 bg-white/98 backdrop-blur-xl border-t border-slate-200 px-4 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* ETA & Distance Info */}
            <div className="flex items-center space-x-3">
              <div className="text-left">
                <span className="text-2xl font-black text-emerald-600 leading-none">
                  {candidate.metrics.total_travel_time_min} min
                </span>
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mt-0.5">
                  <span>{candidate.metrics.total_distance_m} m remaining</span>
                  <span>•</span>
                  <span>Arrival {new Date(Date.now() + candidate.metrics.total_travel_time_min * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* Simulation Speed & Controls */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsSimulating(!isSimulating)}
                className={`p-2 rounded-xl text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors ${
                  isSimulating ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulating ? "Pause" : "Resume"}</span>
              </button>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                {[1, 2, 4].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSimSpeed(spd)}
                    className={`px-2 py-1 rounded-lg transition-colors ${
                      simSpeed === spd ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (currentGpsCoord && mapInstanceRef.current) {
                    mapInstanceRef.current.setView([currentGpsCoord.lat, currentGpsCoord.lon], 18, { animate: true });
                  }
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Re-center on GPS Beacon"
              >
                <Target className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Docked Bottom Route Control Bar - Aligned flush with container */}
      {!isNavigating && candidate && (
        <div className="absolute bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-md transition-all">
          <div className="px-3.5 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            {/* Route Identification & Active Telemetry */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setIsDockedBarExpanded(!isDockedBarExpanded)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                title={isDockedBarExpanded ? "Collapse route bar" : "Expand route bar"}
              >
                {isDockedBarExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {candidate.name}
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold shrink-0">
                    {candidate.algorithm_tag}
                  </span>
                </div>
                {isDockedBarExpanded && (
                  hoveredSegment ? (
                    <p className="text-[10px] text-slate-600 font-mono truncate">
                      {hoveredSegment.turn_instruction || hoveredSegment.provenance?.find(p => p.attribute_name === "maneuver")?.source || `Segment #${hoveredSegment.segment_index + 1}`} ({hoveredSegment.distance_m}m)
                      {hoveredSegment.vehicle_speed_kmh ? ` • 🚗 ${hoveredSegment.vehicle_speed_kmh} km/h` : ` • Slope: ${hoveredSegment.slope_pct}%`}
                      {hoveredSegment.surface_defect_tags && hoveredSegment.surface_defect_tags.length > 0 && !hoveredSegment.surface_defect_tags.includes("NULL") ? ` • ⚠️ Sidewalk AI: ${hoveredSegment.surface_defect_tags.join(", ")}` : " • ✨ Smooth Road"}
                      • {hoveredSegment.is_lit ? "☀️ Lit" : "🌙 Unlit"} • Risk: {hoveredSegment.robust_risk}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 truncate">
                      Road-following Pareto path with real-time road safety &amp; defect analysis • Click Navigate for live HUD
                    </p>
                  )
                )}
              </div>
            </div>

            {/* Metrics Pills & Integrated Legend */}
            {isDockedBarExpanded && (
              <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1 justify-between md:justify-end">
                <div className="flex items-center bg-slate-50 rounded-xl p-0.5 border border-slate-200 text-center font-mono text-xs">
                  <div className="px-2 py-0.5 border-r border-slate-200">
                    <span className="text-[8px] text-slate-400 font-sans font-bold uppercase block leading-tight">Time</span>
                    <span className="font-bold text-slate-900">{candidate.metrics.total_travel_time_min}m</span>
                  </div>
                  <div className="px-2 py-0.5 border-r border-slate-200">
                    <span className="text-[8px] text-slate-400 font-sans font-bold uppercase block leading-tight">Dist</span>
                    <span className="font-bold text-slate-900">{candidate.metrics.total_distance_m}m</span>
                  </div>
                  {candidate.metrics.vehicle_safety_score !== undefined && (
                    <div className="px-2 py-0.5 border-r border-slate-200">
                      <span className="text-[8px] text-emerald-600 font-sans font-bold uppercase block leading-tight">Road Safety</span>
                      <span className="font-bold text-emerald-600">{candidate.metrics.vehicle_safety_score}/100</span>
                    </div>
                  )}
                  <div className="px-2 py-0.5 border-r border-slate-200">
                    <span className="text-[8px] text-slate-400 font-sans font-bold uppercase block leading-tight">Risk</span>
                    <span className="font-bold text-blue-600">{candidate.metrics.robust_safety_risk}</span>
                  </div>
                  <div className="px-2 py-0.5">
                    <span className="text-[8px] text-slate-400 font-sans font-bold uppercase block leading-tight">Access</span>
                    <span className="font-bold text-emerald-600">{candidate.metrics.accessible_segments_pct}%</span>
                  </div>
                </div>

                {/* Integrated Legend */}
                <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-200 text-[10px] font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Origin (A)</span>
                  </span>
                  {waypoints.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Stops ({waypoints.length})</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Dest (B)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-1 bg-blue-600 rounded" />
                    <span>Road Path</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

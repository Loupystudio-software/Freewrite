import React, { useRef, useState } from "react";
import {
  MousePointer,
  Square,
  Circle,
  Hexagon,
  Spline,
  MapPin,
  Link2,
  ImagePlus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Layers,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import type {
  Location,
  LocationElement,
  LocationPoint,
  Project,
} from "@freewrite/core";
import { useLocationStore, type LocationTool } from "../../stores/locationStore";
import { useConversationStore } from "../../stores/conversationStore";
import { useDocumentStore } from "../../stores/documentStore";

interface LocationEditorProps {
  location: Location;
  project: Project;
}

const GRID_SIZE = 20;

export function LocationEditor({ location, project }: LocationEditorProps) {
  const {
    selectedElementId,
    activeTool,
    setActiveTool,
    setSelectedElementId,
    openLocation,
    updateLocation,
    addElement,
    updateElement,
    removeElement,
    reorderElement,
    toggleElementVisibility,
    toggleElementLock,
  } = useLocationStore();

  const { openConversation } = useConversationStore();
  const { openDocument, setViewMode } = useDocumentStore();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showLayers, setShowLayers] = useState(true);

  // Drawing & dragging state
  const [drawingPoints, setDrawingPoints] = useState<LocationPoint[]>([]);
  const [hoverPoint, setHoverPoint] = useState<LocationPoint | null>(null);
  const [dragBox, setDragBox] = useState<{
    start: LocationPoint;
    current: LocationPoint;
  } | null>(null);

  const dragStateRef = useRef<{
    mode: "pan" | "move" | "resize";
    elementId?: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origPoints?: LocationPoint[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const snap = (val: number) =>
    snapToGrid ? Math.round(val / GRID_SIZE) * GRID_SIZE : Math.round(val);

  const clientToWorld = (clientX: number, clientY: number): LocationPoint => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        addElement(location.id, {
          type: "image",
          name: file.name.replace(/\.[^.]+$/, ""),
          x: 0,
          y: 0,
          width: 800,
          height: 600,
          imageUrl: reader.result,
          opacity: 1,
          zIndex: 0,
        });
        setActiveTool("select");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const finishPolyOrPath = () => {
    if (drawingPoints.length < 2) {
      setDrawingPoints([]);
      return;
    }
    const type = activeTool === "zone_polygon" ? "zone_polygon" : "path";
    if (type === "zone_polygon" && drawingPoints.length < 3) {
      setDrawingPoints([]);
      return;
    }
    addElement(location.id, {
      type,
      points: drawingPoints,
      x: 0,
      y: 0,
    });
    setDrawingPoints([]);
    setHoverPoint(null);
    setActiveTool("select");
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Middle click or Alt+click pans
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      dragStateRef.current = {
        mode: "pan",
        startClientX: e.clientX,
        startClientY: e.clientY,
        origX: pan.x,
        origY: pan.y,
        origW: 0,
        origH: 0,
      };
      return;
    }

    if (e.button !== 0) return;

    const pt = clientToWorld(e.clientX, e.clientY);
    const sx = snap(pt.x);
    const sy = snap(pt.y);

    if (activeTool === "select") {
      setSelectedElementId(null);
      dragStateRef.current = {
        mode: "pan",
        startClientX: e.clientX,
        startClientY: e.clientY,
        origX: pan.x,
        origY: pan.y,
        origW: 0,
        origH: 0,
      };
      return;
    }

    if (activeTool === "spot" || activeTool === "link") {
      addElement(location.id, {
        type: activeTool,
        x: sx,
        y: sy,
        width: 32,
        height: 32,
        opacity: 1,
      });
      setActiveTool("select");
      return;
    }

    if (activeTool === "zone_rect" || activeTool === "zone_circle") {
      setDragBox({ start: { x: sx, y: sy }, current: { x: sx, y: sy } });
      return;
    }

    if (activeTool === "zone_polygon" || activeTool === "path") {
      setDrawingPoints((prev) => [...prev, { x: sx, y: sy }]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pt = clientToWorld(e.clientX, e.clientY);

    if (activeTool === "zone_polygon" || activeTool === "path") {
      setHoverPoint({ x: snap(pt.x), y: snap(pt.y) });
    }

    if (dragBox) {
      setDragBox({
        ...dragBox,
        current: { x: snap(pt.x), y: snap(pt.y) },
      });
      return;
    }

    const drag = dragStateRef.current;
    if (!drag) return;

    const dx = (e.clientX - drag.startClientX) / zoom;
    const dy = (e.clientY - drag.startClientY) / zoom;

    if (drag.mode === "pan") {
      setPan({
        x: drag.origX + (e.clientX - drag.startClientX),
        y: drag.origY + (e.clientY - drag.startClientY),
      });
    } else if (drag.mode === "move" && drag.elementId) {
      if (drag.origPoints && drag.origPoints.length > 0) {
        const sdx = snap(dx);
        const sdy = snap(dy);
        updateElement(location.id, drag.elementId, {
          points: drag.origPoints.map((p) => ({ x: p.x + sdx, y: p.y + sdy })),
        });
      } else {
        updateElement(location.id, drag.elementId, {
          x: snap(drag.origX + dx),
          y: snap(drag.origY + dy),
        });
      }
    } else if (drag.mode === "resize" && drag.elementId) {
      updateElement(location.id, drag.elementId, {
        width: Math.max(24, snap(drag.origW + dx)),
        height: Math.max(24, snap(drag.origH + dy)),
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (dragBox) {
      const x = Math.min(dragBox.start.x, dragBox.current.x);
      const y = Math.min(dragBox.start.y, dragBox.current.y);
      const w = Math.abs(dragBox.current.x - dragBox.start.x);
      const h = Math.abs(dragBox.current.y - dragBox.start.y);
      addElement(location.id, {
        type: activeTool === "zone_circle" ? "zone_circle" : "zone_rect",
        x,
        y,
        width: w < 20 ? 180 : w,
        height: h < 20 ? 140 : h,
      });
      setDragBox(null);
      setActiveTool("select");
    }
    dragStateRef.current = null;
  };

  const handleElementMouseDown = (
    e: React.MouseEvent,
    el: LocationElement
  ) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    setSelectedElementId(el.id);
    if (el.locked) return;

    dragStateRef.current = {
      mode: "move",
      elementId: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.width,
      origH: el.height,
      origPoints: el.points?.length ? el.points.map((p) => ({ ...p })) : undefined,
    };
  };

  const handleElementDoubleClick = (el: LocationElement) => {
    if (el.linkedEntityType === "location" && el.linkedEntityId) {
      openLocation(el.linkedEntityId);
    } else if (el.linkedEntityType === "conversation" && el.linkedEntityId) {
      openConversation(el.linkedEntityId);
      setViewMode("canvas");
    } else if (el.linkedEntityType === "document" && el.linkedEntityId) {
      openDocument(el.linkedEntityId);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || Math.abs(e.deltaY) > 0) {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((z) => Math.min(3, Math.max(0.25, Number((z * factor).toFixed(2)))));
    }
  };

  const parentLoc = location.parentId
    ? project.locations?.find((l) => l.id === location.parentId)
    : null;

  const sortedElements = [...(location.elements || [])].sort(
    (a, b) => a.zIndex - b.zIndex
  );

  const tools: Array<{
    id: LocationTool;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: "select", label: "Select / Move", icon: <MousePointer size={15} /> },
    { id: "zone_rect", label: "Rectangular Zone", icon: <Square size={15} /> },
    { id: "zone_circle", label: "Circular Zone", icon: <Circle size={15} /> },
    { id: "zone_polygon", label: "Polygon Zone", icon: <Hexagon size={15} /> },
    { id: "path", label: "Path / Route", icon: <Spline size={15} /> },
    { id: "spot", label: "Spot / Pin", icon: <MapPin size={15} /> },
    { id: "link", label: "Link / Portal", icon: <Link2 size={15} /> },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-fw-bg overflow-hidden select-none">
      {/* Location Top Bar */}
      <div className="h-11 bg-fw-panel border-b border-fw-border px-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setShowLayers((v) => !v)}
            className={`p-1.5 rounded text-xs transition-colors ${
              showLayers
                ? "bg-fw-bg text-fw-accent"
                : "text-fw-muted hover:text-fw-text hover:bg-fw-bg"
            }`}
            title="Toggle Layer Navigator"
          >
            <Layers size={15} />
          </button>

          {parentLoc && (
            <button
              onClick={() => openLocation(parentLoc.id)}
              className="flex items-center gap-1 text-xs text-fw-muted hover:text-fw-accent transition-colors shrink-0"
              title={`Go to parent location: ${parentLoc.name}`}
            >
              <span>{parentLoc.name}</span>
              <ChevronRight size={12} />
            </button>
          )}

          <input
            value={location.name}
            onChange={(e) =>
              updateLocation(location.id, { name: e.target.value })
            }
            className="bg-transparent text-sm font-semibold text-white focus:outline-none focus:bg-fw-bg px-2 py-1 rounded border border-transparent focus:border-fw-border min-w-[140px]"
          />

          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-fw-bg border border-fw-border text-fw-muted">
            Location Map
          </span>
        </div>

        {/* Drawing Helper Banner */}
        {(activeTool === "zone_polygon" || activeTool === "path") && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-fw-accent/20 border border-fw-accent/50 text-xs text-fw-text">
            <span>
              Click to place vertices ({drawingPoints.length} placed)
            </span>
            <button
              onClick={finishPolyOrPath}
              disabled={
                drawingPoints.length < (activeTool === "zone_polygon" ? 3 : 2)
              }
              className="flex items-center gap-1 px-2 py-0.5 bg-fw-accent text-white rounded text-[11px] disabled:opacity-40"
            >
              <Check size={11} /> Finish
            </button>
            <button
              onClick={() => {
                setDrawingPoints([]);
                setActiveTool("select");
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-fw-bg text-fw-muted hover:text-white rounded text-[11px]"
            >
              <X size={11} /> Cancel
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <button
            onClick={() => setShowGrid((v) => !v)}
            className={`p-1.5 rounded border transition-colors ${
              showGrid
                ? "bg-fw-bg border-fw-accent/50 text-fw-accent"
                : "border-fw-border text-fw-muted hover:text-fw-text"
            }`}
            title="Toggle Grid"
          >
            <Grid size={13} />
          </button>
          <button
            onClick={() => setSnapToGrid((v) => !v)}
            className={`px-2 py-1 rounded border text-[11px] transition-colors ${
              snapToGrid
                ? "bg-fw-bg border-fw-accent/50 text-fw-accent"
                : "border-fw-border text-fw-muted hover:text-fw-text"
            }`}
            title="Snap to 20px Grid"
          >
            Snap
          </button>
          <div className="flex items-center bg-fw-bg border border-fw-border rounded">
            <button
              onClick={() => setZoom((z) => Math.max(0.25, Number((z - 0.15).toFixed(2))))}
              className="p-1.5 text-fw-muted hover:text-fw-text"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="px-2 text-[11px] text-fw-text font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.15).toFixed(2))))}
              className="p-1.5 text-fw-muted hover:text-fw-text"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 80, y: 60 });
              }}
              className="p-1.5 text-fw-muted hover:text-fw-text border-l border-fw-border"
              title="Reset View"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Articy Tool Palette */}
        <div className="w-11 bg-fw-panel border-r border-fw-border flex flex-col items-center py-2 gap-1.5 shrink-0">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setDrawingPoints([]);
                setActiveTool(t.id);
              }}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                activeTool === t.id
                  ? "bg-fw-accent text-white shadow"
                  : "text-fw-muted hover:text-fw-text hover:bg-fw-bg"
              }`}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}

          <div className="w-6 border-t border-fw-border my-1" />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded flex items-center justify-center text-fw-muted hover:text-fw-text hover:bg-fw-bg transition-colors"
            title="Import Background Map / Concept Art"
          >
            <ImagePlus size={15} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Layer Navigator (Articy Z-Order) */}
        {showLayers && (
          <div className="w-52 bg-fw-panel/70 border-r border-fw-border flex flex-col shrink-0">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-fw-muted border-b border-fw-border/60">
              Layers / Z-Order ({sortedElements.length})
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
              {sortedElements.length === 0 ? (
                <div className="text-[11px] text-fw-muted/60 text-center py-4 px-2">
                  Use the left toolset to draw Zones, Paths, Spots, Links, or import a Map Image.
                </div>
              ) : (
                [...sortedElements].reverse().map((el) => {
                  const isSelected = el.id === selectedElementId;
                  return (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`group flex items-center justify-between gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-fw-bg text-fw-accent font-medium border border-fw-accent/40"
                          : "text-fw-text hover:bg-fw-bg/60"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: el.color }}
                        />
                        <span className="truncate">{el.name}</span>
                      </div>
                      <div
                        className="flex items-center gap-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            toggleElementVisibility(location.id, el.id)
                          }
                          className="p-0.5 text-fw-muted hover:text-fw-text"
                          title={el.visible ? "Hide Layer" : "Show Layer"}
                        >
                          {el.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                        </button>
                        <button
                          onClick={() => toggleElementLock(location.id, el.id)}
                          className={`p-0.5 ${
                            el.locked
                              ? "text-amber-400"
                              : "text-fw-muted hover:text-fw-text"
                          }`}
                          title={el.locked ? "Unlock Layer" : "Lock Layer"}
                        >
                          {el.locked ? <Lock size={11} /> : <Unlock size={11} />}
                        </button>
                        <button
                          onClick={() => reorderElement(location.id, el.id, "up")}
                          className="p-0.5 text-fw-muted hover:text-fw-text opacity-0 group-hover:opacity-100"
                          title="Bring Forward"
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          onClick={() =>
                            reorderElement(location.id, el.id, "down")
                          }
                          className="p-0.5 text-fw-muted hover:text-fw-text opacity-0 group-hover:opacity-100"
                          title="Send Backward"
                        >
                          <ArrowDown size={11} />
                        </button>
                        <button
                          onClick={() => removeElement(location.id, el.id)}
                          className="p-0.5 text-fw-muted hover:text-fw-error opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Interactive Spatial Canvas */}
        <div
          ref={viewportRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onDoubleClick={() => {
            if (activeTool === "zone_polygon" || activeTool === "path") {
              finishPolyOrPath();
            }
          }}
          onWheel={handleWheel}
          className="flex-1 relative overflow-hidden"
          style={{
            backgroundColor: location.backgroundColor || "#14161b",
            backgroundImage: showGrid
              ? `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                 linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`
              : undefined,
            backgroundSize: showGrid
              ? `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`
              : undefined,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            cursor: activeTool === "select" ? "default" : "crosshair",
          }}
        >
          {/* World Transform Container */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            {/* Background Images & Rect/Circle Zones & Spots/Links */}
            {sortedElements.map((el) => {
              if (!el.visible) return null;
              const isSelected = el.id === selectedElementId;

              if (el.type === "image") {
                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleElementMouseDown(e, el)}
                    style={{
                      position: "absolute",
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      opacity: el.opacity,
                      pointerEvents: el.locked ? "none" : "auto",
                      outline: isSelected ? "2px solid #4f8ef7" : "none",
                    }}
                  >
                    {el.imageUrl ? (
                      <img
                        src={el.imageUrl}
                        alt={el.name}
                        draggable={false}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full border border-dashed border-fw-border flex items-center justify-center text-xs text-fw-muted">
                        No image URL
                      </div>
                    )}
                    {isSelected && !el.locked && (
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          dragStateRef.current = {
                            mode: "resize",
                            elementId: el.id,
                            startClientX: e.clientX,
                            startClientY: e.clientY,
                            origX: el.x,
                            origY: el.y,
                            origW: el.width,
                            origH: el.height,
                          };
                        }}
                        className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-fw-accent border border-white rounded-sm cursor-nwse-resize"
                      />
                    )}
                  </div>
                );
              }

              if (el.type === "zone_rect" || el.type === "zone_circle") {
                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleElementMouseDown(e, el)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleElementDoubleClick(el);
                    }}
                    style={{
                      position: "absolute",
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      borderRadius: el.type === "zone_circle" ? "9999px" : "4px",
                      border: `2px ${isSelected ? "solid" : "dashed"} ${el.color}`,
                      backgroundColor: `${el.color}${Math.round(el.opacity * 255)
                        .toString(16)
                        .padStart(2, "0")}`,
                      pointerEvents: "auto",
                      cursor: el.locked ? "default" : "move",
                      boxShadow: isSelected
                        ? "0 0 0 2px rgba(79,142,247,0.45)"
                        : undefined,
                    }}
                    className="flex items-center justify-center"
                  >
                    <span className="px-2 py-0.5 rounded bg-black/65 text-[11px] font-semibold text-white pointer-events-none truncate max-w-[90%]">
                      {el.name}
                    </span>
                    {isSelected && !el.locked && (
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          dragStateRef.current = {
                            mode: "resize",
                            elementId: el.id,
                            startClientX: e.clientX,
                            startClientY: e.clientY,
                            origX: el.x,
                            origY: el.y,
                            origW: el.width,
                            origH: el.height,
                          };
                        }}
                        className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-fw-accent border border-white rounded-sm cursor-nwse-resize"
                      />
                    )}
                  </div>
                );
              }

              if (el.type === "spot" || el.type === "link") {
                const isLink = el.type === "link";
                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleElementMouseDown(e, el)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleElementDoubleClick(el);
                    }}
                    style={{
                      position: "absolute",
                      left: el.x - 14,
                      top: el.y - 14,
                      pointerEvents: "auto",
                      cursor: el.locked ? "default" : "move",
                    }}
                    className="flex flex-col items-center group"
                    title={
                      el.linkedEntityId
                        ? `${el.name} (Double-click to open linked ${el.linkedEntityType})`
                        : el.name
                    }
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform ${
                        isSelected ? "scale-110 ring-2 ring-white" : ""
                      }`}
                      style={{
                        backgroundColor: el.color,
                        borderColor: "#ffffff",
                      }}
                    >
                      {isLink ? (
                        <Link2 size={13} className="text-white" />
                      ) : (
                        <MapPin size={13} className="text-white" />
                      )}
                    </div>
                    <span className="mt-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-white whitespace-nowrap">
                      {el.name}
                    </span>
                  </div>
                );
              }

              return null;
            })}

            {/* SVG Layer for Polygons, Paths, and Active Drawing Preview */}
            <svg
              style={{
                position: "absolute",
                left: -5000,
                top: -5000,
                width: 10000,
                height: 10000,
                overflow: "visible",
                pointerEvents: "none",
              }}
              viewBox="-5000 -5000 10000 10000"
            >
              <defs>
                <marker
                  id="fw-path-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" />
                </marker>
              </defs>

              {sortedElements.map((el) => {
                if (!el.visible) return null;
                const isSelected = el.id === selectedElementId;

                if (el.type === "zone_polygon" && el.points.length >= 3) {
                  const ptsStr = el.points.map((p) => `${p.x},${p.y}`).join(" ");
                  const cx =
                    el.points.reduce((s, p) => s + p.x, 0) / el.points.length;
                  const cy =
                    el.points.reduce((s, p) => s + p.y, 0) / el.points.length;
                  return (
                    <g
                      key={el.id}
                      style={{ pointerEvents: "auto", cursor: el.locked ? "default" : "move" }}
                      onMouseDown={(e) => handleElementMouseDown(e as any, el)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleElementDoubleClick(el);
                      }}
                    >
                      <polygon
                        points={ptsStr}
                        fill={el.color}
                        fillOpacity={el.opacity}
                        stroke={isSelected ? "#ffffff" : el.color}
                        strokeWidth={isSelected ? 3 : 2}
                        strokeDasharray={isSelected ? undefined : "6 4"}
                      />
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="12"
                        fontWeight="bold"
                        style={{ pointerEvents: "none" }}
                      >
                        {el.name}
                      </text>
                    </g>
                  );
                }

                if (el.type === "path" && el.points.length >= 2) {
                  const ptsStr = el.points.map((p) => `${p.x},${p.y}`).join(" ");
                  return (
                    <g
                      key={el.id}
                      style={{ pointerEvents: "auto", cursor: el.locked ? "default" : "move" }}
                      onMouseDown={(e) => handleElementMouseDown(e as any, el)}
                    >
                      <polyline
                        points={ptsStr}
                        fill="none"
                        stroke={isSelected ? "#ffffff" : el.color}
                        strokeWidth={isSelected ? 4 : 3}
                        strokeDasharray="8 4"
                        markerEnd="url(#fw-path-arrow)"
                      />
                      {el.points.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={4}
                          fill={el.color}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      ))}
                    </g>
                  );
                }

                return null;
              })}

              {/* Active Drag Box Preview */}
              {dragBox && (
                <rect
                  x={Math.min(dragBox.start.x, dragBox.current.x)}
                  y={Math.min(dragBox.start.y, dragBox.current.y)}
                  width={Math.abs(dragBox.current.x - dragBox.start.x)}
                  height={Math.abs(dragBox.current.y - dragBox.start.y)}
                  rx={activeTool === "zone_circle" ? 9999 : 4}
                  fill="#4f8ef7"
                  fillOpacity={0.25}
                  stroke="#4f8ef7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}

              {/* Active Polygon / Path Drawing Preview */}
              {drawingPoints.length > 0 && (
                <g>
                  <polyline
                    points={[
                      ...drawingPoints,
                      ...(hoverPoint ? [hoverPoint] : []),
                    ]
                      .map((p) => `${p.x},${p.y}`)
                      .join(" ")}
                    fill={
                      activeTool === "zone_polygon" ? "rgba(139,92,246,0.2)" : "none"
                    }
                    stroke="#a78bfa"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  {drawingPoints.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={4}
                      fill="#a78bfa"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  ))}
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

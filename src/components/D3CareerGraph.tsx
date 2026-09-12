import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Sparkles,
  TrendingUp,
  Target,
  Briefcase,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Award,
} from "lucide-react";

interface AlternativeRole {
  role: string;
  match: number;
  reasoning?: string;
}

interface CareerTimelineItem {
  role: string;
  company: string;
  duration: string;
  highlights: string[];
}

interface CareerTrajectoryItem {
  title: string;
  timeline: string;
  requiredSkills: string[];
  requiredCertifications: string[];
}

interface D3CareerGraphProps {
  currentRole?: string;
  topRole: string;
  confidence: number;
  alternatives?: AlternativeRole[];
  careerTimeline?: CareerTimelineItem[];
  careerTrajectories?: CareerTrajectoryItem[];
}

interface GraphNode {
  id: string;
  name: string;
  type: "past" | "current" | "primary" | "pivot" | "future";
  subtitle?: string;
  match?: number;
  skills?: string[];
  duration?: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

export const D3CareerGraph: React.FC<D3CareerGraphProps> = ({
  currentRole,
  topRole,
  confidence,
  alternatives = [],
  careerTimeline = [],
  careerTrajectories = [],
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "radial">("tree");

  // Construct Nodes and Links
  const buildGraphData = () => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // 1. Past Experience Nodes (from career timeline)
    if (careerTimeline && careerTimeline.length > 0) {
      careerTimeline.forEach((item, idx) => {
        const nodeId = `past_${idx}`;
        nodes.push({
          id: nodeId,
          name: item.role,
          type: "past",
          subtitle: item.company,
          duration: item.duration,
          skills: item.highlights?.slice(0, 3),
        });

        // Link sequential past roles
        if (idx > 0) {
          links.push({ source: `past_${idx - 1}`, target: nodeId, label: "Advanced to" });
        }
      });
    }

    // 2. Current Node (Baseline)
    const currentId = "node_current";
    const lastPastId = careerTimeline.length > 0 ? `past_${careerTimeline.length - 1}` : null;

    nodes.push({
      id: currentId,
      name: currentRole || (careerTimeline[0]?.role) || "Current Candidate Profile",
      type: "current",
      subtitle: "Current Career Stage",
      match: 100,
    });

    if (lastPastId) {
      links.push({ source: lastPastId, target: currentId, label: "Current Level" });
    }

    // 3. Recommended Primary Target Role
    const primaryId = "node_primary";
    nodes.push({
      id: primaryId,
      name: topRole,
      type: "primary",
      subtitle: "Recommended Primary Trajectory",
      match: Math.round(confidence > 1 ? confidence : confidence * 100),
    });

    links.push({
      source: currentId,
      target: primaryId,
      label: `${Math.round(confidence > 1 ? confidence : confidence * 100)}% Match`,
    });

    // 4. Alternative Pivot Roles
    alternatives.forEach((alt, idx) => {
      const altId = `pivot_${idx}`;
      nodes.push({
        id: altId,
        name: alt.role,
        type: "pivot",
        subtitle: alt.reasoning || "Strategic Career Pivot",
        match: Math.round(alt.match > 1 ? alt.match : alt.match * 100),
      });

      links.push({
        source: currentId,
        target: altId,
        label: `${Math.round(alt.match > 1 ? alt.match : alt.match * 100)}% Match`,
      });
    });

    // 5. Future Career Trajectories / Milestones
    careerTrajectories.forEach((traj, idx) => {
      const futureId = `future_${idx}`;
      nodes.push({
        id: futureId,
        name: traj.title,
        type: "future",
        subtitle: traj.timeline || "Next Frontier",
        skills: traj.requiredSkills,
      });

      links.push({
        source: primaryId,
        target: futureId,
        label: traj.timeline || "Next Horizon",
      });
    });

    return { nodes, links };
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 900;
    const height = 480;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const { nodes, links } = buildGraphData();

    // Map Node Positions based on logical layers (X coordinates)
    const layers: { [key: string]: GraphNode[] } = {
      past: nodes.filter((n) => n.type === "past"),
      current: nodes.filter((n) => n.type === "current"),
      target: nodes.filter((n) => n.type === "primary" || n.type === "pivot"),
      future: nodes.filter((n) => n.type === "future"),
    };

    const layerKeys = ["past", "current", "target", "future"].filter(
      (k) => layers[k].length > 0
    );

    const xStep = width / (layerKeys.length + 1);

    layerKeys.forEach((key, lIdx) => {
      const layerNodes = layers[key];
      const x = xStep * (lIdx + 1);
      const yStep = height / (layerNodes.length + 1);

      layerNodes.forEach((node, nIdx) => {
        node.x = x;
        node.y = yStep * (nIdx + 1);
      });
    });

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height);

    // Create container group for zoom/pan
    const g = svg.append("g");

    // Setup D3 Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // SVG Defs (Gradients & Drop Shadows)
    const defs = svg.append("defs");

    // Glow filter
    const filter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Linear Gradients for links
    const linkGradient = defs
      .append("linearGradient")
      .attr("id", "linkGrad")
      .attr("gradientUnits", "userSpaceOnUse");

    linkGradient.append("stop").attr("offset", "0%").attr("stop-color", "#14b8a6");
    linkGradient.append("stop").attr("offset", "100%").attr("stop-color", "#8b5cf6");

    // Map node array to dictionary for quick lookup
    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Render Links (Curved Bezier Paths)
    const linkGroup = g.append("g").attr("class", "links");

    links.forEach((link) => {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);

      if (!sourceNode || !targetNode || sourceNode.x === undefined || sourceNode.y === undefined || targetNode.x === undefined || targetNode.y === undefined) return;

      const pathData = d3.path();
      pathData.moveTo(sourceNode.x, sourceNode.y);

      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;

      pathData.bezierCurveTo(
        sourceNode.x + dx * 0.5,
        sourceNode.y,
        sourceNode.x + dx * 0.5,
        targetNode.y,
        targetNode.x,
        targetNode.y
      );

      // Path line
      linkGroup
        .append("path")
        .attr("d", pathData.toString())
        .attr("fill", "none")
        .attr("stroke", "url(#linkGrad)")
        .attr("stroke-width", 2.5)
        .attr("stroke-opacity", 0.5)
        .attr("stroke-dasharray", targetNode.type === "pivot" ? "4,4" : "none");

      // Animated pulsing particle along connection line
      if (targetNode.type === "primary" || targetNode.type === "current") {
        linkGroup
          .append("circle")
          .attr("r", 3)
          .attr("fill", "#2dd4bf")
          .append("animateMotion")
          .attr("path", pathData.toString())
          .attr("dur", "3s")
          .attr("repeatCount", "indefinite");
      }

      // Link badge label
      if (link.label) {
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2 - 8;

        const badge = linkGroup
          .append("g")
          .attr("transform", `translate(${midX}, ${midY})`);

        badge
          .append("rect")
          .attr("x", -32)
          .attr("y", -9)
          .attr("width", 64)
          .attr("height", 16)
          .attr("rx", 8)
          .attr("fill", "#090d16")
          .attr("stroke", "#1e293b")
          .attr("stroke-width", 1);

        badge
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "3")
          .attr("fill", "#94a3b8")
          .attr("font-size", "9px")
          .attr("font-weight", "800")
          .text(link.label);
      }
    });

    // Render Nodes
    const nodeGroup = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x || 0}, ${d.y || 0})`)
      .attr("class", "cursor-pointer")
      .on("click", (_event, d) => setSelectedNode(d));

    // Node Circle Styling by type
    nodeGroup.each(function (d) {
      const nodeElem = d3.select(this);

      let radius = 24;
      let strokeColor = "#14b8a6";
      let fillColor = "#0f172a";

      if (d.type === "primary") {
        radius = 32;
        strokeColor = "#2dd4bf";
        fillColor = "#134e4a";
      } else if (d.type === "pivot") {
        radius = 26;
        strokeColor = "#38bdf8";
        fillColor = "#0c4a6e";
      } else if (d.type === "current") {
        radius = 28;
        strokeColor = "#a855f7";
        fillColor = "#581c87";
      } else if (d.type === "future") {
        radius = 24;
        strokeColor = "#f43f5e";
        fillColor = "#881337";
      }

      // Outer glow circle
      nodeElem
        .append("circle")
        .attr("r", radius + 6)
        .attr("fill", strokeColor)
        .attr("opacity", 0.15)
        .attr("filter", "url(#glow)");

      // Main Node Circle
      nodeElem
        .append("circle")
        .attr("r", radius)
        .attr("fill", fillColor)
        .attr("stroke", strokeColor)
        .attr("stroke-width", 2.5);

      // Node Icon / Indicator
      if (d.match) {
        nodeElem
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "4")
          .attr("fill", "#ffffff")
          .attr("font-size", d.type === "primary" ? "12px" : "10px")
          .attr("font-weight", "900")
          .text(`${d.match}%`);
      } else {
        nodeElem
          .append("circle")
          .attr("r", 5)
          .attr("fill", strokeColor);
      }

      // Node Text Label
      const labelGroup = nodeElem
        .append("g")
        .attr("transform", `translate(0, ${radius + 18})`);

      // Node Title
      labelGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "#f8fafc")
        .attr("font-size", d.type === "primary" ? "12px" : "11px")
        .attr("font-weight", "800")
        .text(d.name.length > 22 ? d.name.substring(0, 20) + "..." : d.name);

      // Node Subtitle
      if (d.subtitle) {
        labelGroup
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "14")
          .attr("fill", "#94a3b8")
          .attr("font-size", "9px")
          .attr("font-weight", "600")
          .text(
            d.subtitle.length > 26 ? d.subtitle.substring(0, 24) + "..." : d.subtitle
          );
      }
    });
  }, [confidence, topRole, alternatives, careerTimeline, careerTrajectories, viewMode]);

  return (
    <div className="w-full bg-slate-950/80 border border-purple-500/20 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              D3 Interactive Trajectory Graph
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Connected mapping from past experience to primary & pivot career horizons
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-400" /> Vector Graph Engine
          </span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="w-full h-[480px] relative bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-purple-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${selectedNode.type === 'primary' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'}`}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">
                    {selectedNode.name}
                  </h4>
                  {selectedNode.match && (
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-black border border-teal-500/30">
                      {selectedNode.match}% Match
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedNode.subtitle}
                </p>
              </div>
            </div>

            {selectedNode.skills && selectedNode.skills.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.skills.map((s, idx) => (
                    <span key={`node-sk-${s}-${idx}`} className="px-2 py-0.5 rounded bg-white/10 text-slate-200 text-[10px] font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-600 border border-purple-400" />
          <span>Current Profile</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-teal-600 border border-teal-400" />
          <span>Recommended Primary Role</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-600 border border-sky-400" />
          <span>Career Pivot Option</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-600 border border-rose-400" />
          <span>Future Horizon</span>
        </div>
      </div>
    </div>
  );
};

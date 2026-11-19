import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TrendingUp, Target, X } from "lucide-react";

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
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" &&
    (document.documentElement.getAttribute("data-theme") === "figma-dark" ||
      document.documentElement.classList.contains("dark"))
  );

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(
        document.documentElement.getAttribute("data-theme") === "figma-dark" ||
          document.documentElement.classList.contains("dark")
      );
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    return () => observer.disconnect();
  }, []);

  const buildGraphData = () => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

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

        if (idx > 0) {
          links.push({
            source: `past_${idx - 1}`,
            target: nodeId,
            label: "Advanced to",
          });
        }
      });
    }

    const currentId = "node_current";
    const lastPastId =
      careerTimeline.length > 0 ? `past_${careerTimeline.length - 1}` : null;

    nodes.push({
      id: currentId,
      name: currentRole || careerTimeline[0]?.role || "Current Candidate Profile",
      type: "current",
      subtitle: "Current Career Stage",
      match: 100,
    });

    if (lastPastId) {
      links.push({
        source: lastPastId,
        target: currentId,
        label: "Current Level",
      });
    }

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

    careerTrajectories.forEach((traj, idx) => {
      const futureId = `future_${idx}`;
      nodes.push({
        id: futureId,
        name: traj.title,
        type: "future",
        subtitle: traj.timeline || "Next Horizon",
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
    const height = 460;

    d3.select(svgRef.current).selectAll("*").remove();

    const { nodes, links } = buildGraphData();

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

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const defs = svg.append("defs");
    const linkGradient = defs
      .append("linearGradient")
      .attr("id", "careerLinkGrad")
      .attr("gradientUnits", "userSpaceOnUse");

    linkGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", isDark ? "#7c3aed" : "#6d28d9");
    linkGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", isDark ? "#c084fc" : "#9333ea");

    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const linkGroup = g.append("g").attr("class", "links");

    links.forEach((link) => {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);

      if (
        !sourceNode ||
        !targetNode ||
        sourceNode.x === undefined ||
        sourceNode.y === undefined ||
        targetNode.x === undefined ||
        targetNode.y === undefined
      ) {
        return;
      }

      const pathData = d3.path();
      pathData.moveTo(sourceNode.x, sourceNode.y);
      const dx = targetNode.x - sourceNode.x;

      pathData.bezierCurveTo(
        sourceNode.x + dx * 0.5,
        sourceNode.y,
        sourceNode.x + dx * 0.5,
        targetNode.y,
        targetNode.x,
        targetNode.y
      );

      linkGroup
        .append("path")
        .attr("d", pathData.toString())
        .attr("fill", "none")
        .attr("stroke", "url(#careerLinkGrad)")
        .attr("stroke-width", 2.2)
        .attr("stroke-opacity", isDark ? 0.55 : 0.45)
        .attr("stroke-dasharray", targetNode.type === "pivot" ? "4,4" : "none");

      if (link.label) {
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2 - 8;

        const badge = linkGroup
          .append("g")
          .attr("transform", `translate(${midX}, ${midY})`);

        badge
          .append("rect")
          .attr("x", -34)
          .attr("y", -9)
          .attr("width", 68)
          .attr("height", 16)
          .attr("rx", 6)
          .attr("fill", isDark ? "#111116" : "#ffffff")
          .attr("stroke", isDark ? "#27272a" : "#e4e4e7")
          .attr("stroke-width", 1);

        badge
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "3")
          .attr("fill", isDark ? "#a1a1aa" : "#52525b")
          .attr("font-size", "9px")
          .attr("font-weight", "700")
          .text(link.label);
      }
    });

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

    nodeGroup.each(function (d) {
      const nodeElem = d3.select(this);

      let radius = 24;
      let strokeColor = isDark ? "#8b5cf6" : "#6d28d9";
      let fillColor = isDark ? "#18181b" : "#f4f4f5";
      let textColor = isDark ? "#ffffff" : "#09090b";

      if (d.type === "primary") {
        radius = 32;
        strokeColor = isDark ? "#a855f7" : "#6d28d9";
        fillColor = "#6d28d9";
        textColor = "#ffffff";
      } else if (d.type === "pivot") {
        radius = 26;
        strokeColor = isDark ? "#c084fc" : "#9333ea";
        fillColor = isDark ? "#2e1065" : "#f3e8ff";
        textColor = isDark ? "#f3e8ff" : "#581c87";
      } else if (d.type === "current") {
        radius = 28;
        strokeColor = isDark ? "#f4f4f5" : "#09090b";
        fillColor = isDark ? "#09090b" : "#09090b";
        textColor = "#ffffff";
      } else if (d.type === "future") {
        radius = 24;
        strokeColor = isDark ? "#d8b4fe" : "#7e22ce";
        fillColor = isDark ? "#1e1b2e" : "#faf5ff";
        textColor = isDark ? "#f4f4f5" : "#581c87";
      }

      nodeElem
        .append("circle")
        .attr("r", radius)
        .attr("fill", fillColor)
        .attr("stroke", strokeColor)
        .attr("stroke-width", 2.2);

      if (d.match) {
        nodeElem
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "4")
          .attr("fill", textColor)
          .attr("font-size", d.type === "primary" ? "12px" : "10px")
          .attr("font-weight", "800")
          .text(`${d.match}%`);
      } else {
        nodeElem
          .append("circle")
          .attr("r", 4.5)
          .attr("fill", strokeColor);
      }

      const labelGroup = nodeElem
        .append("g")
        .attr("transform", `translate(0, ${radius + 18})`);

      labelGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("fill", isDark ? "#f4f4f5" : "#09090b")
        .attr("font-size", d.type === "primary" ? "12px" : "11px")
        .attr("font-weight", "700")
        .text(d.name.length > 22 ? d.name.substring(0, 20) + "..." : d.name);

      if (d.subtitle) {
        labelGroup
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "14")
          .attr("fill", isDark ? "#a1a1aa" : "#52525b")
          .attr("font-size", "9.5px")
          .attr("font-weight", "500")
          .text(
            d.subtitle.length > 26
              ? d.subtitle.substring(0, 24) + "..."
              : d.subtitle
          );
      }
    });
  }, [confidence, topRole, alternatives, careerTimeline, careerTrajectories, isDark]);

  return (
    <div className="w-full bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white tracking-tight">
              Interactive Trajectory Graph
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Connected mapping from past experience to primary and pivot career horizons
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Drag to pan · Scroll to zoom · Click node to inspect
        </span>
      </div>

      {/* SVG Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-[460px] relative bg-zinc-50 dark:bg-[#09090b] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-[#111116] border border-violet-300 dark:border-violet-700/60 p-4 rounded-xl shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-white">
                    {selectedNode.name}
                  </h4>
                  {selectedNode.match && (
                    <span className="text-xs font-bold tabular-nums text-violet-700 dark:text-violet-300">
                      · {selectedNode.match}% Match
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {selectedNode.subtitle}
                </p>
              </div>
            </div>

            {selectedNode.skills && selectedNode.skills.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                  Highlights:
                </span>
                <span>{selectedNode.skills.join(" · ")}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close node details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-400 dark:border-zinc-200" />
          <span>Current Profile</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-700 border border-violet-500" />
          <span>Recommended Primary Role</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-200 dark:bg-purple-900 border border-purple-500" />
          <span>Career Pivot Option</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-fuchsia-100 dark:bg-violet-950 border border-purple-400" />
          <span>Future Horizon</span>
        </div>
      </div>
    </div>
  );
};

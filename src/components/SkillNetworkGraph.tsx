import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  Layers,
  ShieldCheck,
  AlertTriangle,
  X,
  Play,
  Pause,
  PlusCircle,
} from "lucide-react";

export type SkillCategory =
  | "cloud-infra"
  | "frontend"
  | "backend"
  | "data-ai"
  | "architecture"
  | "leadership"
  | "general";

export interface SkillNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  category: SkillCategory;
  categoryLabel: string;
  isFound: boolean;
  isMissing: boolean;
  isCategoryHub: boolean;
  importance?: "critical" | "high" | "medium" | "standard";
  radius: number;
  connections: string[];
  description?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface SkillLink extends d3.SimulationLinkDatum<SkillNode> {
  source: string | SkillNode;
  target: string | SkillNode;
  value: number;
  type: "category" | "ecosystem" | "gap-bridge";
  label?: string;
}

export interface SkillNetworkGraphProps {
  foundSkills: string[];
  missingSkills?: string[];
  skillGapReport?: Array<{ skill: string; importance: string; reason?: string }>;
  onSkillClick?: (skillName: string) => void;
  className?: string;
  height?: number;
  standalone?: boolean;
}

// Executive Violet, Royal Purple, Obsidian & Graphite palette
export const CATEGORY_CONFIG: Record<
  SkillCategory,
  {
    label: string;
    color: string;
    glowColor: string;
    hubRadius: number;
    description: string;
  }
> = {
  "cloud-infra": {
    label: "Cloud & Infrastructure",
    color: "#7c3aed",
    glowColor: "rgba(124, 58, 237, 0.35)",
    hubRadius: 28,
    description: "Cloud platforms, container orchestration & scalable infrastructure",
  },
  backend: {
    label: "Backend & Systems",
    color: "#9333ea",
    glowColor: "rgba(147, 51, 234, 0.35)",
    hubRadius: 28,
    description: "Server runtimes, APIs, microservices & backend frameworks",
  },
  frontend: {
    label: "Frontend & UI",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.35)",
    hubRadius: 28,
    description: "Client architecture, reactive UI, state & performance",
  },
  "data-ai": {
    label: "Data, Databases & AI",
    color: "#6d28d9",
    glowColor: "rgba(109, 40, 217, 0.35)",
    hubRadius: 28,
    description: "Relational/NoSQL databases, messaging, pipelines & ML/AI",
  },
  architecture: {
    label: "Systems Architecture",
    color: "#c026d3",
    glowColor: "rgba(192, 38, 211, 0.35)",
    hubRadius: 26,
    description: "Distributed systems, design patterns, high-throughput & reliability",
  },
  leadership: {
    label: "Leadership & Strategy",
    color: "#5b21b6",
    glowColor: "rgba(91, 33, 182, 0.35)",
    hubRadius: 26,
    description: "Executive engineering stewardship, team mentorship & roadmap",
  },
  general: {
    label: "Core Competencies",
    color: "#71717a",
    glowColor: "rgba(113, 113, 122, 0.3)",
    hubRadius: 24,
    description: "Foundational software engineering methodologies",
  },
};

const TECH_RELATIONSHIPS: Array<[string, string, string]> = [
  ["AWS", "Kubernetes", "Cloud Orchestration"],
  ["AWS", "Docker", "Containerization"],
  ["AWS", "Terraform", "Infrastructure as Code"],
  ["AWS", "Serverless", "Event Architecture"],
  ["Kubernetes", "Docker", "Runtime Container"],
  ["Kubernetes", "Microservices", "Service Mesh"],
  ["Kubernetes", "CI/CD", "Automated Deployments"],
  ["Docker", "CI/CD", "Build Pipeline"],
  ["GCP", "Kubernetes", "GKE Ecosystem"],
  ["Terraform", "Cloud Architecture", "Provisioning"],
  ["Linux", "Docker", "Host Environment"],
  ["Node.js", "TypeScript", "Typed Backend"],
  ["Node.js", "Express", "REST Framework"],
  ["Node.js", "FastAPI", "API Microservices"],
  ["Node.js", "PostgreSQL", "Data Persistence"],
  ["Node.js", "Redis", "Distributed Cache"],
  ["Python", "Machine Learning", "AI Pipeline"],
  ["Python", "FastAPI", "Async APIs"],
  ["Python", "Spark", "Data Processing"],
  ["Go", "Microservices", "Concurrent Services"],
  ["Go", "Kubernetes", "Cloud Native Tooling"],
  ["Java", "Spring Boot", "Enterprise Backend"],
  ["REST APIs", "gRPC", "API Protocols"],
  ["Microservices", "Distributed Systems", "Architecture Pattern"],
  ["Microservices", "Event-Driven", "Asynchronous Messaging"],
  ["Distributed Systems", "High-Throughput", "Performance Scaling"],
  ["TypeScript", "React", "Typed Components"],
  ["React", "Next.js", "Full-Stack React"],
  ["React", "Tailwind", "Design Systems"],
  ["React", "Redux", "Global State"],
  ["React", "GraphQL", "Data Querying"],
  ["TypeScript", "Node.js", "Full-Stack TS"],
  ["UI/UX", "React", "Component Systems"],
  ["PostgreSQL", "Redis", "Persistence & Caching"],
  ["Kafka", "Event-Driven", "Message Streaming"],
  ["Kafka", "Microservices", "Event Bus"],
  ["Kafka", "Distributed Systems", "Stream Processing"],
  ["MongoDB", "Node.js", "Document Store"],
  ["Elasticsearch", "Distributed Systems", "Search Engine"],
  ["Snowflake", "Data Engineering", "Data Warehouse"],
  ["Machine Learning", "Python", "Model Training"],
  ["Vector DB", "LLM", "Embedding Search"],
  ["LLM", "Generative AI", "Language Models"],
  ["Agile/Scrum", "Team Stewardship", "Sprint Cadence"],
  ["Technical Strategy", "System Design", "Architecture Roadmap"],
  ["Mentorship", "Team Stewardship", "Engineering Culture"],
  ["Cross-Functional Leadership", "Technical Strategy", "Stakeholder Alignment"],
  ["Budget Management", "Technical Strategy", "Resource Allocation"],
];

function classifySkill(name: string): SkillCategory {
  const lower = name.toLowerCase();

  if (
    lower.includes("aws") ||
    lower.includes("cloud") ||
    lower.includes("kubernetes") ||
    lower.includes("docker") ||
    lower.includes("terraform") ||
    lower.includes("ci/cd") ||
    lower.includes("azure") ||
    lower.includes("gcp") ||
    lower.includes("devops") ||
    lower.includes("serverless") ||
    lower.includes("helm") ||
    lower.includes("prometheus") ||
    lower.includes("linux")
  ) {
    return "cloud-infra";
  }

  if (
    lower.includes("react") ||
    lower.includes("frontend") ||
    lower.includes("vue") ||
    lower.includes("angular") ||
    lower.includes("next.js") ||
    lower.includes("tailwind") ||
    lower.includes("css") ||
    lower.includes("html") ||
    lower.includes("ui/ux") ||
    lower.includes("redux") ||
    lower.includes("web")
  ) {
    return "frontend";
  }

  if (
    lower.includes("sql") ||
    lower.includes("postgres") ||
    lower.includes("redis") ||
    lower.includes("database") ||
    lower.includes("kafka") ||
    lower.includes("mongo") ||
    lower.includes("spark") ||
    lower.includes("data") ||
    lower.includes("ai") ||
    lower.includes("machine learning") ||
    lower.includes("snowflake") ||
    lower.includes("vector") ||
    lower.includes("llm") ||
    lower.includes("python")
  ) {
    return "data-ai";
  }

  if (
    lower.includes("distributed") ||
    lower.includes("microservice") ||
    lower.includes("event-driven") ||
    lower.includes("system design") ||
    lower.includes("architecture") ||
    lower.includes("scale") ||
    lower.includes("high-throughput") ||
    lower.includes("rest") ||
    lower.includes("grpc") ||
    lower.includes("performance")
  ) {
    return "architecture";
  }

  if (
    lower.includes("leadership") ||
    lower.includes("mentorship") ||
    lower.includes("agile") ||
    lower.includes("scrum") ||
    lower.includes("budget") ||
    lower.includes("management") ||
    lower.includes("strategy") ||
    lower.includes("stewardship") ||
    lower.includes("stakeholder") ||
    lower.includes("cross-functional")
  ) {
    return "leadership";
  }

  if (
    lower.includes("node") ||
    lower.includes("typescript") ||
    lower.includes("javascript") ||
    lower.includes("golang") ||
    lower.includes("go") ||
    lower.includes("java") ||
    lower.includes("rust") ||
    lower.includes("c++") ||
    lower.includes("api")
  ) {
    return "backend";
  }

  return "general";
}

export const SkillNetworkGraph: React.FC<SkillNetworkGraphProps> = ({
  foundSkills,
  missingSkills = [],
  skillGapReport = [],
  onSkillClick,
  className = "",
  height = 560,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "found" | "missing">("all");
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [isPhysicsActive, setIsPhysicsActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const [tooltipData, setTooltipData] = useState<{
    node: SkillNode;
    x: number;
    y: number;
  } | null>(null);

  const { nodes, links, categoryCounts } = useMemo(() => {
    const rawNodesMap = new Map<string, SkillNode>();
    const nodeIds = new Set<string>();

    const safeFound = Array.from(new Set(foundSkills.filter(Boolean)));
    const safeMissing = Array.from(new Set(missingSkills.filter(Boolean)));

    const counts: Record<SkillCategory, number> = {
      "cloud-infra": 0,
      backend: 0,
      frontend: 0,
      "data-ai": 0,
      architecture: 0,
      leadership: 0,
      general: 0,
    };

    safeFound.forEach((name) => {
      const category = classifySkill(name);
      counts[category]++;
      const id = name.trim();
      nodeIds.add(id);

      rawNodesMap.set(id, {
        id,
        name,
        category,
        categoryLabel: CATEGORY_CONFIG[category].label,
        isFound: true,
        isMissing: false,
        isCategoryHub: false,
        radius: 16,
        connections: [],
      });
    });

    safeMissing.forEach((name) => {
      const id = name.trim();
      if (nodeIds.has(id)) return;
      nodeIds.add(id);

      const category = classifySkill(name);
      counts[category]++;

      const rep = skillGapReport.find(
        (r) => r.skill.toLowerCase() === name.toLowerCase()
      );
      const imp = rep?.importance?.toLowerCase() || "high";
      const importanceLevel = imp.includes("critical")
        ? "critical"
        : imp.includes("high")
        ? "high"
        : "medium";

      rawNodesMap.set(id, {
        id,
        name,
        category,
        categoryLabel: CATEGORY_CONFIG[category].label,
        isFound: false,
        isMissing: true,
        isCategoryHub: false,
        importance: importanceLevel,
        radius: importanceLevel === "critical" ? 18 : 14,
        connections: [],
        description: rep?.reason,
      });
    });

    Object.entries(counts).forEach(([catKey, count]) => {
      if (count > 0) {
        const cat = catKey as SkillCategory;
        const hubId = `hub-${cat}`;
        nodeIds.add(hubId);

        rawNodesMap.set(hubId, {
          id: hubId,
          name: CATEGORY_CONFIG[cat].label,
          category: cat,
          categoryLabel: CATEGORY_CONFIG[cat].label,
          isFound: false,
          isMissing: false,
          isCategoryHub: true,
          radius: CATEGORY_CONFIG[cat].hubRadius,
          connections: [],
        });
      }
    });

    const linksList: SkillLink[] = [];
    const linkKeys = new Set<string>();

    const addLink = (
      sourceId: string,
      targetId: string,
      value: number,
      type: SkillLink["type"],
      label?: string
    ) => {
      if (!rawNodesMap.has(sourceId) || !rawNodesMap.has(targetId)) return;
      if (sourceId === targetId) return;

      const key1 = `${sourceId}___${targetId}`;
      const key2 = `${targetId}___${sourceId}`;
      if (linkKeys.has(key1) || linkKeys.has(key2)) return;

      linkKeys.add(key1);
      linksList.push({
        source: sourceId,
        target: targetId,
        value,
        type,
        label,
      });

      rawNodesMap.get(sourceId)?.connections.push(targetId);
      rawNodesMap.get(targetId)?.connections.push(sourceId);
    };

    rawNodesMap.forEach((node) => {
      if (!node.isCategoryHub) {
        const hubId = `hub-${node.category}`;
        addLink(hubId, node.id, 1, "category");
      }
    });

    TECH_RELATIONSHIPS.forEach(([techA, techB, relLabel]) => {
      const matchingA = Array.from(rawNodesMap.values()).find(
        (n) => !n.isCategoryHub && n.name.toLowerCase().includes(techA.toLowerCase())
      );
      const matchingB = Array.from(rawNodesMap.values()).find(
        (n) => !n.isCategoryHub && n.name.toLowerCase().includes(techB.toLowerCase())
      );

      if (matchingA && matchingB) {
        const isBridge =
          (matchingA.isFound && matchingB.isMissing) ||
          (matchingA.isMissing && matchingB.isFound);

        addLink(
          matchingA.id,
          matchingB.id,
          2.5,
          isBridge ? "gap-bridge" : "ecosystem",
          relLabel
        );
      }
    });

    const hubs = Array.from(rawNodesMap.values()).filter((n) => n.isCategoryHub);
    for (let i = 0; i < hubs.length; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        const cat1 = hubs[i].category;
        const cat2 = hubs[j].category;
        const related =
          (cat1 === "backend" && cat2 === "data-ai") ||
          (cat1 === "backend" && cat2 === "architecture") ||
          (cat1 === "cloud-infra" && cat2 === "architecture") ||
          (cat1 === "frontend" && cat2 === "backend") ||
          (cat1 === "leadership" && cat2 === "architecture");

        if (related) {
          addLink(hubs[i].id, hubs[j].id, 1, "category", "Domain Affinity");
        }
      }
    }

    return {
      nodes: Array.from(rawNodesMap.values()),
      links: linksList,
      categoryCounts: counts,
    };
  }, [foundSkills, missingSkills, skillGapReport]);

  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();

    nodes.forEach((n) => {
      if (n.isCategoryHub) {
        if (selectedCategory === "all" || n.category === selectedCategory) {
          ids.add(n.id);
        }
        return;
      }

      if (selectedCategory !== "all" && n.category !== selectedCategory) return;
      if (filterType === "found" && !n.isFound) return;
      if (filterType === "missing" && !n.isMissing) return;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!n.name.toLowerCase().includes(q)) return;
      }

      ids.add(n.id);
    });

    return ids;
  }, [nodes, selectedCategory, filterType, searchQuery]);

  const simulationRef = useRef<d3.Simulation<SkillNode, SkillLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const graphHeight = isFullscreen ? window.innerHeight - 180 : height;

    svg.attr("viewBox", `0 0 ${width} ${graphHeight}`);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("class", "graph-root");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    const simNodes: SkillNode[] = nodes.map((d) => ({ ...d }));
    const simLinks: SkillLink[] = links.map((d) => ({ ...d }));

    const simulation = d3
      .forceSimulation<SkillNode, SkillLink>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SkillNode, SkillLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => {
            if (d.type === "category") return 80;
            if (d.type === "gap-bridge") return 95;
            return 75;
          })
          .strength(0.4)
      )
      .force(
        "charge",
        d3
          .forceManyBody<SkillNode>()
          .strength((d) => (d.isCategoryHub ? -420 : -160))
          .distanceMax(380)
      )
      .force("center", d3.forceCenter(width / 2, graphHeight / 2))
      .force(
        "collide",
        d3
          .forceCollide<SkillNode>()
          .radius((d) => d.radius + 14)
          .iterations(2)
      )
      .force("x", d3.forceX(width / 2).strength(0.045))
      .force("y", d3.forceY(graphHeight / 2).strength(0.045));

    simulationRef.current = simulation;

    const linkGroup = g.append("g").attr("class", "links-layer");

    const link = linkGroup
      .selectAll<SVGLineElement, SkillLink>("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", (d) => {
        if (d.type === "gap-bridge") return isDark ? "#fb7185" : "#e11d48";
        if (d.type === "category")
          return isDark ? "rgba(161, 161, 170, 0.22)" : "rgba(113, 113, 122, 0.25)";
        return isDark ? "rgba(168, 85, 247, 0.45)" : "rgba(109, 40, 217, 0.4)";
      })
      .attr("stroke-width", (d) =>
        d.type === "gap-bridge" ? 2 : d.type === "category" ? 1.2 : 1.8
      )
      .attr("stroke-dasharray", (d) => (d.type === "gap-bridge" ? "4,4" : "none"))
      .attr("stroke-opacity", 0.7)
      .attr("class", "transition-all duration-200");

    const nodeGroup = g.append("g").attr("class", "nodes-layer");

    const node = nodeGroup
      .selectAll<SVGGElement, SkillNode>("g")
      .data(simNodes)
      .join("g")
      .attr("class", "cursor-pointer select-none")
      .call(
        d3
          .drag<SVGGElement, SkillNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Outer subtle ring for Hubs and Missing Gaps
    node
      .filter((d) => d.isCategoryHub || d.isMissing)
      .append("circle")
      .attr("r", (d) => d.radius + 5)
      .attr("fill", "none")
      .attr("stroke", (d) =>
        d.isMissing
          ? isDark
            ? "#fb7185"
            : "#e11d48"
          : CATEGORY_CONFIG[d.category]?.color || "#7c3aed"
      )
      .attr("stroke-width", 1.4)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-dasharray", (d) => (d.isMissing ? "3,3" : "none"));

    // Main Node Circle
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        if (d.isCategoryHub) {
          return isDark ? "#09090b" : "#18181b";
        }
        if (d.isMissing) {
          return isDark ? "#3f101d" : "#fff1f2";
        }
        return isDark ? "#2e1065" : "#f5f3ff";
      })
      .attr("stroke", (d) => {
        if (d.isCategoryHub) {
          return CATEGORY_CONFIG[d.category]?.color || "#8b5cf6";
        }
        if (d.isMissing) {
          return isDark ? "#fb7185" : "#e11d48";
        }
        return isDark ? "#a855f7" : "#6d28d9";
      })
      .attr("stroke-width", (d) =>
        d.isCategoryHub ? 2.4 : d.isMissing ? 2 : 1.8
      );

    // Center pip
    node
      .append("circle")
      .attr("r", (d) => (d.isCategoryHub ? 4.5 : d.isMissing ? 3.5 : 3))
      .attr("fill", (d) => {
        if (d.isCategoryHub) return CATEGORY_CONFIG[d.category]?.color || "#a855f7";
        if (d.isMissing) return isDark ? "#fb7185" : "#e11d48";
        return isDark ? "#c084fc" : "#7c3aed";
      });

    // Labels
    node
      .append("text")
      .attr("dy", (d) => (d.isCategoryHub ? d.radius + 14 : d.radius + 12))
      .attr("text-anchor", "middle")
      .text((d) => d.name)
      .attr("fill", (d) => {
        if (d.isMissing) return isDark ? "#fda4af" : "#be123c";
        if (d.isCategoryHub) return isDark ? "#f4f4f5" : "#09090b";
        return isDark ? "#e4e4e7" : "#27272a";
      })
      .attr("font-size", (d) => (d.isCategoryHub ? "11px" : "9.5px"))
      .attr("font-weight", (d) => (d.isCategoryHub ? "800" : "600"))
      .style(
        "text-shadow",
        isDark
          ? "0 2px 6px rgba(0,0,0,0.9)"
          : "0 1px 3px rgba(255,255,255,0.95)"
      )
      .style("pointer-events", "none");

    node
      .on("mouseenter", (event, d) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipData({
            node: d,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }

        const connectedIds = new Set(d.connections);
        connectedIds.add(d.id);

        node.attr("opacity", (n) => (connectedIds.has(n.id) ? 1 : 0.16));
        link.attr("stroke-opacity", (l) => {
          const s = (l.source as SkillNode).id;
          const t = (l.target as SkillNode).id;
          return s === d.id || t === d.id ? 1 : 0.08;
        });
        link.attr("stroke-width", (l) => {
          const s = (l.source as SkillNode).id;
          const t = (l.target as SkillNode).id;
          return s === d.id || t === d.id ? 2.8 : 1;
        });
      })
      .on("mousemove", (event) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipData((prev) =>
            prev
              ? {
                  ...prev,
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                }
              : null
          );
        }
      })
      .on("mouseleave", () => {
        setTooltipData(null);
        node.attr("opacity", 1);
        link.attr("stroke-opacity", 0.7).attr("stroke-width", (d) =>
          d.type === "gap-bridge" ? 2 : d.type === "category" ? 1.2 : 1.8
        );
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    svg.on("click", () => {
      setSelectedNode(null);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SkillNode).x || 0)
        .attr("y1", (d) => (d.source as SkillNode).y || 0)
        .attr("x2", (d) => (d.target as SkillNode).x || 0)
        .attr("y2", (d) => (d.target as SkillNode).y || 0);

      node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, height, isFullscreen, isDark]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg
      .selectAll<SVGGElement, SkillNode>(".nodes-layer g")
      .transition()
      .duration(200)
      .style("opacity", (d) => {
        if (activeNodeIds.size === 0) return 1;
        return activeNodeIds.has(d.id) ? 1 : 0.14;
      });

    svg
      .selectAll<SVGLineElement, SkillLink>(".links-layer line")
      .transition()
      .duration(200)
      .style("opacity", (l) => {
        const s = typeof l.source === "string" ? l.source : l.source.id;
        const t = typeof l.target === "string" ? l.target : l.target.id;
        return activeNodeIds.has(s) && activeNodeIds.has(t) ? 0.7 : 0.06;
      });
  }, [activeNodeIds]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const togglePhysics = () => {
    if (!simulationRef.current) return;
    if (isPhysicsActive) {
      simulationRef.current.stop();
      setIsPhysicsActive(false);
    } else {
      simulationRef.current.alpha(0.3).restart();
      setIsPhysicsActive(true);
    }
  };

  const foundCount = nodes.filter((n) => n.isFound).length;
  const missingCount = nodes.filter((n) => n.isMissing).length;

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col ${
        isFullscreen
          ? "fixed inset-0 z-[150] rounded-none border-none bg-white dark:bg-[#09090b] p-6"
          : className
      }`}
    >
      {/* Graph Header & Interactive Controls */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-[#111116] relative z-20">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white tracking-tight">
              Skill Network Graph
            </h3>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              · Force-Directed Ecosystem Map
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Interconnected technology clusters and priority ATS requirement bridges
          </p>
        </div>

        {/* Global Filter Controls & Canvas Actions */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterType(filterType === "found" ? "all" : "found")}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-semibold whitespace-nowrap shrink-0 ${
              filterType === "found"
                ? "bg-violet-700 text-white border-violet-700"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-violet-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span>{foundCount} Matched</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType(filterType === "missing" ? "all" : "missing")}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-semibold whitespace-nowrap shrink-0 ${
              filterType === "missing"
                ? "bg-rose-700 text-white border-rose-700"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-rose-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{missingCount} Gaps</span>
          </button>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => handleZoom(1.2)}
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(0.8)}
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={togglePhysics}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isPhysicsActive
                  ? "text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/60"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
              title={isPhysicsActive ? "Pause Physics" : "Resume Physics"}
            >
              {isPhysicsActive ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Explorer"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter & Search Bar */}
      <div className="px-4 py-2.5 bg-zinc-50/70 dark:bg-[#09090b] border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 text-xs relative z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === "all"
                ? "bg-zinc-950 dark:bg-violet-700 text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
            }`}
          >
            All Domains ({nodes.filter((n) => !n.isCategoryHub).length})
          </button>

          {(Object.keys(CATEGORY_CONFIG) as SkillCategory[]).map((cat) => {
            const count = categoryCounts[cat];
            if (count === 0) return null;
            const cfg = CATEGORY_CONFIG[cat];
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? "all" : cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? "bg-violet-700 text-white border-violet-700"
                    : "bg-transparent border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? "#ffffff" : cfg.color }}
                />
                <span>{cfg.label}</span>
                <span className="text-[11px] opacity-75 font-mono tabular-nums">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[180px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search technology..."
            className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-violet-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* SVG Force Canvas */}
      <div className="relative flex-1 w-full overflow-hidden bg-zinc-50 dark:bg-[#09090b]">
        <svg
          ref={svgRef}
          className="w-full h-full block"
          style={{ minHeight: isFullscreen ? "calc(100vh - 200px)" : `${height}px` }}
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-white/95 dark:bg-[#111116]/95 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 pointer-events-none space-y-1.5 shadow-md hidden md:block">
          <div className="text-[11px] font-bold text-zinc-950 dark:text-white">
            Network Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-100 dark:bg-violet-950 border-2 border-violet-600 dark:border-purple-400 inline-block" />
            <span>Matched Technology</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-100 dark:bg-rose-950 border-2 border-rose-600 dark:border-rose-400 border-dashed inline-block" />
            <span>Missing ATS Requirement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-zinc-950 border-2 border-violet-500 inline-block" />
            <span>Domain Cluster Hub</span>
          </div>
          <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
            Drag nodes to explore · Scroll to zoom
          </div>
        </div>

        {/* Hover Tooltip */}
        {tooltipData && !selectedNode && (
          <div
            style={{
              position: "absolute",
              left: `${tooltipData.x + 15}px`,
              top: `${tooltipData.y - 15}px`,
              pointerEvents: "none",
            }}
            className="z-40 p-3 rounded-xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-700 shadow-lg text-zinc-950 dark:text-white max-w-xs"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  tooltipData.node.isMissing
                    ? "bg-rose-600"
                    : tooltipData.node.isCategoryHub
                    ? "bg-zinc-950 dark:bg-white"
                    : "bg-violet-600"
                }`}
              />
              <span className="font-bold text-xs">{tooltipData.node.name}</span>
            </div>
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
              {tooltipData.node.isCategoryHub ? (
                <span>
                  Domain Hub · {tooltipData.node.connections.length} Technologies
                </span>
              ) : (
                <>
                  <span className="text-violet-700 dark:text-violet-300 font-semibold">
                    {tooltipData.node.categoryLabel}
                  </span>{" "}
                  ·{" "}
                  <span
                    className={
                      tooltipData.node.isMissing
                        ? "text-rose-700 dark:text-rose-400 font-bold"
                        : "text-violet-700 dark:text-purple-300 font-bold"
                    }
                  >
                    {tooltipData.node.isMissing
                      ? "Missing ATS Requirement"
                      : "Verified Match"}
                  </span>
                </>
              )}
            </div>
            {tooltipData.node.connections.length > 0 &&
              !tooltipData.node.isCategoryHub && (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                  Connected to{" "}
                  {
                    tooltipData.node.connections.filter(
                      (c) => !c.startsWith("hub-")
                    ).length
                  }{" "}
                  technologies
                </div>
              )}
          </div>
        )}

        {/* Inspector Slide-Out Drawer */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute top-4 right-4 bottom-4 w-80 max-w-[calc(100%-2rem)] bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4 flex flex-col justify-between z-30 overflow-y-auto"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 block mb-0.5">
                      {selectedNode.categoryLabel}
                    </span>
                    <h4 className="text-base font-bold text-zinc-950 dark:text-white">
                      {selectedNode.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedNode(null)}
                    className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Match Status Banner */}
                <div
                  className={`p-3 rounded-xl border mb-3 text-xs ${
                    selectedNode.isMissing
                      ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-950 dark:text-rose-200"
                      : "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50 text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {selectedNode.isMissing ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>ATS Priority Gap</span>
                      </>
                    ) : selectedNode.isCategoryHub ? (
                      <>
                        <Layers className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                        <span>Ecosystem Core Hub</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                        <span>Verified in Candidate Profile</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {selectedNode.isMissing
                      ? selectedNode.description ||
                        "This skill is expected by ATS filters for your target role. Adding it bridges your current stack."
                      : selectedNode.isCategoryHub
                      ? CATEGORY_CONFIG[selectedNode.category]?.description
                      : "Demonstrated competency detected in resume content and cross-referenced with target role requirements."}
                  </p>
                </div>

                {/* Direct Connections */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                    Connected Ecosystem Technologies
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedNode.connections
                      .filter((c) => !c.startsWith("hub-"))
                      .map((connId) => {
                        const targetNode = nodes.find((n) => n.id === connId);
                        if (!targetNode) return null;
                        return (
                          <button
                            key={connId}
                            type="button"
                            onClick={() => setSelectedNode(targetNode)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                              targetNode.isMissing
                                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300"
                                : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-violet-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                targetNode.isMissing
                                  ? "bg-rose-500"
                                  : "bg-violet-600 dark:bg-purple-400"
                              }`}
                            />
                            <span>{targetNode.name}</span>
                          </button>
                        );
                      })}
                    {selectedNode.connections.filter((c) => !c.startsWith("hub-"))
                      .length === 0 && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                        No direct inter-technology links
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                {selectedNode.isMissing && onSkillClick ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSkillClick(selectedNode.name);
                      setSelectedNode(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add to Resume Builder</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedNode(null)}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold text-xs transition-colors cursor-pointer text-center"
                  >
                    Close Inspector
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import {
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  X,
  Play,
  Pause,
  PlusCircle,
  ExternalLink,
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
  // D3 simulation coordinates
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

// Category metadata & styling
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
    color: "#38bdf8", // Sky blue
    glowColor: "rgba(56, 189, 248, 0.4)",
    hubRadius: 28,
    description: "Cloud platforms, container orchestration & scalable infrastructure",
  },
  backend: {
    label: "Backend & Systems",
    color: "#2dd4bf", // Teal
    glowColor: "rgba(45, 212, 191, 0.4)",
    hubRadius: 28,
    description: "Server runtimes, APIs, microservices & backend frameworks",
  },
  frontend: {
    label: "Frontend & UI",
    color: "#a855f7", // Purple
    glowColor: "rgba(168, 85, 247, 0.4)",
    hubRadius: 28,
    description: "Client architecture, reactive UI, state & performance",
  },
  "data-ai": {
    label: "Data, Databases & AI",
    color: "#f59e0b", // Amber
    glowColor: "rgba(245, 158, 11, 0.4)",
    hubRadius: 28,
    description: "Relational/NoSQL databases, messaging, pipelines & ML/AI",
  },
  architecture: {
    label: "Systems Architecture",
    color: "#6366f1", // Indigo
    glowColor: "rgba(99, 102, 241, 0.4)",
    hubRadius: 26,
    description: "Distributed systems, design patterns, high-throughput & reliability",
  },
  leadership: {
    label: "Leadership & Strategy",
    color: "#10b981", // Emerald
    glowColor: "rgba(16, 185, 129, 0.4)",
    hubRadius: 26,
    description: "Executive engineering stewardship, team mentorship & roadmap",
  },
  general: {
    label: "Core Competencies",
    color: "#94a3b8", // Slate
    glowColor: "rgba(148, 163, 184, 0.3)",
    hubRadius: 24,
    description: "Foundational software engineering methodologies",
  },
};

// Known relationship matrix between popular technologies
const TECH_RELATIONSHIPS: Array<[string, string, string]> = [
  // Cloud & Infra
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

  // Backend & Systems
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

  // Frontend & UI
  ["TypeScript", "React", "Typed Components"],
  ["React", "Next.js", "Full-Stack React"],
  ["React", "Tailwind", "Design Systems"],
  ["React", "Redux", "Global State"],
  ["React", "GraphQL", "Data Querying"],
  ["TypeScript", "Node.js", "Full-Stack TS"],
  ["UI/UX", "React", "Component Systems"],

  // Data, Databases & AI
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

  // Leadership & Practices
  ["Agile/Scrum", "Team Stewardship", "Sprint Cadence"],
  ["Technical Strategy", "System Design", "Architecture Roadmap"],
  ["Mentorship", "Team Stewardship", "Engineering Culture"],
  ["Cross-Functional Leadership", "Technical Strategy", "Stakeholder Alignment"],
  ["Budget Management", "Technical Strategy", "Resource Allocation"],
];

// Helper to determine category based on skill keyword
function classifySkill(name: string): SkillCategory {
  const lower = name.toLowerCase();

  // Cloud & Infra
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

  // Frontend
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

  // Data & AI
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

  // Architecture & Systems
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

  // Leadership & Strategy
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

  // Backend languages
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
  standalone = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter & Search States
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "found" | "missing">("all");
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);
  const [isPhysicsActive, setIsPhysicsActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    node: SkillNode;
    x: number;
    y: number;
  } | null>(null);

  // Build Graph Nodes & Edges
  const { nodes, links, categoryCounts } = useMemo(() => {
    const rawNodesMap = new Map<string, SkillNode>();
    const nodeIds = new Set<string>();

    const safeFound = Array.from(new Set(foundSkills.filter(Boolean)));
    const safeMissing = Array.from(new Set(missingSkills.filter(Boolean)));

    // Categorization counts
    const counts: Record<SkillCategory, number> = {
      "cloud-infra": 0,
      backend: 0,
      frontend: 0,
      "data-ai": 0,
      architecture: 0,
      leadership: 0,
      general: 0,
    };

    // 1. Add Found Skill Nodes
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

    // 2. Add Missing Skill Nodes
    safeMissing.forEach((name) => {
      const id = name.trim();
      if (nodeIds.has(id)) return;
      nodeIds.add(id);

      const category = classifySkill(name);
      counts[category]++;

      // Determine importance from report
      const rep = skillGapReport.find((r) => r.skill.toLowerCase() === name.toLowerCase());
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

    // 3. Add Category Hub Nodes for represented categories
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

      // Track bidirectional connections
      rawNodesMap.get(sourceId)?.connections.push(targetId);
      rawNodesMap.get(targetId)?.connections.push(sourceId);
    };

    // 4. Connect Member Skills to their Category Hub
    rawNodesMap.forEach((node) => {
      if (!node.isCategoryHub) {
        const hubId = `hub-${node.category}`;
        addLink(hubId, node.id, 1, "category");
      }
    });

    // 5. Connect Semantic Inter-Technology Relationships
    TECH_RELATIONSHIPS.forEach(([techA, techB, relLabel]) => {
      // Find matching nodes in graph (fuzzy or exact)
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

    // 6. Connect Hub-to-Hub Bridges
    const hubs = Array.from(rawNodesMap.values()).filter((n) => n.isCategoryHub);
    for (let i = 0; i < hubs.length; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        // Connect related domains
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

    const nodesList = Array.from(rawNodesMap.values());
    return {
      nodes: nodesList,
      links: linksList,
      categoryCounts: counts,
    };
  }, [foundSkills, missingSkills, skillGapReport]);

  // Filtered nodes and links for display / rendering
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();

    nodes.forEach((n) => {
      if (n.isCategoryHub) {
        if (selectedCategory === "all" || n.category === selectedCategory) {
          ids.add(n.id);
        }
        return;
      }

      // Category check
      if (selectedCategory !== "all" && n.category !== selectedCategory) {
        return;
      }

      // Type check
      if (filterType === "found" && !n.isFound) return;
      if (filterType === "missing" && !n.isMissing) return;

      // Search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!n.name.toLowerCase().includes(q)) return;
      }

      ids.add(n.id);
    });

    return ids;
  }, [nodes, selectedCategory, filterType, searchQuery]);

  // D3 Simulation & SVG Rendering
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

    // Defs: Gradients, Filters & Arrow Markers
    const defs = svg.append("defs");

    // Glow Filter
    const filter = defs
      .append("filter")
      .attr("id", "node-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Intense Glow for selected / hub
    const intenseFilter = defs
      .append("filter")
      .attr("id", "intense-glow")
      .attr("x", "-70%")
      .attr("y", "-70%")
      .attr("width", "240%")
      .attr("height", "240%");
    intenseFilter.append("feGaussianBlur").attr("stdDeviation", "8").attr("result", "coloredBlur");
    const feMerge2 = intenseFilter.append("feMerge");
    feMerge2.append("feMergeNode").attr("in", "coloredBlur");
    feMerge2.append("feMergeNode").attr("in", "SourceGraphic");

    // Root Group with Zoom Support
    const g = svg.append("g").attr("class", "graph-root");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Simulation Setup
    // Deep clone to allow safe D3 node mutation
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

    // Render Links
    const linkGroup = g.append("g").attr("class", "links-layer");

    const link = linkGroup
      .selectAll<SVGLineElement, SkillLink>("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", (d) => {
        if (d.type === "gap-bridge") return "#fb923c"; // Amber
        if (d.type === "category") return "rgba(148, 163, 184, 0.2)";
        return "rgba(45, 212, 191, 0.35)"; // Teal
      })
      .attr("stroke-width", (d) => (d.type === "gap-bridge" ? 2 : d.type === "category" ? 1.2 : 1.8))
      .attr("stroke-dasharray", (d) => (d.type === "gap-bridge" ? "4,4" : "none"))
      .attr("stroke-opacity", 0.65)
      .attr("class", "transition-all duration-200");

    // Render Nodes Group
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

    // Node Outer Glow / Halo for Hubs and Missing gaps
    node
      .filter((d) => d.isCategoryHub || d.isMissing)
      .append("circle")
      .attr("r", (d) => d.radius + 6)
      .attr("fill", "none")
      .attr("stroke", (d) =>
        d.isMissing ? "#f97316" : CATEGORY_CONFIG[d.category]?.color || "#38bdf8"
      )
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.45)
      .attr("stroke-dasharray", (d) => (d.isMissing ? "3,3" : "none"));

    // Main Node Circle
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        if (d.isCategoryHub) {
          return "#0f172a"; // Deep slate hub
        }
        if (d.isMissing) {
          return "#451a03"; // Dark amber for missing gap
        }
        return "#064e3b"; // Deep emerald for found skill
      })
      .attr("stroke", (d) => {
        if (d.isCategoryHub) {
          return CATEGORY_CONFIG[d.category]?.color || "#38bdf8";
        }
        if (d.isMissing) {
          return "#f97316"; // Bright orange/amber
        }
        return "#34d399"; // Bright emerald
      })
      .attr("stroke-width", (d) => (d.isCategoryHub ? 2.5 : d.isMissing ? 2 : 1.8))
      .attr("filter", "url(#node-glow)");

    // Center icon/pip
    node
      .append("circle")
      .attr("r", (d) => (d.isCategoryHub ? 5 : d.isMissing ? 3.5 : 3))
      .attr("fill", (d) => {
        if (d.isCategoryHub) return CATEGORY_CONFIG[d.category]?.color || "#38bdf8";
        if (d.isMissing) return "#fb923c";
        return "#6ee7b7";
      });

    // Node Labels
    const labels = node
      .append("text")
      .attr("dy", (d) => (d.isCategoryHub ? d.radius + 14 : d.radius + 12))
      .attr("text-anchor", "middle")
      .text((d) => d.name)
      .attr("fill", (d) => (d.isMissing ? "#fdba74" : d.isCategoryHub ? "#f1f5f9" : "#e2e8f0"))
      .attr("font-size", (d) => (d.isCategoryHub ? "11px" : "9.5px"))
      .attr("font-weight", (d) => (d.isCategoryHub ? "800" : "600"))
      .attr("letter-spacing", (d) => (d.isCategoryHub ? "0.05em" : "normal"))
      .style("text-shadow", "0 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8)")
      .style("pointer-events", "none");

    // Interaction Events
    node
      .on("mouseenter", (event, d) => {
        setHoveredNode(d);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipData({
            node: d,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }

        // Highlight connected nodes and links
        const connectedIds = new Set(d.connections);
        connectedIds.add(d.id);

        node.attr("opacity", (n) => (connectedIds.has(n.id) ? 1 : 0.18));
        link.attr("stroke-opacity", (l) => {
          const s = (l.source as SkillNode).id;
          const t = (l.target as SkillNode).id;
          return s === d.id || t === d.id ? 1 : 0.08;
        });
        link.attr("stroke-width", (l) => {
          const s = (l.source as SkillNode).id;
          const t = (l.target as SkillNode).id;
          return s === d.id || t === d.id ? 3 : 1;
        });
      })
      .on("mousemove", (event) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && tooltipData) {
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
        setHoveredNode(null);
        setTooltipData(null);
        node.attr("opacity", 1);
        link.attr("stroke-opacity", 0.65).attr("stroke-width", (d) =>
          d.type === "gap-bridge" ? 2 : d.type === "category" ? 1.2 : 1.8
        );
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // Clicking background deselects
    svg.on("click", () => {
      setSelectedNode(null);
    });

    // Ticking
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
  }, [nodes, links, height, isFullscreen]);

  // Handle active filter updates without rebuilding entire graph
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg
      .selectAll<SVGGElement, SkillNode>(".nodes-layer g")
      .transition()
      .duration(250)
      .style("opacity", (d) => {
        if (activeNodeIds.size === 0) return 1;
        return activeNodeIds.has(d.id) ? 1 : 0.12;
      });

    svg
      .selectAll<SVGLineElement, SkillLink>(".links-layer line")
      .transition()
      .duration(250)
      .style("opacity", (l) => {
        const s = typeof l.source === "string" ? l.source : l.source.id;
        const t = typeof l.target === "string" ? l.target : l.target.id;
        return activeNodeIds.has(s) && activeNodeIds.has(t) ? 0.7 : 0.05;
      });
  }, [activeNodeIds]);

  // Zoom Controls
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
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
      className={`relative rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl overflow-hidden flex flex-col ${
        isFullscreen
          ? "fixed inset-0 z-[150] rounded-none border-none bg-slate-950 p-6"
          : className
      }`}
    >
      {/* Graph Header & Interactive Controls */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md relative z-20">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <span>D3 Skill Network Graph</span>
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Force-Directed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive ecosystem map showing interconnected technology clusters and priority gaps
          </p>
        </div>

        {/* Global Stats Counter */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterType(filterType === "found" ? "all" : "found")}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
              filterType === "found"
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40"
                : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{foundCount} Matched</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType(filterType === "missing" ? "all" : "missing")}
            className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
              filterType === "missing"
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/40"
                : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{missingCount} Gaps</span>
          </button>

          <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* Canvas View Actions */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => handleZoom(1.2)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(0.8)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={togglePhysics}
              className={`p-1.5 rounded-lg transition-colors ${
                isPhysicsActive
                  ? "text-teal-400 hover:bg-teal-500/20"
                  : "text-amber-400 hover:bg-amber-500/20"
              }`}
              title={isPhysicsActive ? "Pause Physics Simulation" : "Resume Physics Simulation"}
            >
              {isPhysicsActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Graph Explorer"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2.5 text-xs relative z-20">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === "all"
                ? "bg-white/15 text-white border border-white/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            All Domains ({nodes.length - Object.keys(categoryCounts).length})
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
                style={{
                  backgroundColor: isSelected ? `${cfg.color}25` : undefined,
                  border: isSelected ? `1px solid ${cfg.color}60` : "1px solid transparent",
                  color: isSelected ? cfg.color : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-70 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[180px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search technology..."
            className="w-full pl-8 pr-7 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* SVG Force Canvas */}
      <div className="relative flex-1 w-full overflow-hidden bg-radial from-slate-900/60 via-slate-950 to-slate-950">
        <svg
          ref={svgRef}
          className="w-full h-full block"
          style={{ minHeight: isFullscreen ? "calc(100vh - 200px)" : `${height}px` }}
        />

        {/* Legend Overlay at Bottom-Left */}
        <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 pointer-events-none space-y-1.5 shadow-xl hidden md:block">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Network Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500/20 border-2 border-emerald-400 inline-block" />
            <span>Matched Technology in Resume</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500/20 border-2 border-amber-400 border-dashed inline-block" />
            <span>Missing ATS Target Requirement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-800 border-2 border-sky-400 inline-block" />
            <span>Domain Cluster Hub</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-[10px] text-slate-400">
            <span>• Drag nodes to explore • Scroll to zoom</span>
          </div>
        </div>

        {/* Floating Tooltip */}
        {tooltipData && !selectedNode && (
          <div
            style={{
              position: "absolute",
              left: `${tooltipData.x + 15}px`,
              top: `${tooltipData.y - 15}px`,
              pointerEvents: "none",
            }}
            className="z-40 p-3 rounded-xl bg-slate-900/95 border border-white/15 shadow-2xl text-white max-w-xs backdrop-blur-md"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  tooltipData.node.isMissing
                    ? "bg-amber-400"
                    : tooltipData.node.isCategoryHub
                    ? "bg-sky-400"
                    : "bg-emerald-400"
                }`}
              />
              <span className="font-bold text-xs">{tooltipData.node.name}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {tooltipData.node.isCategoryHub ? (
                <span>Domain Hub · {tooltipData.node.connections.length} Technologies</span>
              ) : (
                <>
                  <span className="text-teal-300 font-medium">
                    {tooltipData.node.categoryLabel}
                  </span>{" "}
                  ·{" "}
                  <span
                    className={
                      tooltipData.node.isMissing ? "text-amber-300 font-bold" : "text-emerald-300 font-bold"
                    }
                  >
                    {tooltipData.node.isMissing ? "Missing ATS Requirement" : "Verified Match"}
                  </span>
                </>
              )}
            </div>
            {tooltipData.node.connections.length > 0 && !tooltipData.node.isCategoryHub && (
              <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-white/10">
                Connected to {tooltipData.node.connections.filter((c) => !c.startsWith("hub-")).length} technologies
              </div>
            )}
          </div>
        )}

        {/* Inspector Slide-Out Drawer when Node is Clicked */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute top-4 right-4 bottom-4 w-80 max-w-[calc(100%-2rem)] bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl p-4 flex flex-col justify-between z-30 overflow-y-auto"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span
                      className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block mb-1"
                      style={{
                        backgroundColor: `${CATEGORY_CONFIG[selectedNode.category]?.color}25`,
                        color: CATEGORY_CONFIG[selectedNode.category]?.color,
                      }}
                    >
                      {selectedNode.categoryLabel}
                    </span>
                    <h4 className="text-base font-black text-white">{selectedNode.name}</h4>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Match Status Banner */}
                <div
                  className={`p-3 rounded-xl border mb-3 text-xs ${
                    selectedNode.isMissing
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      : selectedNode.isCategoryHub
                      ? "bg-sky-500/10 border-sky-500/30 text-sky-200"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    {selectedNode.isMissing ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>ATS Priority Gap</span>
                      </>
                    ) : selectedNode.isCategoryHub ? (
                      <>
                        <Layers className="w-3.5 h-3.5 text-sky-400" />
                        <span>Ecosystem Core Hub</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified in Candidate Profile</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedNode.isMissing
                      ? selectedNode.description ||
                        "This skill is expected by ATS filters for your target role. Adding it bridges your current tech stack."
                      : selectedNode.isCategoryHub
                      ? CATEGORY_CONFIG[selectedNode.category]?.description
                      : "Demonstrated competency detected in resume content and cross-referenced with target role requirements."}
                  </p>
                </div>

                {/* Direct Connections / Related Skills */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                            onClick={() => setSelectedNode(targetNode)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                              targetNode.isMissing
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                                : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                targetNode.isMissing ? "bg-amber-400" : "bg-teal-400"
                              }`}
                            />
                            <span>{targetNode.name}</span>
                          </button>
                        );
                      })}
                    {selectedNode.connections.filter((c) => !c.startsWith("hub-")).length === 0 && (
                      <span className="text-xs text-slate-500 italic">
                        No direct inter-technology links
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button at bottom */}
              <div className="pt-3 border-t border-white/10">
                {selectedNode.isMissing && onSkillClick ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSkillClick(selectedNode.name);
                      setSelectedNode(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add to Resume Builder</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedNode(null)}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer text-center"
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

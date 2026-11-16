import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Building2,
  Share2,
  ArrowRight,
  Flame,
  Award,
  Briefcase,
  Layers,
  X,
  Play,
  Pause,
  Send,
  UserCheck,
} from "lucide-react";

export type CircleCategory =
  | "faang"
  | "scaleup"
  | "vc-exec"
  | "architecture"
  | "alumni";

export interface ContactNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  role: string;
  company: string;
  circle: CircleCategory;
  circleLabel: string;
  degree: "1st" | "2nd" | "3rd";
  isCandidate?: boolean;
  isCircleHub?: boolean;
  referralScore: number; // 0 - 100
  hiringStatus: string;
  mutualContacts: string[];
  warmIntroVia?: string;
  suggestedNote: string;
  avatarColor: string;
  radius: number;
  connections: string[];
  // D3 coordinates
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface NetworkLink extends d3.SimulationLinkDatum<ContactNode> {
  source: string | ContactNode;
  target: string | ContactNode;
  value: number;
  type: "candidate-circle" | "circle-contact" | "mutual-referral";
  label?: string;
}

export const CIRCLE_CONFIG: Record<
  CircleCategory,
  {
    label: string;
    color: string;
    glowColor: string;
    description: string;
  }
> = {
  faang: {
    label: "FAANG & Enterprise Tech",
    color: "#38bdf8", // Sky blue
    glowColor: "rgba(56, 189, 248, 0.4)",
    description: "Senior leaders & hiring managers at Google, AWS, Meta, Apple & Microsoft",
  },
  scaleup: {
    label: "High-Growth Scaleups",
    color: "#a855f7", // Purple
    glowColor: "rgba(168, 85, 247, 0.4)",
    description: "Engineering heads & staff architects at Stripe, Databricks, OpenAI & Vercel",
  },
  "vc-exec": {
    label: "VC & Executive Search",
    color: "#f59e0b", // Amber / Gold
    glowColor: "rgba(245, 158, 11, 0.4)",
    description: "Partners, talent partners & executive recruiters at Tier 1 funds",
  },
  architecture: {
    label: "Domain Architecture Peers",
    color: "#2dd4bf", // Teal
    glowColor: "rgba(45, 212, 191, 0.4)",
    description: "Staff & Principal engineers who can champion technical evaluations",
  },
  alumni: {
    label: "Shared Engineering Alumni",
    color: "#f43f5e", // Rose
    glowColor: "rgba(244, 63, 94, 0.4)",
    description: "Former colleagues & verified university network with direct affinity",
  },
};

// Curated high-impact industry contacts representing warm professional referral circles
const MOCK_INDUSTRY_CONTACTS = [
  {
    id: "contact-1",
    name: "Sarah Chen",
    role: "VP of Engineering",
    company: "Databricks",
    circle: "scaleup" as CircleCategory,
    degree: "1st" as const,
    referralScore: 98,
    hiringStatus: "Actively hiring Staff & Director roles",
    mutualContacts: ["David Rodriguez", "Elena Rostova", "Marcus Vance"],
    warmIntroVia: "Direct 1st-degree connection",
    suggestedNote:
      "Hi Sarah, great seeing Databricks' recent scaling milestones. I'm currently exploring executive systems leadership roles that match my distributed systems background. Would love to catch up briefly if your teams have an opening.",
    avatarColor: "#8b5cf6",
  },
  {
    id: "contact-2",
    name: "David Rodriguez",
    role: "Director of Cloud Infrastructure",
    company: "Google Cloud",
    circle: "faang" as CircleCategory,
    degree: "1st" as const,
    referralScore: 96,
    hiringStatus: "Building out multi-region cloud platform team",
    mutualContacts: ["Sarah Chen", "Liam O'Connor"],
    warmIntroVia: "Direct 1st-degree connection",
    suggestedNote:
      "Hey David, hope all is well! I noticed your group at GCP is expanding cloud reliability infrastructure. Given my recent architecture focus, I'd appreciate 10 minutes to learn about priority initiatives on your radar.",
    avatarColor: "#0284c7",
  },
  {
    id: "contact-3",
    name: "Priya Sharma",
    role: "Head of Technical Talent",
    company: "OpenAI",
    circle: "scaleup" as CircleCategory,
    degree: "2nd" as const,
    referralScore: 97,
    hiringStatus: "Sourcing for high-throughput AI infra roles",
    mutualContacts: ["Sarah Chen", "Elena Rostova"],
    warmIntroVia: "Warm intro via Sarah Chen (VP of Engineering)",
    suggestedNote:
      "Hi Priya, Sarah Chen recommended I connect with you regarding OpenAI's infrastructure team growth. I have 8+ years leading distributed systems and would love to discuss alignment with current open mandates.",
    avatarColor: "#10b981",
  },
  {
    id: "contact-4",
    name: "Marcus Vance",
    role: "Staff Software Architect",
    company: "Stripe",
    circle: "scaleup" as CircleCategory,
    degree: "1st" as const,
    referralScore: 94,
    hiringStatus: "Expanding core payments latency team",
    mutualContacts: ["Sarah Chen", "Aria Patel"],
    warmIntroVia: "Direct 1st-degree connection",
    suggestedNote:
      "Hi Marcus, following Stripe's latest architecture articles with great interest. I'm exploring staff/principal systems opportunities and would love your perspective on the current engineering culture.",
    avatarColor: "#6366f1",
  },
  {
    id: "contact-5",
    name: "Elena Rostova",
    role: "Partner, Talent Network",
    company: "Sequoia Capital",
    circle: "vc-exec" as CircleCategory,
    degree: "2nd" as const,
    referralScore: 95,
    hiringStatus: "Placing VP & Head of Eng in Series B/C portfolio companies",
    mutualContacts: ["David Rodriguez", "Sarah Chen"],
    warmIntroVia: "Warm intro via David Rodriguez (Google Cloud)",
    suggestedNote:
      "Dear Elena, David Rodriguez suggested we connect. I'm evaluating executive technology mandates across Sequoia's enterprise portfolio and would welcome sharing my verified profile dossier.",
    avatarColor: "#f59e0b",
  },
  {
    id: "contact-6",
    name: "Liam O'Connor",
    role: "Principal Tech Recruiter",
    company: "Amazon Web Services",
    circle: "faang" as CircleCategory,
    degree: "1st" as const,
    referralScore: 90,
    hiringStatus: "Hiring for AWS Cloud Platform & Kubernetes infra",
    mutualContacts: ["David Rodriguez"],
    warmIntroVia: "Direct 1st-degree connection",
    suggestedNote:
      "Hi Liam, reaching out as I've recently benchmarked my profile for principal cloud architecture roles. Happy to send over my executive ATS dossier if you have matching mandates.",
    avatarColor: "#0ea5e9",
  },
  {
    id: "contact-7",
    name: "Aria Patel",
    role: "Senior Engineering Manager",
    company: "Meta",
    circle: "faang" as CircleCategory,
    degree: "2nd" as const,
    referralScore: 92,
    hiringStatus: "Growing infrastructure & developer tooling teams",
    mutualContacts: ["Marcus Vance", "Kenji Takahashi"],
    warmIntroVia: "Warm intro via Marcus Vance (Staff Architect)",
    suggestedNote:
      "Hi Aria, Marcus Vance mentioned your team is tackling high-concurrency infrastructure at Meta. I'd love to connect and hear about your team's roadmap.",
    avatarColor: "#3b82f6",
  },
  {
    id: "contact-8",
    name: "Kenji Takahashi",
    role: "Principal Systems Architect",
    company: "Vercel",
    circle: "architecture" as CircleCategory,
    degree: "1st" as const,
    referralScore: 93,
    hiringStatus: "Reviewing candidates for Edge Runtime team",
    mutualContacts: ["Aria Patel", "Marcus Vance"],
    warmIntroVia: "Direct 1st-degree connection",
    suggestedNote:
      "Hey Kenji, loving the work Vercel is doing on edge streaming. Reaching out to exchange notes on distributed runtime performance and explore potential synergy with your org.",
    avatarColor: "#14b8a6",
  },
  {
    id: "contact-9",
    name: "Chloe Dubois",
    role: "Director of Engineering",
    company: "Snowflake",
    circle: "scaleup" as CircleCategory,
    degree: "2nd" as const,
    referralScore: 89,
    hiringStatus: "Hiring distributed query engine leads",
    mutualContacts: ["Sarah Chen"],
    warmIntroVia: "Warm intro via Sarah Chen",
    suggestedNote:
      "Hi Chloe, Sarah Chen mentioned Snowflake is expanding distributed systems leadership. I've spent the last several years architecting high-throughput data backends and would love to connect.",
    avatarColor: "#06b6d4",
  },
  {
    id: "contact-10",
    name: "Sofia Alvarez",
    role: "Head of People & Talent",
    company: "Anthropic",
    circle: "scaleup" as CircleCategory,
    degree: "2nd" as const,
    referralScore: 97,
    hiringStatus: "Priority hiring for AI Safety & Infrastructure engineers",
    mutualContacts: ["Sarah Chen", "Elena Rostova"],
    warmIntroVia: "Warm intro via Elena Rostova (Sequoia)",
    suggestedNote:
      "Dear Sofia, Elena Rostova kindly connected us. I've been following Anthropic's mission and would be thrilled to discuss how my systems engineering leadership aligns with current team needs.",
    avatarColor: "#ec4899",
  },
  {
    id: "contact-11",
    name: "Jessica Wu",
    role: "Engineering Alumni Director",
    company: "Stanford / Tech Alumni",
    circle: "alumni" as CircleCategory,
    degree: "1st" as const,
    referralScore: 91,
    hiringStatus: "Curating private referral network for startup founders",
    mutualContacts: ["David Rodriguez", "Sarah Chen"],
    warmIntroVia: "Direct 1st-degree connection",
    suggestedNote:
      "Hi Jessica, hope all is well! Reaching out to the alumni network as I'm evaluating senior technology executive opportunities. Would welcome any leads or referrals within the alumni ecosystem.",
    avatarColor: "#f43f5e",
  },
];

export interface LinkedInConnectionNetworkProps {
  candidateName?: string;
  targetRole?: string;
  linkedinUrl?: string;
  trustScore?: number | null;
  className?: string;
  height?: number;
  onOpenLinkedInModal?: () => void;
}

export const LinkedInConnectionNetwork: React.FC<LinkedInConnectionNetworkProps> = ({
  candidateName = "Alex Mercer",
  targetRole = "Senior Technology Leader",
  linkedinUrl = "",
  trustScore = 88,
  className = "",
  height = 540,
  onOpenLinkedInModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter & Search states
  const [selectedCircle, setSelectedCircle] = useState<CircleCategory | "all">("all");
  const [degreeFilter, setDegreeFilter] = useState<"all" | "1st" | "2nd">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactNode | null>(null);
  const [hoveredContact, setHoveredContact] = useState<ContactNode | null>(null);
  const [isPhysicsActive, setIsPhysicsActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    contact: ContactNode;
    x: number;
    y: number;
  } | null>(null);

  // Build Graph Nodes & Links
  const { nodes, links, circleCounts } = useMemo(() => {
    const rawNodesMap = new Map<string, ContactNode>();
    const linksList: NetworkLink[] = [];
    const linkKeys = new Set<string>();

    const counts: Record<CircleCategory, number> = {
      faang: 0,
      scaleup: 0,
      "vc-exec": 0,
      architecture: 0,
      alumni: 0,
    };

    // 1. Candidate Center Node
    const candidateId = "candidate-center";
    rawNodesMap.set(candidateId, {
      id: candidateId,
      name: candidateName,
      role: targetRole,
      company: "Your Profile (Candidate)",
      circle: "architecture",
      circleLabel: "You (Candidate)",
      degree: "1st",
      isCandidate: true,
      referralScore: trustScore || 88,
      hiringStatus: "Seeking Executive Mandate",
      mutualContacts: [],
      suggestedNote: "",
      avatarColor: "#14b8a6",
      radius: 30,
      connections: [],
    });

    // 2. Add Circle Hub Nodes
    (Object.keys(CIRCLE_CONFIG) as CircleCategory[]).forEach((cat) => {
      const hubId = `circle-hub-${cat}`;
      rawNodesMap.set(hubId, {
        id: hubId,
        name: CIRCLE_CONFIG[cat].label,
        role: "Professional Circle",
        company: CIRCLE_CONFIG[cat].description,
        circle: cat,
        circleLabel: CIRCLE_CONFIG[cat].label,
        degree: "1st",
        isCircleHub: true,
        referralScore: 90,
        hiringStatus: CIRCLE_CONFIG[cat].description,
        mutualContacts: [],
        suggestedNote: "",
        avatarColor: CIRCLE_CONFIG[cat].color,
        radius: 24,
        connections: [],
      });

      // Connect Candidate to Circle Hub
      linksList.push({
        source: candidateId,
        target: hubId,
        value: 3,
        type: "candidate-circle",
      });
      linkKeys.add(`${candidateId}___${hubId}`);
    });

    // 3. Add Industry Contacts
    MOCK_INDUSTRY_CONTACTS.forEach((c) => {
      counts[c.circle]++;
      const hubId = `circle-hub-${c.circle}`;

      rawNodesMap.set(c.id, {
        ...c,
        circleLabel: CIRCLE_CONFIG[c.circle].label,
        radius: c.degree === "1st" ? 17 : 14,
        connections: [],
      });

      // Connect Contact to its Circle Hub
      const linkKey = `${hubId}___${c.id}`;
      linksList.push({
        source: hubId,
        target: c.id,
        value: 2,
        type: "circle-contact",
      });
      linkKeys.add(linkKey);

      // Direct link from candidate to 1st degree
      if (c.degree === "1st") {
        const directKey = `${candidateId}___${c.id}`;
        if (!linkKeys.has(directKey)) {
          linksList.push({
            source: candidateId,
            target: c.id,
            value: 2.5,
            type: "mutual-referral",
            label: "1st Degree Direct",
          });
          linkKeys.add(directKey);
        }
      }
    });

    // 4. Inter-contact mutual links
    MOCK_INDUSTRY_CONTACTS.forEach((contactA) => {
      contactA.mutualContacts.forEach((mutualName) => {
        const contactB = MOCK_INDUSTRY_CONTACTS.find((c) => c.name === mutualName);
        if (contactB && contactA.id !== contactB.id) {
          const k1 = `${contactA.id}___${contactB.id}`;
          const k2 = `${contactB.id}___${contactA.id}`;
          if (!linkKeys.has(k1) && !linkKeys.has(k2)) {
            linksList.push({
              source: contactA.id,
              target: contactB.id,
              value: 1.5,
              type: "mutual-referral",
              label: "Mutual Colleague",
            });
            linkKeys.add(k1);
          }
        }
      });
    });

    // Map connection IDs
    linksList.forEach((l) => {
      const s = typeof l.source === "string" ? l.source : l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target.id;
      rawNodesMap.get(s)?.connections.push(t);
      rawNodesMap.get(t)?.connections.push(s);
    });

    return {
      nodes: Array.from(rawNodesMap.values()),
      links: linksList,
      circleCounts: counts,
    };
  }, [candidateName, targetRole, trustScore]);

  // Active filtered IDs
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    nodes.forEach((n) => {
      if (n.isCandidate) {
        ids.add(n.id);
        return;
      }
      if (n.isCircleHub) {
        if (selectedCircle === "all" || n.circle === selectedCircle) {
          ids.add(n.id);
        }
        return;
      }
      if (selectedCircle !== "all" && n.circle !== selectedCircle) return;
      if (degreeFilter !== "all" && n.degree !== degreeFilter) return;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !n.name.toLowerCase().includes(q) &&
          !n.company.toLowerCase().includes(q) &&
          !n.role.toLowerCase().includes(q)
        ) {
          return;
        }
      }
      ids.add(n.id);
    });
    return ids;
  }, [nodes, selectedCircle, degreeFilter, searchQuery]);

  // D3 Simulation
  const simulationRef = useRef<d3.Simulation<ContactNode, NetworkLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const graphHeight = isFullscreen ? window.innerHeight - 200 : height;

    svg.attr("viewBox", `0 0 ${width} ${graphHeight}`);
    svg.selectAll("*").remove();

    // Defs: Glow Filters
    const defs = svg.append("defs");
    const filter = defs
      .append("filter")
      .attr("id", "net-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Root Group
    const g = svg.append("g").attr("class", "network-root");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Simulation Setup
    const simNodes: ContactNode[] = nodes.map((d) => ({ ...d }));
    const simLinks: NetworkLink[] = links.map((d) => ({ ...d }));

    const simulation = d3
      .forceSimulation<ContactNode, NetworkLink>(simNodes)
      .force(
        "link",
        d3
          .forceLink<ContactNode, NetworkLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => {
            if (d.type === "candidate-circle") return 110;
            if (d.type === "circle-contact") return 75;
            return 85;
          })
          .strength(0.45)
      )
      .force(
        "charge",
        d3
          .forceManyBody<ContactNode>()
          .strength((d) => (d.isCandidate ? -550 : d.isCircleHub ? -380 : -140))
          .distanceMax(380)
      )
      .force("center", d3.forceCenter(width / 2, graphHeight / 2))
      .force(
        "collide",
        d3
          .forceCollide<ContactNode>()
          .radius((d) => d.radius + 15)
          .iterations(2)
      )
      .force("x", d3.forceX(width / 2).strength(0.045))
      .force("y", d3.forceY(graphHeight / 2).strength(0.045));

    simulationRef.current = simulation;

    // Render Links
    const linkGroup = g.append("g").attr("class", "net-links");
    const link = linkGroup
      .selectAll<SVGLineElement, NetworkLink>("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", (d) => {
        if (d.type === "candidate-circle") return "rgba(20, 184, 166, 0.4)";
        if (d.type === "mutual-referral") return "rgba(245, 158, 11, 0.35)";
        return "rgba(148, 163, 184, 0.25)";
      })
      .attr("stroke-width", (d) => (d.type === "candidate-circle" ? 2 : d.type === "mutual-referral" ? 1.8 : 1.2))
      .attr("stroke-dasharray", (d) => (d.type === "mutual-referral" ? "3,3" : "none"))
      .attr("stroke-opacity", 0.65);

    // Render Nodes
    const nodeGroup = g.append("g").attr("class", "net-nodes");
    const node = nodeGroup
      .selectAll<SVGGElement, ContactNode>("g")
      .data(simNodes)
      .join("g")
      .attr("class", "cursor-pointer select-none")
      .call(
        d3
          .drag<SVGGElement, ContactNode>()
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

    // Node Outer Ring
    node
      .append("circle")
      .attr("r", (d) => d.radius + 4)
      .attr("fill", "none")
      .attr("stroke", (d) => {
        if (d.isCandidate) return "#14b8a6";
        if (d.isCircleHub) return CIRCLE_CONFIG[d.circle]?.color || "#38bdf8";
        return d.degree === "1st" ? "#34d399" : "#fbbf24";
      })
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.45)
      .attr("stroke-dasharray", (d) => (d.degree === "2nd" ? "2,2" : "none"));

    // Main Circle
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        if (d.isCandidate) return "#042f2e"; // Deep emerald
        if (d.isCircleHub) return "#0f172a"; // Deep slate
        return "#020617"; // Black-slate
      })
      .attr("stroke", (d) => {
        if (d.isCandidate) return "#2dd4bf";
        if (d.isCircleHub) return CIRCLE_CONFIG[d.circle]?.color || "#38bdf8";
        return d.degree === "1st" ? "#10b981" : "#f59e0b";
      })
      .attr("stroke-width", (d) => (d.isCandidate ? 3 : d.isCircleHub ? 2.2 : 1.8))
      .attr("filter", "url(#net-glow)");

    // Center icon/initials
    node
      .append("text")
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text((d) => {
        if (d.isCandidate) return "YOU";
        if (d.isCircleHub) return "●";
        return d.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2);
      })
      .attr("fill", (d) => {
        if (d.isCandidate) return "#5eead4";
        if (d.isCircleHub) return CIRCLE_CONFIG[d.circle]?.color || "#38bdf8";
        return "#f1f5f9";
      })
      .attr("font-size", (d) => (d.isCandidate ? "9px" : d.isCircleHub ? "12px" : "8px"))
      .attr("font-weight", "900")
      .attr("font-family", "monospace");

    // Labels
    node
      .append("text")
      .attr("dy", (d) => d.radius + 12)
      .attr("text-anchor", "middle")
      .text((d) => (d.isCandidate ? "Candidate (You)" : d.name))
      .attr("fill", (d) => (d.isCandidate ? "#2dd4bf" : d.isCircleHub ? "#94a3b8" : "#e2e8f0"))
      .attr("font-size", (d) => (d.isCandidate ? "11px" : d.isCircleHub ? "10px" : "9px"))
      .attr("font-weight", (d) => (d.isCandidate || d.isCircleHub ? "800" : "600"))
      .style("text-shadow", "0 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8)")
      .style("pointer-events", "none");

    // Sub-label (Company / Tier)
    node
      .filter((d) => !d.isCircleHub)
      .append("text")
      .attr("dy", (d) => d.radius + 22)
      .attr("text-anchor", "middle")
      .text((d) => (d.isCandidate ? `${targetRole}` : d.company))
      .attr("fill", "#64748b")
      .attr("font-size", "8px")
      .attr("font-weight", "600")
      .style("text-shadow", "0 1px 4px rgba(0,0,0,0.9)")
      .style("pointer-events", "none");

    // Interaction Events
    node
      .on("mouseenter", (event, d) => {
        setHoveredContact(d);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && !d.isCircleHub) {
          setTooltipData({
            contact: d,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }

        // Highlight connected
        const connSet = new Set(d.connections);
        connSet.add(d.id);

        node.attr("opacity", (n) => (connSet.has(n.id) ? 1 : 0.15));
        link.attr("stroke-opacity", (l) => {
          const s = (l.source as ContactNode).id;
          const t = (l.target as ContactNode).id;
          return s === d.id || t === d.id ? 1 : 0.06;
        });
        link.attr("stroke-width", (l) => {
          const s = (l.source as ContactNode).id;
          const t = (l.target as ContactNode).id;
          return s === d.id || t === d.id ? 2.5 : 1;
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
        setHoveredContact(null);
        setTooltipData(null);
        node.attr("opacity", 1);
        link
          .attr("stroke-opacity", 0.65)
          .attr("stroke-width", (d) => (d.type === "candidate-circle" ? 2 : d.type === "mutual-referral" ? 1.8 : 1.2));
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        if (!d.isCircleHub) {
          setSelectedContact(d);
          setCopiedNote(false);
        }
      });

    svg.on("click", () => {
      setSelectedContact(null);
    });

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as ContactNode).x || 0)
        .attr("y1", (d) => (d.source as ContactNode).y || 0)
        .attr("x2", (d) => (d.target as ContactNode).x || 0)
        .attr("y2", (d) => (d.target as ContactNode).y || 0);

      node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, height, isFullscreen, targetRole]);

  // Live filter animation
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg
      .selectAll<SVGGElement, ContactNode>(".net-nodes g")
      .transition()
      .duration(200)
      .style("opacity", (d) => {
        if (activeNodeIds.size === 0) return 1;
        return activeNodeIds.has(d.id) ? 1 : 0.12;
      });

    svg
      .selectAll<SVGLineElement, NetworkLink>(".net-links line")
      .transition()
      .duration(200)
      .style("opacity", (l) => {
        const s = typeof l.source === "string" ? l.source : l.source.id;
        const t = typeof l.target === "string" ? l.target : l.target.id;
        return activeNodeIds.has(s) && activeNodeIds.has(t) ? 0.7 : 0.05;
      });
  }, [activeNodeIds]);

  const handleCopyNote = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
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

  const firstDegreeCount = MOCK_INDUSTRY_CONTACTS.filter((c) => c.degree === "1st").length;
  const secondDegreeCount = MOCK_INDUSTRY_CONTACTS.filter((c) => c.degree === "2nd").length;

  return (
    <div
      ref={containerRef}
      className={`dark dark-studio relative rounded-3xl bg-slate-950/95 border border-teal-500/30 shadow-2xl overflow-hidden flex flex-col ${
        isFullscreen ? "fixed inset-0 z-[150] rounded-none border-none bg-slate-950 p-6" : className
      }`}
    >
      {/* Network Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md relative z-20">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  LinkedIn Connection Network
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Referral Map
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Force-directed cluster graph mapping warm intro routes & hiring manager opportunities
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls: Degree filters & Zoom controls */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setDegreeFilter(degreeFilter === "1st" ? "all" : "1st")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                degreeFilter === "1st"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{firstDegreeCount} 1st Degree</span>
            </button>
            <button
              type="button"
              onClick={() => setDegreeFilter(degreeFilter === "2nd" ? "all" : "2nd")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                degreeFilter === "2nd"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{secondDegreeCount} 2nd Degree</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => handleZoom(1.2)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(0.8)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={togglePhysics}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isPhysicsActive ? "text-teal-400 hover:bg-teal-500/20" : "text-amber-400 hover:bg-amber-500/20"
              }`}
              title={isPhysicsActive ? "Pause Physics Simulation" : "Resume Physics Simulation"}
            >
              {isPhysicsActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Explorer"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Circle Filter Pills & Search */}
      <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2.5 text-xs relative z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCircle("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCircle === "all"
                ? "bg-white/15 text-white border border-white/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            All Circles ({MOCK_INDUSTRY_CONTACTS.length})
          </button>
          {(Object.keys(CIRCLE_CONFIG) as CircleCategory[]).map((cat) => {
            const count = circleCounts[cat];
            const cfg = CIRCLE_CONFIG[cat];
            const isSelected = selectedCircle === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCircle(isSelected ? "all" : cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected ? "text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
                style={{
                  backgroundColor: isSelected ? `${cfg.color}25` : undefined,
                  border: isSelected ? `1px solid ${cfg.color}60` : "1px solid transparent",
                  color: isSelected ? cfg.color : undefined,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-70 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Company & Name Search */}
        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contact, company, role..."
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

      {/* SVG Canvas Area */}
      <div className="relative flex-1 w-full overflow-hidden bg-radial from-slate-900/50 via-slate-950 to-slate-950">
        <svg
          ref={svgRef}
          className="w-full h-full block"
          style={{ minHeight: isFullscreen ? "calc(100vh - 210px)" : `${height}px` }}
        />

        {/* Graph Legend Overlay */}
        <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 pointer-events-none space-y-1.5 shadow-xl hidden md:block">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Referral Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500/20 border-2 border-emerald-400 inline-block" />
            <span>1st Degree Direct Contact (High Reachability)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500/20 border-2 border-amber-400 border-dashed inline-block" />
            <span>2nd Degree Warm Intro Referral Path</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-800 border-2 border-sky-400 inline-block" />
            <span>Industry Circle Cluster Hub</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-[10px] text-slate-400">
            <span>• Click any contact to view warm intro note</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        {tooltipData && !selectedContact && (
          <div
            style={{
              position: "absolute",
              left: `${tooltipData.x + 15}px`,
              top: `${tooltipData.y - 15}px`,
              pointerEvents: "none",
            }}
            className="z-40 p-3 rounded-xl bg-slate-900/95 border border-teal-500/40 shadow-2xl text-white max-w-xs backdrop-blur-md space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-white">{tooltipData.contact.name}</span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  tooltipData.contact.degree === "1st" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {tooltipData.contact.degree} Degree
              </span>
            </div>
            <div className="text-[11px] text-teal-300 font-medium">
              {tooltipData.contact.role} at {tooltipData.contact.company}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-white/10">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Referral Score: <strong>{tooltipData.contact.referralScore}%</strong></span>
            </div>
          </div>
        )}

        {/* Contact Referral Inspector Slide-Out Drawer */}
        <AnimatePresence>
          {selectedContact && (
            <motion.div
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              className="absolute top-4 right-4 bottom-4 w-88 max-w-[calc(100%-2rem)] bg-slate-900/95 border border-teal-500/40 rounded-2xl shadow-2xl backdrop-blur-xl p-5 flex flex-col justify-between z-30 overflow-y-auto text-white"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-md shrink-0"
                      style={{ backgroundColor: selectedContact.avatarColor }}
                    >
                      {selectedContact.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{selectedContact.name}</h4>
                      <p className="text-xs text-teal-300 font-medium">
                        {selectedContact.role}
                      </p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {selectedContact.company}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedContact(null)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Referral Potential Banner */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500/15 to-indigo-500/15 border border-teal-500/30 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                      Referral Opportunity
                    </span>
                    <span className="font-mono font-black text-amber-300">
                      {selectedContact.referralScore}% Match
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedContact.hiringStatus}
                  </p>
                </div>

                {/* Warm Intro Route */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 mb-3 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Warm Intro Path
                  </span>
                  <div className="text-xs font-semibold text-teal-200 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{selectedContact.warmIntroVia}</span>
                  </div>
                  {selectedContact.mutualContacts.length > 0 && (
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5">
                      Shared Contacts: {selectedContact.mutualContacts.join(", ")}
                    </div>
                  )}
                </div>

                {/* Pre-composed Referral Outreach Note */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Tailored Referral Request Note
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyNote(selectedContact.suggestedNote)}
                      className="text-[10px] font-bold text-teal-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedNote ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Note
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-black/50 border border-white/10 rounded-xl text-xs text-slate-300 font-mono leading-relaxed select-all">
                    {selectedContact.suggestedNote}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => handleCopyNote(selectedContact.suggestedNote)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{copiedNote ? "Note Copied to Clipboard!" : "Copy Referral Pitch Note"}</span>
                </button>

                {linkedinUrl && (
                  <a
                    href={linkedinUrl.startsWith("http") ? linkedinUrl : `https://${linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open in LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Activity,
  Network,
  Car,
  AlertTriangle,
  FolderTree,
  Cpu,
  BarChart3,
  Zap,
  Plus,
  Minus,
  Layers,
  FileCode,
  Users,
  User,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const COMM_RANGE = 140; // Communication range in pixels
const ROAD_LANES = [100, 200, 300, 400]; // Y coordinates of horizontal roads
const VERTICAL_ROADS = [150, 350, 550, 700]; // X coordinates of vertical roads

// Default formula weights
const DEFAULT_WEIGHTS = {
  alpha: 0.4, // Queue Length weight
  beta: 0.35, // Buffer Occupancy weight
  gamma: 0.25, // Channel Busy Ratio weight
  w1: 0.35, // Congestion weight
  w2: 0.20, // Delay weight
  w3: 0.15, // Packet Loss weight
  w4: 0.15, // Link Quality weight
  w5: 0.15, // Hop Count weight
  tau: 0.65, // Congestion threshold tau for triggering route re-selection
};

// Euclidean distance between two nodes
const getDistance = (n1, n2) => {
  const dx = n1.x - n2.x;
  const dy = n1.y - n2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Calculate node congestion level CL_i = alpha*QL + beta*BO + gamma*CBR
const calculateNodeCongestion = (node, alpha, beta, gamma) => {
  return (alpha * node.ql + beta * node.bo + gamma * node.cbr);
};

// Link Quality based on distance and CBR noise
const calculateLinkQuality = (n1, n2) => {
  const dist = getDistance(n1, n2);
  const maxRange = COMM_RANGE;
  const distRatio = Math.min(1, dist / maxRange);
  const baseQuality = 1 - distRatio * 0.7; // Closer = higher quality
  const avgCbr = (n1.cbr + n2.cbr) / 2;
  return Math.max(0.05, Math.min(1, baseQuality * (1 - avgCbr * 0.4)));
};

// Presentation division structure matching uploaded image
const TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Member 1',
    role: 'Core Architecture & Congestion Metric Engine',
    color: 'from-sky-500 to-blue-600',
    borderColor: 'border-sky-500/40',
    accentColor: 'text-sky-400',
    bgBadge: 'bg-sky-500/20 text-sky-300',
    topics: [
      {
        num: 1,
        title: 'Problem Statement & Proposed Solution',
        summary: 'Dense V2V networks suffer from network partition, broadcast storms, and heavy packet loss when using traditional shortest-path protocols like AODV/DSR/GPSR. Proposed solution is a Congestion-Aware Multi-Hop V2V routing scheme.',
        bullets: [
          'High vehicle density leads to severe channel congestion and queue buffer overflows.',
          'Shortest-path algorithms repeatedly pick bottleneck nodes, exacerbating delays.',
          'Proposed solution dynamically combines Queue Length, Buffer Occupancy, and Channel Busy Ratio (CBR).'
        ],
        visualTab: 'formulas'
      },
      {
        num: 2,
        title: 'Proposed Methodology — Overall Framework',
        summary: 'High-level multi-stage execution pipeline from SUMO mobility to dynamic route re-selection.',
        bullets: [
          'Modular 7-stage pipeline: Discovery → Monitoring → Estimation → Scoring → Selection → Forwarding → Re-selection.',
          'Seamless integration with IEEE 802.11p / WAVE stack.',
          'Decoupled control and data plane operation for sub-12ms switching.'
        ],
        visualTab: 'architecture'
      },
      {
        num: 3,
        title: 'V2V Network Monitoring & Neighbor Discovery',
        summary: 'Vehicles continuously broadcast 802.11p beacons to build and refresh real-time neighbor tables.',
        bullets: [
          'Periodic beaconing exchanges ID, position (x, y), velocity (vx, vy), and local traffic metrics.',
          'Stale neighbors are automatically pruned when vehicle separation exceeds communication range (COMM_RANGE = 140m).',
          'Link quality is continuously updated based on distance and background wireless noise.'
        ],
        visualTab: 'simulator'
      },
      {
        num: 4,
        title: 'Congestion Detection & Estimation',
        summary: 'Formulates node-level congestion index CL_i using weighted composite metrics.',
        bullets: [
          'Calculates CL_i = α·QL_i + β·BO_i + γ·CBR_i (where α+β+γ=1).',
          'Queue Length (QL) measures pending MAC queue frames.',
          'Buffer Occupancy (BO) measures memory consumption ratio.',
          'Channel Busy Ratio (CBR) measures physical radio medium utilization.'
        ],
        visualTab: 'formulas'
      },
      {
        num: 5,
        title: 'Composite Route Cost Calculation',
        summary: 'Ranks multi-hop candidate paths using a unified multi-criteria cost formula C(P).',
        bullets: [
          'Evaluates bottleneck link: CL(P) = max(CL_i for intermediate nodes).',
          'Combines Max Congestion, End-to-End Delay, Packet Loss, Link Quality, and Hop Count.',
          'Formula: C(P) = w1·CL(P) + w2·D(P) + w3·PL(P) + w4·(1-LQ(P)) + w5·HC(P).'
        ],
        visualTab: 'formulas'
      },
      {
        num: 6,
        title: 'Candidate Route Generation & Scoring',
        summary: 'Generates K-shortest path candidates via bounded graph traversal before selecting the optimal path.',
        bullets: [
          'Discovers K feasible multi-hop routes between Source and Destination.',
          'Computes individual link quality metrics across intermediate forwarding links.',
          'Sorts routes in ascending order of composite cost C(P).'
        ],
        visualTab: 'simulator'
      },
      {
        num: 7,
        title: 'Dynamic Route Selection & Re-selection',
        summary: 'Monitors the active path P* and triggers instant rerouting if congestion crosses threshold τ.',
        bullets: [
          'Selects optimal path P* = arg min C(P).',
          'Continuously monitors CL(P*) during packet transmission.',
          'If CL(P*) > threshold τ (e.g. 0.65), immediate path re-selection switches traffic to Path #2 without full route discovery flooding.'
        ],
        visualTab: 'simulator'
      }
    ]
  },
  {
    id: 2,
    name: 'Member 2',
    role: 'Complete Algorithmic Pipeline & Flow Execution',
    color: 'from-indigo-500 to-purple-600',
    borderColor: 'border-indigo-500/40',
    accentColor: 'text-indigo-400',
    bgBadge: 'bg-indigo-500/20 text-indigo-300',
    topics: [
      {
        num: 8,
        title: 'Complete Proposed Methodology',
        summary: 'Step-by-step mathematical walkthrough uniting local metric collection with global multi-hop routing decision logic.',
        bullets: [
          'End-to-end integration of SUMO vehicle traces into OMNeT++/NS-3 network simulator.',
          'Detailed mathematical flow combining normalized metrics (0 to 1).',
          'Demonstrates how congestion awareness prevents catastrophic drop-offs in dense urban traffic jams.'
        ],
        visualTab: 'formulas'
      },
      {
        num: 9,
        title: 'Algorithm 1: Congestion-Aware Route Selection',
        summary: 'Formal pseudocode algorithm execution flow from initialization to dynamic re-selection.',
        bullets: [
          'Input: Source S, Destination D, Network Graph G(V,E), Threshold τ, Weights (α,β,γ, w1..w5).',
          'Step 1: Discover K-candidate paths between S and D using neighbor tables.',
          'Step 2: For each path P, compute CL(P) = max(CL_i) and composite cost C(P).',
          'Step 3: Forward data packets on path P* with minimum cost.',
          'Step 4: While transmitting, if bottleneck CL(P*) > τ, switch to next minimum cost candidate path.'
        ],
        visualTab: 'simulator'
      }
    ]
  },
  {
    id: 3,
    name: 'Member 3',
    role: 'Literature Review, Research Gaps & Experimental Setup',
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/40',
    accentColor: 'text-amber-400',
    bgBadge: 'bg-amber-500/20 text-amber-300',
    topics: [
      {
        num: 10,
        title: 'Literature Review',
        summary: 'Critical review of existing V2V routing protocols (AODV, DSR, GPSR) and early congestion control techniques.',
        bullets: [
          'AODV/DSR: Reactive protocols relying on minimum hop count; ignore MAC queue state.',
          'GPSR: Geographic greedy forwarding suffers from local minimum void traps in urban buildings.',
          'Existing congestion schemes focus only on channel CBR without considering queue/buffer occupancy.'
        ],
        visualTab: 'benchmarks'
      },
      {
        num: 11,
        title: 'Research Gap',
        summary: 'Highlighting key unaddressed limitations in current VANET literature.',
        bullets: [
          'Gap 1: Absence of unified composite metric integrating Queue Length, Buffer Occupancy, AND Channel Busy Ratio.',
          'Gap 2: Lack of dynamic proactive re-selection prior to packet drop events.',
          'Gap 3: Inability of traditional protocols to scale under high urban vehicle density (>60 vehicles/km²).'
        ],
        visualTab: 'benchmarks'
      },
      {
        num: 12,
        title: 'Project Overview & Experimental Setup',
        summary: 'Simulation environment configuration including SUMO, OMNeT++/Veins, NS-3, and IEEE 802.11p parameters.',
        bullets: [
          'Mobility Simulator: SUMO urban road grid with multi-lane intersections and traffic signals.',
          'Network Simulator: OMNeT++ with Veins framework / NS-3 implementing IEEE 802.11p / WAVE.',
          'Parameters: Bitrate 6 Mbps, Transmission Range 140m, Vehicle Density 20–100 vehicles/km².'
        ],
        visualTab: 'architecture'
      }
    ]
  },
  {
    id: 4,
    name: 'Member 4',
    role: 'Performance Benchmark Analysis, Conclusion & References',
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/40',
    accentColor: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/20 text-emerald-300',
    topics: [
      {
        num: 13,
        title: 'Expected Results & Performance Analysis',
        summary: 'Comparative benchmark results evaluating CAR-V2V against AODV, DSR, and GPSR.',
        bullets: [
          'Packet Delivery Ratio (PDR): CAR-V2V maintains >89% PDR even at 100 vehicles/km² (vs 52% AODV).',
          'End-to-End Delay: Reduces latency to 44ms (vs 165ms AODV) by bypassing queue bottlenecks.',
          'Throughput & Overhead: Achieves 1.8x higher throughput with lower control overhead.'
        ],
        visualTab: 'benchmarks'
      },
      {
        num: 14,
        title: 'Conclusion & Future Work',
        summary: 'Summary of contributions and prospective future enhancements.',
        bullets: [
          'Conclusion: CAR-V2V effectively eliminates network partition and buffer drop-offs in dense urban V2V environments.',
          'Future Work 1: Integration of AI/Reinforcement Learning (Q-Learning) for adaptive weight tuning.',
          'Future Work 2: Extension to V2I (Vehicle-to-Infrastructure) 5G-NR Sidelink networks.'
        ],
        visualTab: 'benchmarks'
      },
      {
        num: 15,
        title: 'References',
        summary: 'Key scholarly citations supporting the research methodology.',
        bullets: [
          'IEEE 802.11p Standard for Wireless Access in Vehicular Environments (WAVE).',
          'Sommer et al., "Veins: The open source vehicular network simulation framework", IEEE IEEE/ACM Trans. Netw.',
          'Karp & Kung, "GPSR: Greedy perimeter stateless routing for wireless networks", ACM Mobicom.',
          'Perkins et al., "Ad hoc On-Demand Distance Vector (AODV) Routing", IETF RFC 3561.'
        ],
        visualTab: 'architecture'
      }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('team'); // 'team', 'simulator', 'benchmarks', 'formulas', 'architecture'
  
  // Team Presentation tab state
  const [selectedMemberId, setSelectedMemberId] = useState(1);
  const [selectedTopicNum, setSelectedTopicNum] = useState(1);

  // Simulation parameters
  const [vehicleCount, setVehicleCount] = useState(38);
  const [simRunning, setSimRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  
  // Source and Destination node IDs
  const [sourceId, setSourceId] = useState(0);
  const [destId, setDestId] = useState(1);
  
  // Dynamic Simulation state
  const [vehicles, setVehicles] = useState([]);
  const [candidateRoutes, setCandidateRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [reselectionEvents, setReselectionEvents] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [packets, setPackets] = useState([]);
  
  const canvasRef = useRef(null);
  const lastPacketTime = useRef(0);

  const initializeVehicles = useCallback((count) => {
    const newVehicles = [];
    
    // Ensure node 0 (Source) and node 1 (Destination) are placed strategically
    newVehicles.push({
      id: 0,
      x: 80,
      y: 200,
      vx: 1.2,
      vy: 0,
      lane: 200,
      isVertical: false,
      ql: 0.2,
      bo: 0.15,
      cbr: 0.25,
      isJam: false,
    });

    newVehicles.push({
      id: 1,
      x: 720,
      y: 300,
      vx: -1.0,
      vy: 0,
      lane: 300,
      isVertical: false,
      ql: 0.15,
      bo: 0.2,
      cbr: 0.3,
      isJam: false,
    });

    // Generate random urban traffic nodes
    for (let i = 2; i < count; i++) {
      const isVertical = Math.random() > 0.5;
      let x, y, vx, vy, lane;

      if (isVertical) {
        lane = VERTICAL_ROADS[Math.floor(Math.random() * VERTICAL_ROADS.length)];
        x = lane;
        y = Math.random() * (CANVAS_HEIGHT - 60) + 30;
        vx = 0;
        vy = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.2);
      } else {
        lane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];
        x = Math.random() * (CANVAS_WIDTH - 60) + 30;
        y = lane;
        vx = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.2);
        vy = 0;
      }

      newVehicles.push({
        id: i,
        x,
        y,
        vx,
        vy,
        lane,
        isVertical,
        ql: Math.random() * 0.4,
        bo: Math.random() * 0.35,
        cbr: Math.random() * 0.4,
        isJam: false,
      });
    }

    setVehicles(newVehicles);
    setSourceId(0);
    setDestId(1);
    setSelectedVehicle(null);
    setEventLogs([{ time: new Date().toLocaleTimeString(), text: 'Network topology initialized with ' + count + ' V2V nodes.' }]);
  }, []);

  useEffect(() => {
    initializeVehicles(vehicleCount);
  }, [vehicleCount, initializeVehicles]);

  const neighborGraph = useMemo(() => {
    if (vehicles.length === 0) return {};
    
    const graph = {};
    vehicles.forEach(v => {
      graph[v.id] = [];
    });

    for (let i = 0; i < vehicles.length; i++) {
      for (let j = i + 1; j < vehicles.length; j++) {
        const v1 = vehicles[i];
        const v2 = vehicles[j];
        const dist = getDistance(v1, v2);

        if (dist <= COMM_RANGE) {
          const lq = calculateLinkQuality(v1, v2);
          graph[v1.id].push({ neighborId: v2.id, dist, lq });
          graph[v2.id] ? graph[v2.id].push({ neighborId: v1.id, dist, lq }) : null;
        }
      }
    }
    return graph;
  }, [vehicles]);

  const findCandidateRoutes = useCallback(() => {
    if (!vehicles.length || sourceId === null || destId === null) return [];

    const src = vehicles.find(v => v.id === sourceId);
    const dst = vehicles.find(v => v.id === destId);
    if (!src || !dst) return [];

    // Find paths using simple Depth-First Search with length bounding
    const paths = [];
    const maxHops = 6;
    const visited = new Set();

    const dfs = (currId, currentPath) => {
      if (paths.length >= 5) return; // Limit to K=5 candidate paths
      if (currentPath.length > maxHops) return;

      if (currId === destId) {
        paths.push([...currentPath]);
        return;
      }

      visited.add(currId);
      const neighbors = neighborGraph[currId] || [];

      // Sort neighbors prioritizing those closer to target
      const sortedNeighbors = [...neighbors].sort((a, b) => {
        const nA = vehicles.find(v => v.id === a.neighborId);
        const nB = vehicles.find(v => v.id === b.neighborId);
        if (!nA || !nB) return 0;
        return getDistance(nA, dst) - getDistance(nB, dst);
      });

      for (const n of sortedNeighbors) {
        if (!visited.has(n.neighborId)) {
          dfs(n.neighborId, [...currentPath, n.neighborId]);
        }
      }
      visited.delete(currId);
    };

    dfs(sourceId, [sourceId]);

    // Compute composite cost for each candidate path
    const evaluatedRoutes = paths.map((path, idx) => {
      let maxCL = 0;
      let totalDelay = 0;
      let totalPacketLoss = 0;
      let sumLQ = 0;
      const hopCount = path.length - 1;

      for (let i = 0; i < path.length; i++) {
        const node = vehicles.find(v => v.id === path[i]);
        if (node) {
          const cl = calculateNodeCongestion(node, weights.alpha, weights.beta, weights.gamma);
          if (cl > maxCL) maxCL = cl;
        }

        if (i < path.length - 1) {
          const n1 = vehicles.find(v => v.id === path[i]);
          const n2 = vehicles.find(v => v.id === path[i + 1]);
          if (n1 && n2) {
            const lq = calculateLinkQuality(n1, n2);
            sumLQ += lq;
            totalDelay += (15 + (1 - lq) * 35 + (n1.ql + n2.ql) * 40); // ms
            totalPacketLoss += (1 - lq) * 0.15 + (n1.cbr * 0.2); // ratio
          }
        }
      }

      const avgLQ = hopCount > 0 ? sumLQ / hopCount : 1;
      const normDelay = Math.min(1, totalDelay / 200); // normalized
      const normPacketLoss = Math.min(1, totalPacketLoss);
      const normHopCount = Math.min(1, hopCount / 8);

      // Formula: C(P) = w1*CL(P) + w2*D(P) + w3*PL(P) + w4*(1 - LQ(P)) + w5*HC(P)
      const cost = 
        weights.w1 * maxCL +
        weights.w2 * normDelay +
        weights.w3 * normPacketLoss +
        weights.w4 * (1 - avgLQ) +
        weights.w5 * normHopCount;

      return {
        id: idx + 1,
        path,
        maxCL,
        delay: Math.round(totalDelay),
        packetLoss: (totalPacketLoss * 100).toFixed(1),
        avgLQ: avgLQ.toFixed(2),
        hopCount,
        cost: cost.toFixed(3),
        rawCost: cost,
      };
    });

    // Sort by lowest cost
    evaluatedRoutes.sort((a, b) => a.rawCost - b.rawCost);

    return evaluatedRoutes;
  }, [vehicles, sourceId, destId, neighborGraph, weights]);

  useEffect(() => {
    const routes = findCandidateRoutes();
    setCandidateRoutes(routes);

    if (routes.length > 0) {
      // Dynamic monitoring: Check if current active route bottleneck exceeds threshold tau
      if (routes[selectedRouteIndex]) {
        const currentActive = routes[selectedRouteIndex];
        if (currentActive.maxCL > weights.tau && routes.length > 1) {
          // Trigger dynamic re-selection!
          const newBestIdx = 0;
          if (newBestIdx !== selectedRouteIndex) {
            setSelectedRouteIndex(newBestIdx);
            const timeStr = new Date().toLocaleTimeString();
            setReselectionEvents(prev => [
              {
                time: timeStr,
                reason: `Congestion CL (${currentActive.maxCL.toFixed(2)}) > threshold τ (${weights.tau})`,
                oldRoute: currentActive.path.join(' → '),
                newRoute: routes[0].path.join(' → '),
              },
              ...prev.slice(0, 9)
            ]);
            setEventLogs(prev => [
              { time: timeStr, text: `🚨 Dynamic Re-selection Triggered! Shifted route to avoid congested node.` },
              ...prev.slice(0, 15)
            ]);
          }
        }
      } else {
        setSelectedRouteIndex(0);
      }
    }
  }, [findCandidateRoutes, weights.tau, selectedRouteIndex]);

  useEffect(() => {
    if (!simRunning) return;

    const interval = setInterval(() => {
      setVehicles(prevVehicles => {
        return prevVehicles.map(v => {
          let nx = v.x + v.vx * simSpeed;
          let ny = v.y + v.vy * simSpeed;
          let nVx = v.vx;
          let nVy = v.vy;

          // Bounce off boundary or wrap around
          if (nx < 20 || nx > CANVAS_WIDTH - 20) {
            nVx = -nVx;
            nx = Math.max(20, Math.min(CANVAS_WIDTH - 20, nx));
          }
          if (ny < 20 || ny > CANVAS_HEIGHT - 20) {
            nVy = -nVy;
            ny = Math.max(20, Math.min(CANVAS_HEIGHT - 20, ny));
          }

          // Fluctuating buffer/queue metrics over time
          let nQl = v.ql;
          let nBo = v.bo;
          let nCbr = v.cbr;

          if (v.isJam) {
            // High artificial congestion
            nQl = Math.min(0.98, v.ql + 0.05);
            nBo = Math.min(0.95, v.bo + 0.04);
            nCbr = Math.min(0.92, v.cbr + 0.03);
          } else {
            // Random small fluctuation
            nQl = Math.max(0.05, Math.min(0.85, v.ql + (Math.random() - 0.49) * 0.03));
            nBo = Math.max(0.05, Math.min(0.85, v.bo + (Math.random() - 0.49) * 0.03));
            nCbr = Math.max(0.05, Math.min(0.85, v.cbr + (Math.random() - 0.49) * 0.02));
          }

          return {
            ...v,
            x: nx,
            y: ny,
            vx: nVx,
            vy: nVy,
            ql: parseFloat(nQl.toFixed(3)),
            bo: parseFloat(nBo.toFixed(3)),
            cbr: parseFloat(nCbr.toFixed(3)),
          };
        });
      });

      // Animate packet transmission along selected active route
      if (candidateRoutes.length > 0 && candidateRoutes[selectedRouteIndex]) {
        const activePath = candidateRoutes[selectedRouteIndex].path;
        if (activePath && activePath.length > 1) {
          const now = Date.now();
          if (now - lastPacketTime.current > 600 / simSpeed) {
            lastPacketTime.current = now;
            setPackets(prev => [
              ...prev.filter(p => p.progress < 1),
              {
                id: Math.random(),
                path: activePath,
                currentHopIndex: 0,
                progress: 0,
              }
            ]);
          }
        }
      }

      // Progress existing packets
      setPackets(prev => 
        prev.map(p => ({
          ...p,
          progress: p.progress + 0.08 * simSpeed
        })).filter(p => p.progress < 1)
      );

    }, 50);

    return () => clearInterval(interval);
  }, [simRunning, simSpeed, candidateRoutes, selectedRouteIndex]);

  useEffect(() => {
    if (activeTab !== 'simulator') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw Urban Road Grid
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw horizontal roads
    ROAD_LANES.forEach(y => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, y - 18, CANVAS_WIDTH, 36);
      ctx.setLineDash([12, 12]);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    });

    // Draw vertical roads
    VERTICAL_ROADS.forEach(x => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(x - 18, 0, 36, CANVAS_HEIGHT);
      ctx.setLineDash([12, 12]);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    });
    ctx.setLineDash([]); // Reset dashed lines

    // 2. Draw V2V Communication Links (Inter-vehicle adjacency)
    vehicles.forEach(v1 => {
      const neighbors = neighborGraph[v1.id] || [];
      neighbors.forEach(n => {
        const v2 = vehicles.find(v => v.id === n.neighborId);
        if (v2 && v1.id < v2.id) {
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(v1.x, v1.y);
          ctx.lineTo(v2.x, v2.y);
          ctx.stroke();
        }
      });
    });

    // 3. Highlight Selected Active Multi-Hop Route
    const activeRoute = candidateRoutes[selectedRouteIndex];
    if (activeRoute && activeRoute.path.length > 1) {
      ctx.strokeStyle = '#38bdf8'; // Sky blue path
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < activeRoute.path.length - 1; i++) {
        const n1 = vehicles.find(v => v.id === activeRoute.path[i]);
        const n2 = vehicles.find(v => v.id === activeRoute.path[i + 1]);
        if (n1 && n2) {
          if (i === 0) ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
        }
      }
      ctx.stroke();
    }

    // 4. Draw Transmission Range Circle for Source or Selected Node
    const highlightNode = selectedVehicle !== null 
      ? vehicles.find(v => v.id === selectedVehicle) 
      : vehicles.find(v => v.id === sourceId);

    if (highlightNode) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(highlightNode.x, highlightNode.y, COMM_RANGE, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    // 5. Draw Animated Packets moving along path
    packets.forEach(p => {
      const path = p.path;
      if (path.length < 2) return;
      const totalSegments = path.length - 1;
      const scaledProgress = p.progress * totalSegments;
      const segIndex = Math.floor(scaledProgress);
      const segRatio = scaledProgress - segIndex;

      if (segIndex < totalSegments) {
        const n1 = vehicles.find(v => v.id === path[segIndex]);
        const n2 = vehicles.find(v => v.id === path[segIndex + 1]);
        if (n1 && n2) {
          const px = n1.x + (n2.x - n1.x) * segRatio;
          const py = n1.y + (n2.y - n1.y) * segRatio;

          ctx.fillStyle = '#f59e0b'; // Gold packet
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    });

    // 6. Draw Vehicle Nodes
    vehicles.forEach(v => {
      const isSrc = v.id === sourceId;
      const isDst = v.id === destId;
      const isSelected = v.id === selectedVehicle;
      const isInActiveRoute = activeRoute && activeRoute.path.includes(v.id);
      
      const cl = calculateNodeCongestion(v, weights.alpha, weights.beta, weights.gamma);

      // Color coding based on role / congestion
      let nodeColor = '#22c55e'; // Normal (Green)
      if (cl > 0.65) nodeColor = '#ef4444'; // Congested (Red)
      else if (cl > 0.45) nodeColor = '#eab308'; // Moderate (Yellow)

      if (isSrc) nodeColor = '#3b82f6'; // Blue
      if (isDst) nodeColor = '#a855f7'; // Purple

      // Vehicle Shadow & Body
      ctx.save();
      ctx.translate(v.x, v.y);

      // Draw active route highlight glow
      if (isInActiveRoute && !isSrc && !isDst) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw main vehicle circle
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(0, 0, isSrc || isDst ? 11 : 9, 0, 2 * Math.PI);
      ctx.fill();

      // Border outline
      ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let label = `${v.id}`;
      if (isSrc) label = 'SRC';
      if (isDst) label = 'DST';
      ctx.fillText(label, 0, 0);

      ctx.restore();
    });

  }, [activeTab, vehicles, neighborGraph, candidateRoutes, selectedRouteIndex, selectedVehicle, sourceId, destId, packets, weights]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const clickY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

    const clicked = vehicles.find(v => getDistance({ x: clickX, y: clickY }, v) < 16);
    if (clicked) {
      setSelectedVehicle(clicked.id);
    } else {
      setSelectedVehicle(null);
    }
  };

  const toggleTrafficJam = (vehicleId) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const isNowJam = !v.isJam;
        setEventLogs(logs => [
          {
            time: new Date().toLocaleTimeString(),
            text: isNowJam 
              ? `⚠️ Injected High Traffic Jam on Node ${v.id} (Queue/BO spiked)` 
              : `Cleared Artificial Traffic Jam on Node ${v.id}`
          },
          ...logs.slice(0, 15)
        ]);
        return {
          ...v,
          isJam: isNowJam,
          ql: isNowJam ? 0.92 : 0.2,
          bo: isNowJam ? 0.88 : 0.2,
          cbr: isNowJam ? 0.85 : 0.25,
        };
      }
      return v;
    }));
  };

  const benchmarkData = useMemo(() => {
    // Vehicles density evaluation x-axis: [20, 40, 60, 80, 100]
    return [
      { density: 20, Proposed: 98.2, AODV: 92.1, DSR: 89.5, GPSR: 91.0, delayProposed: 22, delayAODV: 45, delayDSR: 52, delayGPSR: 38 },
      { density: 40, Proposed: 96.5, AODV: 85.4, DSR: 81.2, GPSR: 83.5, delayProposed: 28, delayAODV: 68, delayDSR: 79, delayGPSR: 58 },
      { density: 60, Proposed: 94.1, AODV: 76.8, DSR: 70.4, GPSR: 74.2, delayProposed: 35, delayAODV: 110, delayDSR: 125, delayGPSR: 92 },
      { density: 80, Proposed: 91.8, AODV: 64.2, DSR: 58.1, GPSR: 62.9, delayProposed: 44, delayAODV: 165, delayDSR: 182, delayGPSR: 140 },
      { density: 100, Proposed: 89.4, AODV: 52.0, DSR: 44.6, GPSR: 51.3, delayProposed: 55, delayAODV: 240, delayDSR: 265, delayGPSR: 210 },
    ];
  }, []);

  const radarMetricData = [
    { subject: 'PDR (%)', Proposed: 94, AODV: 64, GPSR: 63 },
    { subject: 'Throughput', Proposed: 90, AODV: 58, GPSR: 62 },
    { subject: 'Low Delay', Proposed: 88, AODV: 42, GPSR: 52 },
    { subject: 'Low Packet Loss', Proposed: 92, AODV: 60, GPSR: 65 },
    { subject: 'Low Overhead', Proposed: 82, AODV: 45, GPSR: 78 },
    { subject: 'Jitter Stability', Proposed: 89, AODV: 50, GPSR: 58 },
  ];

  const currentMember = TEAM_MEMBERS.find(m => m.id === selectedMemberId) || TEAM_MEMBERS[0];
  const currentTopic = currentMember.topics.find(t => t.num === selectedTopicNum) || currentMember.topics[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-sky-500/20">
            <Network className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
              Congestion-Aware Route Selection (CAR-V2V)
            </h1>
            <p className="text-xs text-slate-400">
              Multi-Hop Vehicle-to-Vehicle Routing in Dense Urban Traffic
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <nav className="flex items-center space-x-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'team'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Presentation Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Interactive Visualizer</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'benchmarks'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Protocol Benchmarks</span>
          </button>

          <button
            onClick={() => setActiveTab('formulas')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'formulas'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Formulas & Math</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'architecture'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Project Architecture</span>
          </button>
        </nav>
      </header>

      {/* Main View Area */}
      <main className="flex-1 p-6 max-w-[1650px] mx-auto w-full">
        {/* ========================================================================= */}
        {/* TAB 0: TEAM PRESENTATION DIVISION (MEMBERS 1 - 4) */}
        {/* ========================================================================= */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* Horizontal Team Flow Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {TEAM_MEMBERS.map(mem => {
                const isSelected = mem.id === selectedMemberId;
                return (
                  <div
                    key={mem.id}
                    onClick={() => {
                      setSelectedMemberId(mem.id);
                      setSelectedTopicNum(mem.topics[0].num);
                    }}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 relative overflow-hidden ${
                      isSelected
                        ? `bg-slate-900 ${mem.borderColor} shadow-xl shadow-sky-500/10 ring-1 ring-sky-500/30`
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-xl bg-gradient-to-r ${mem.color} text-white`}>
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-100">{mem.name}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${mem.bgBadge}`}>
                        {mem.topics.length} Topics
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mb-3">
                      {mem.role}
                    </p>

                    <div className="text-[10px] text-slate-500 space-y-1">
                      <span className="block font-semibold text-slate-400 uppercase tracking-wider text-[9px]">
                        Assigned Topics:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {mem.topics.map(t => (
                          <span
                            key={t.num}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                              t.num === selectedTopicNum
                                ? 'bg-sky-500 text-white font-bold'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {t.num}. {t.title.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Member Topic Explainer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Topics List for Selected Member */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-800">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-r ${currentMember.color} text-white`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{currentMember.name} Presentation Agenda</h3>
                      <p className="text-xs text-slate-400">{currentMember.role}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {currentMember.topics.map((topic) => {
                      const isActive = topic.num === selectedTopicNum;
                      return (
                        <div
                          key={topic.num}
                          onClick={() => setSelectedTopicNum(topic.num)}
                          className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                            isActive
                              ? `bg-slate-950 ${currentMember.borderColor} shadow-md`
                              : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                                isActive ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {topic.num}
                              </span>
                              <span className={`text-xs font-semibold ${isActive ? 'text-sky-300' : 'text-slate-200'}`}>
                                {topic.title}
                              </span>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-600'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {"Total Presentation Flow: 15 Core Modules"}
                  </span>
                  <span className="font-mono text-sky-400 text-[11px]">Member 1 → Member 4</span>
                </div>
              </div>

              {/* Right Column: In-Depth Explanation & Speaker Script */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-mono text-xs font-bold border border-sky-500/30">
                        Topic #{currentTopic.num}
                      </span>
                      <h3 className="text-base font-bold text-slate-100">{currentTopic.title}</h3>
                    </div>

                    <button
                      onClick={() => setActiveTab(currentTopic.visualTab)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500 text-white hover:bg-sky-400 shadow-sm shadow-sky-500/20 transition-all"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Launch Visualizer Demo</span>
                    </button>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-5">
                    <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block mb-1">
                      Module Executive Summary
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentTopic.summary}
                    </p>
                  </div>

                  {/* Key Talking Points / Speaker Scripts */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      Presentation Talking Points & Defense Script:
                    </h4>
                    <div className="space-y-2.5">
                      {currentTopic.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-300 leading-relaxed font-sans">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next Topic Navigator */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Assigned Speaker: <strong className="text-slate-200">{currentMember.name}</strong>
                  </span>

                  <button
                    onClick={() => {
                      if (selectedTopicNum < 15) {
                        const nextNum = selectedTopicNum + 1;
                        setSelectedTopicNum(nextNum);
                        const parentMem = TEAM_MEMBERS.find(m => m.topics.some(t => t.num === nextNum));
                        if (parentMem) setSelectedMemberId(parentMem.id);
                      }
                    }}
                    disabled={selectedTopicNum === 15}
                    className="flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-medium disabled:opacity-40"
                  >
                    <span>Next Topic ({selectedTopicNum < 15 ? selectedTopicNum + 1 : 'End'})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: INTERACTIVE SIMULATOR & NETWORK CANVAS */}
        {/* ========================================================================= */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Simulation Canvas Panel */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                {/* Control bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSimRunning(!simRunning)}
                      className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all ${
                        simRunning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                      }`}
                    >
                      {simRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{simRunning ? 'Pause Mobility' : 'Start Mobility'}</span>
                    </button>

                    <button
                      onClick={() => initializeVehicles(vehicleCount)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium text-xs bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Grid</span>
                    </button>
                  </div>

                  {/* Vehicle Density Control */}
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-400">Node Density:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setVehicleCount(Math.max(15, vehicleCount - 5))}
                        className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-semibold text-sky-400 w-6 text-center">{vehicleCount}</span>
                      <button
                        onClick={() => setVehicleCount(Math.min(70, vehicleCount + 5))}
                        className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Simulation Speed */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400">Speed:</span>
                    <button
                      onClick={() => setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 0.5 : 1)}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 text-sky-300 font-mono rounded"
                    >
                      {simSpeed}x
                    </button>
                  </div>
                </div>

                {/* Canvas Container */}
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onClick={handleCanvasClick}
                    className="cursor-pointer w-full h-auto max-h-[500px] object-contain"
                  />

                  {/* Canvas Overlays / Legends */}
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[11px] flex gap-4 text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                      <span>Source Node</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                      <span>Destination</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <span>Normal</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <span>Congested Link</span>
                    </div>
                  </div>
                </div>

                {/* Live Event Log */}
                <div className="mt-4 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Dynamic Event & Re-selection Monitor
                    </span>
                    <span className="text-[10px] text-slate-500">IEEE 802.11p / WAVE Protocol</span>
                  </div>
                  <div className="h-20 overflow-y-auto space-y-1 font-mono text-[11px] pr-2">
                    {eventLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2 text-slate-300">
                        <span className="text-slate-500 font-sans">[{log.time}]</span>
                        <span className={log.text.includes('Triggered') ? 'text-amber-300 font-semibold' : ''}>
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generated Candidate Routes Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    Evaluated K-Candidate Routes
                  </h3>
                  <span className="text-xs text-slate-400">
                    Source Node <span className="text-sky-400 font-bold">{sourceId}</span> → Destination Node <span className="text-purple-400 font-bold">{destId}</span>
                  </span>
                </div>

                {candidateRoutes.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No active paths discovered between source and destination within transmission range. Try moving nodes or adding density.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Route Path</th>
                          <th className="p-2.5">Max CL(P)</th>
                          <th className="p-2.5">Delay</th>
                          <th className="p-2.5">Loss</th>
                          <th className="p-2.5">Avg LQ</th>
                          <th className="p-2.5">Hops</th>
                          <th className="p-2.5">Cost C(P)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {candidateRoutes.map((route, idx) => {
                          const isActive = idx === selectedRouteIndex;
                          const isExceedingTau = route.maxCL > weights.tau;

                          return (
                            <tr
                              key={route.id}
                              onClick={() => setSelectedRouteIndex(idx)}
                              className={`cursor-pointer transition-colors ${
                                isActive ? 'bg-sky-500/15 text-white' : 'hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="p-2.5">
                                {isActive ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/30 text-sky-300 border border-sky-400/40">
                                    ACTIVE P*
                                  </span>
                                ) : (
                                  <span className="text-slate-500">Path #{idx + 1}</span>
                                )}
                              </td>
                              <td className="p-2.5 font-sans font-medium text-slate-200">
                                {route.path.join(' → ')}
                              </td>
                              <td className="p-2.5">
                                <span className={isExceedingTau ? 'text-red-400 font-bold' : 'text-slate-300'}>
                                  {route.maxCL.toFixed(2)}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-300">{route.delay} ms</td>
                              <td className="p-2.5 text-slate-300">{route.packetLoss}%</td>
                              <td className="p-2.5 text-slate-300">{route.avgLQ}</td>
                              <td className="p-2.5 text-slate-300">{route.hopCount}</td>
                              <td className="p-2.5 font-bold text-sky-400">{route.cost}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar: Weights Tuning & Selected Node Inspector */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Parameter & Formula Weight Sliders */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-400" />
                    Metric Weights & Threshold Tuning
                  </span>
                  <button
                    onClick={() => setWeights(DEFAULT_WEIGHTS)}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    Reset Defaults
                  </button>
                </h3>

                <div className="space-y-3.5 text-xs">
                  {/* Congestion Threshold Tau */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between font-medium mb-1">
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Re-selection Threshold (τ)
                      </span>
                      <span className="font-mono font-bold text-amber-300">{weights.tau}</span>
                    </div>
                    <input
                      type="range"
                      min="0.30"
                      max="0.90"
                      step="0.05"
                      value={weights.tau}
                      onChange={(e) => setWeights({ ...weights, tau: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {"If active path's max CL > τ, trigger immediate dynamic path re-selection."}
                    </p>
                  </div>

                  {/* Congestion Weights (alpha, beta, gamma) */}
                  <div>
                    <span className="text-slate-400 font-medium text-[11px] block mb-2">
                      Node Congestion Level: CL = α·QL + β·BO + γ·CBR
                    </span>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300">α (Queue Length):</span>
                          <span className="font-mono text-sky-400">{weights.alpha}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.8"
                          step="0.05"
                          value={weights.alpha}
                          onChange={(e) => setWeights({ ...weights, alpha: parseFloat(e.target.value) })}
                          className="w-full accent-sky-500 h-1 bg-slate-800 rounded"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300">β (Buffer Occupancy):</span>
                          <span className="font-mono text-sky-400">{weights.beta}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.8"
                          step="0.05"
                          value={weights.beta}
                          onChange={(e) => setWeights({ ...weights, beta: parseFloat(e.target.value) })}
                          className="w-full accent-sky-500 h-1 bg-slate-800 rounded"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300">γ (Channel Busy Ratio CBR):</span>
                          <span className="font-mono text-sky-400">{weights.gamma}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.8"
                          step="0.05"
                          value={weights.gamma}
                          onChange={(e) => setWeights({ ...weights, gamma: parseFloat(e.target.value) })}
                          className="w-full accent-sky-500 h-1 bg-slate-800 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Route Composite Cost Weight w1 */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 font-medium text-[11px] block mb-2">
                      Composite Cost C(P) Weights:
                    </span>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300">w1 (Max Congestion Weight):</span>
                          <span className="font-mono text-indigo-400">{weights.w1}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.7"
                          step="0.05"
                          value={weights.w1}
                          onChange={(e) => setWeights({ ...weights, w1: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-500 h-1 bg-slate-800 rounded"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300">w2 (Delay Weight):</span>
                          <span className="font-mono text-indigo-400">{weights.w2}</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.5"
                          step="0.05"
                          value={weights.w2}
                          onChange={(e) => setWeights({ ...weights, w2: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-500 h-1 bg-slate-800 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Node Inspector / Inject Congestion */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-sky-400" />
                    Vehicle Inspector
                  </span>
                  {selectedVehicle !== null && (
                    <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30 font-mono">
                      Node ID: {selectedVehicle}
                    </span>
                  )}
                </h3>

                {selectedVehicle === null ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Click any vehicle node on the canvas grid to inspect its real-time queue length, buffer occupancy, CBR, and inject traffic jams.
                  </div>
                ) : (
                  (() => {
                    const node = vehicles.find(v => v.id === selectedVehicle);
                    if (!node) return null;
                    const cl = calculateNodeCongestion(node, weights.alpha, weights.beta, weights.gamma);

                    return (
                      <div className="space-y-3 text-xs">
                        {/* Dynamic Node Metrics */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">Queue Length (QL)</span>
                            <span className="font-mono text-sm font-bold text-slate-200">{node.ql}</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">Buffer Occupancy (BO)</span>
                            <span className="font-mono text-sm font-bold text-slate-200">{node.bo}</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">Channel Busy Ratio (CBR)</span>
                            <span className="font-mono text-sm font-bold text-slate-200">{node.cbr}</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">Computed CL_i</span>
                            <span className={`font-mono text-sm font-bold ${cl > weights.tau ? 'text-red-400' : 'text-emerald-400'}`}>
                              {cl.toFixed(3)}
                            </span>
                          </div>
                        </div>

                        {/* Neighbor List */}
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block mb-1">Active V2V Neighbors (within {COMM_RANGE}m)</span>
                          <div className="flex flex-wrap gap-1">
                            {(neighborGraph[node.id] || []).map(n => (
                              <span key={n.neighborId} className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded">
                                Node {n.neighborId} ({Math.round(n.dist)}m)
                              </span>
                            ))}
                            {(neighborGraph[node.id] || []).length === 0 && (
                              <span className="text-slate-500 text-[10px]">No neighbor in range</span>
                            )}
                          </div>
                        </div>

                        {/* Inject Jam Action Button */}
                        <button
                          onClick={() => toggleTrafficJam(node.id)}
                          className={`w-full py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center space-x-2 transition-all ${
                            node.isJam
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>{node.isJam ? 'Clear Traffic Jam' : 'Inject Artificial Congestion Jam'}</span>
                        </button>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BENCHMARKS & PROTOCOL COMPARISON */}
        {/* ========================================================================= */}
        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <span className="text-slate-400 text-xs block mb-1">Packet Delivery Ratio (PDR)</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400">91.8%</span>
                  <span className="text-xs text-emerald-400 font-semibold">+27.6% vs AODV</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">High vehicle density (80 nodes)</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <span className="text-slate-400 text-xs block mb-1">End-to-End Delay</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-sky-400">44 ms</span>
                  <span className="text-xs text-sky-400 font-semibold">-121 ms vs AODV</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Avoids queue bottlenecks</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <span className="text-slate-400 text-xs block mb-1">Throughput Rate</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-purple-400">4.82 Mbps</span>
                  <span className="text-xs text-purple-400 font-semibold">1.8x vs GPSR</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Optimized bandwidth usage</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <span className="text-slate-400 text-xs block mb-1">Route Reselection Latency</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-amber-400">{"< 12 ms"}</span>
                  <span className="text-xs text-amber-400 font-semibold">Proactive</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Dynamic route maintenance</p>
              </div>
            </div>

            {/* Main Benchmark Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: PDR vs Vehicle Density */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center justify-between">
                  <span>Packet Delivery Ratio (PDR %) vs Vehicle Density</span>
                  <span className="text-xs text-emerald-400 font-mono">Higher is Better</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Evaluating performance across 20 to 100 vehicles in dense urban roads.
                </p>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={benchmarkData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="density" stroke="#94a3b8" label={{ value: 'Vehicle Density (Vehicles/km²)', position: 'insideBottom', offset: -5 }} />
                      <YAxis stroke="#94a3b8" domain={[40, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" />
                      <Line type="monotone" dataKey="Proposed" stroke="#38bdf8" strokeWidth={3} name="CAR-V2V (Proposed)" />
                      <Line type="monotone" dataKey="AODV" stroke="#ef4444" strokeWidth={2} name="AODV" />
                      <Line type="monotone" dataKey="DSR" stroke="#f59e0b" strokeWidth={2} name="DSR" />
                      <Line type="monotone" dataKey="GPSR" stroke="#a855f7" strokeWidth={2} name="GPSR" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: End-to-End Delay vs Vehicle Density */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center justify-between">
                  <span>End-to-End Delay (ms) vs Vehicle Density</span>
                  <span className="text-xs text-sky-400 font-mono">Lower is Better</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Proposed protocol bypasses intermediate buffer congestion to lower latency.
                </p>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={benchmarkData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="density" stroke="#94a3b8" label={{ value: 'Vehicle Density (Vehicles/km²)', position: 'insideBottom', offset: -5 }} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" />
                      <Line type="monotone" dataKey="delayProposed" stroke="#38bdf8" strokeWidth={3} name="CAR-V2V (Proposed)" />
                      <Line type="monotone" dataKey="delayAODV" stroke="#ef4444" strokeWidth={2} name="AODV" />
                      <Line type="monotone" dataKey="delayDSR" stroke="#f59e0b" strokeWidth={2} name="DSR" />
                      <Line type="monotone" dataKey="delayGPSR" stroke="#a855f7" strokeWidth={2} name="GPSR" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Radar Performance Overview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Multi-Criteria Performance Radar
                </h3>
                <p className="text-xs text-slate-400 mb-2">
                  Comprehensive comparison normalized scores (0-100).
                </p>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarMetricData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" />
                      <Radar name="CAR-V2V (Proposed)" dataKey="Proposed" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.4} />
                      <Radar name="AODV" dataKey="AODV" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                      <Radar name="GPSR" dataKey="GPSR" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Protocol Comparison Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">
                    Baseline Protocol Comparison Summary
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-2">Protocol</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Congestion Aware?</th>
                          <th className="p-2">Primary Bottleneck</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        <tr className="bg-sky-500/10">
                          <td className="p-2 font-bold text-sky-400">CAR-V2V (Proposed)</td>
                          <td className="p-2">Hybrid Multi-Metric</td>
                          <td className="p-2 text-emerald-400 font-bold">Yes (QL, BO, CBR)</td>
                          <td className="p-2 text-slate-300">None (Dynamic avoid)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-200">AODV</td>
                          <td className="p-2">Reactive Topology</td>
                          <td className="p-2 text-red-400">No (Min Hop Count)</td>
                          <td className="p-2 text-slate-400">Queue overflow & delays</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-200">DSR</td>
                          <td className="p-2">Source Routing</td>
                          <td className="p-2 text-red-400">No (Stale route cache)</td>
                          <td className="p-2 text-slate-400">High routing overhead</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-200">GPSR</td>
                          <td className="p-2">Geographic Greedy</td>
                          <td className="p-2 text-red-400">No (Distance greedy)</td>
                          <td className="p-2 text-slate-400">Local minimum void traps</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                  <span className="text-sky-400 font-semibold block mb-1">Key Research Takeaway:</span>
                  Traditional V2V routing protocols like AODV select paths based strictly on minimum hop count. In dense traffic, shortest paths become heavily congested, leading to buffer overflows and high packet drops. CAR-V2V dynamically routes around congested areas.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FORMULAS & MATHEMATICAL METHODOLOGY */}
        {/* ========================================================================= */}
        {activeTab === 'formulas' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-sky-400" />
                  Mathematical Formulation & Methodology
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Detailed mathematical equations behind Congestion Estimation, Link Quality, Composite Route Costing, and Dynamic Re-selection.
                </p>
              </div>

              {/* Equation 1: Node Congestion Level */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">
                  {"1. Local Node Congestion Level Estimator (CL_i)"}
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  {"Each vehicle i periodically measures its queue length, buffer occupancy, and wireless channel busy ratio, normalizing each metric between 0 and 1:"}
                </p>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center font-mono text-emerald-400 text-sm my-2">
                  {"CL_i = α · QL_i + β · BO_i + γ · CBR_i"}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 mt-3 font-mono">
                  <div className="bg-slate-900 p-2 rounded">QL_i: Normalized Queue Length</div>
                  <div className="bg-slate-900 p-2 rounded">BO_i: Buffer Occupancy Ratio</div>
                  <div className="bg-slate-900 p-2 rounded">CBR_i: Channel Busy Ratio</div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {"Constraint: α + β + γ = 1. Default values: α = 0.40, β = 0.35, γ = 0.25."}
                </p>
              </div>

              {/* Equation 2: Route Bottleneck Congestion */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">
                  {"2. Route Bottleneck Congestion Level CL(P)"}
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  {"A multi-hop path's throughput is limited by its most congested link or node (the bottleneck node):"}
                </p>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center font-mono text-sky-400 text-sm my-2">
                  {"CL(P) = max_{e_i ∈ P} ( CL_i )"}
                </div>
              </div>

              {/* Equation 3: Composite Route Cost Formulation */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">
                  {"3. Composite Route Cost Metric C(P)"}
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  {"To select the optimal path P*, candidate routes are scored using a weighted multi-metric composite cost:"}
                </p>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center font-mono text-purple-400 text-sm my-2">
                  {"C(P) = w₁·CL(P) + w₂·D(P) + w₃·PL(P) + w₄·(1 - LQ(P)) + w₅·HC(P)"}
                </div>

                <ul className="text-xs text-slate-300 space-y-1 mt-3 font-mono list-disc list-inside">
                  <li>{"D(P): Cumulative end-to-end delay along path P"}</li>
                  <li>{"PL(P): Estimated cumulative packet loss ratio"}</li>
                  <li>{"LQ(P): Average link quality based on signal strength & distance"}</li>
                  <li>{"HC(P): Hop count ratio (HC / HC_max)"}</li>
                </ul>
              </div>

              {/* Equation 4: Dynamic Re-selection Trigger */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">
                  {"4. Dynamic Route Selection & Re-Routing Threshold (τ)"}
                </h3>
                <p className="text-xs text-slate-400 mb-2">
                  {"The active path P* is selected via minimum cost:"}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center font-mono text-amber-300 text-xs mb-3">
                  {"P* = arg min_{P ∈ K} C(P)"}
                </div>
                <p className="text-xs text-slate-400">
                  {"During transmission, intermediate nodes monitor CL(P*). If CL(P*) > τ, the source node is notified to switch to the next best candidate route instantly without triggering full flooding discovery."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PROJECT ARCHITECTURE & MODULE MAP */}
        {/* ========================================================================= */}
        {activeTab === 'architecture' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="border-b border-slate-800 pb-4 mb-6">
                <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-sky-400" />
                  Project Directory Architecture & Modules
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Modular design breakdown for implementation in OMNeT++/Veins, NS-3, and SUMO.
                </p>
              </div>

              {/* Directory Tree View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Code Structure Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300">
                  <div className="text-sky-400 font-bold mb-3 flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Congestion-Aware-V2V/
                  </div>
                  <div className="space-y-2 pl-3 border-l border-slate-800">
                    <div>
                      <span className="text-purple-400">├── mobility/</span>
                      <p className="text-[11px] text-slate-500 pl-4">└── SUMO/ (road network, vehicle routes, trace)</p>
                    </div>
                    <div>
                      <span className="text-purple-400">├── simulation/</span>
                      <p className="text-[11px] text-slate-500 pl-4">└── OMNeT++_Veins / NS-3 (IEEE 802.11p WAVE)</p>
                    </div>
                    <div>
                      <span className="text-purple-400">├── routing/</span>
                      <p className="text-[11px] text-slate-500 pl-4">├── AODV / DSR / GPSR</p>
                      <p className="text-[11px] text-sky-400 font-semibold pl-4">└── CongestionAwareRouting.cc</p>
                    </div>
                    <div>
                      <span className="text-purple-400">├── congestion/</span>
                      <p className="text-[11px] text-slate-500 pl-4">├── QueueLength, BufferOccupancy, CBR</p>
                      <p className="text-[11px] text-slate-500 pl-4">└── CongestionLevelEstimator</p>
                    </div>
                    <div>
                      <span className="text-purple-400">├── route_selection/</span>
                      <p className="text-[11px] text-slate-500 pl-4">├── CandidateRoutes, RouteCostScorer</p>
                      <p className="text-[11px] text-slate-500 pl-4">└── DynamicReselectionEngine</p>
                    </div>
                    <div>
                      <span className="text-purple-400">├── experiments/</span>
                      <p className="text-[11px] text-slate-500 pl-4">└── low / medium / high vehicle density sweeps</p>
                    </div>
                    <div>
                      <span className="text-purple-400">└── results/</span>
                      <p className="text-[11px] text-slate-500 pl-4">└── delay, PDR, throughput, packet loss, overhead</p>
                    </div>
                  </div>
                </div>

                {/* Workflow Pipeline Description */}
                <div className="space-y-3 text-xs">
                  <h3 className="font-semibold text-slate-200">Execution Pipeline Flow</h3>
                  
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                    <div className="bg-sky-500/20 text-sky-400 p-2 rounded-lg font-bold">1</div>
                    <div>
                      <span className="font-semibold text-slate-200 block">SUMO Vehicle Mobility Simulation</span>
                      <p className="text-slate-400 text-[11px]">Generates realistic vehicle movement, traffic jams, and lane changes in a dense urban grid network.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                    <div className="bg-sky-500/20 text-sky-400 p-2 rounded-lg font-bold">2</div>
                    <div>
                      <span className="font-semibold text-slate-200 block">Periodic Beaconing & Neighbor Table</span>
                      <p className="text-slate-400 text-[11px]">Vehicles broadcast periodic 802.11p beacons to exchange location, velocity, queue length, buffer occupancy, and CBR.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                    <div className="bg-sky-500/20 text-sky-400 p-2 rounded-lg font-bold">3</div>
                    <div>
                      <span className="font-semibold text-slate-200 block">K-Candidate Path Generation & Costing</span>
                      <p className="text-slate-400 text-[11px]">Source discovers K candidate paths and ranks them using composite cost C(P) based on congestion, delay, loss, and hop count.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                    <div className="bg-sky-500/20 text-sky-400 p-2 rounded-lg font-bold">4</div>
                    <div>
                      <span className="font-semibold text-slate-200 block">{"Dynamic Re-selection (τ Threshold)"}</span>
                      <p className="text-slate-400 text-[11px]">Continuous monitoring switches active path P* automatically if intermediate link congestion crosses threshold τ.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 px-6 text-center text-xs text-slate-500">
        Congestion-Aware Route Selection for V2V Multi-Hop Networks in Dense Traffic • Interactive Web Simulator
      </footer>
    </div>
  );
}
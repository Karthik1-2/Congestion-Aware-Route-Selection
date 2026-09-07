# Congestion-Aware Route Selection for V2V Networks

## About the Project

CAR-V2V is a congestion-aware routing system designed for **Vehicle-to-Vehicle (V2V) multi-hop communication** in dense urban traffic.

The system monitors network conditions such as **queue length, buffer occupancy, channel busy ratio, link quality, delay, and packet loss** to identify congestion and select a suitable route.

Unlike traditional routing approaches that mainly focus on shortest paths or hop count, CAR-V2V dynamically selects a **less-congested and reliable route** and re-selects the route when network conditions change.

## Key Features

- Congestion-aware multi-hop route selection
- Real-time congestion monitoring
- Dynamic route selection and re-selection
- V2V neighbor discovery
- Route cost calculation
- Interactive network visualization
- Performance comparison with AODV, DSR, and GPSR

## Working Process

```text
Vehicle Network
      ↓
Neighbor Discovery
      ↓
Collect Network Metrics
      ↓
Detect & Estimate Congestion
      ↓
Generate Candidate Routes
      ↓
Calculate Route Cost
      ↓
Select Best Route
      ↓
Monitor Active Route
      ↓
Re-select Route if Congested
Technologies Used
React
TypeScript
Vite
Tailwind CSS
Recharts
Lucide React
Project Goal

To improve packet delivery, reduce communication delay and packet loss, and provide reliable routing in highly dynamic and congested V2V networks.

Team Members
Dinesh Karthick N — 2024503038
Jai Kumaran S — 2024503052
Anwin Shellman J — 2024503532
Madhumitha S — 2024503032

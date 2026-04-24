"""
Weighted Dijkstra path-finding for stadium routing.

Nodes  = zone IDs
Edges  = GRAPH_EDGES with base_minutes weights
Dynamic = congestion multiplier applied to each edge weight.

Congestion multiplier:
  green   → 1.0x  (no penalty)
  yellow  → 1.5x
  red     → 3.0x
  unknown → 1.0x
"""
from __future__ import annotations
import heapq
from typing import Optional
from app.config import ZONES, GRAPH_EDGES


CONGESTION_WEIGHT = {"green": 1.0, "yellow": 1.5, "red": 3.0, "unknown": 1.0}


def build_graph(zone_states: dict[str, dict]) -> dict[str, list[tuple[str, float]]]:
    """Build adjacency list with live congestion weights."""
    graph: dict[str, list[tuple[str, float]]] = {z: [] for z in ZONES}

    for (a, b, base_min) in GRAPH_EDGES:
        color_a = zone_states.get(a, {}).get("color", "unknown")
        color_b = zone_states.get(b, {}).get("color", "unknown")
        w_ab = base_min * CONGESTION_WEIGHT[color_b]   # penalty on destination
        w_ba = base_min * CONGESTION_WEIGHT[color_a]
        graph[a].append((b, w_ab))
        graph[b].append((a, w_ba))

    return graph


def dijkstra(graph: dict[str, list[tuple[str, float]]], start: str, end: str) -> tuple[list[str], float]:
    """Return (path, total_minutes). Returns ([], inf) if no path."""
    dist: dict[str, float] = {n: float("inf") for n in graph}
    dist[start] = 0.0
    prev: dict[str, Optional[str]] = {n: None for n in graph}
    heap: list[tuple[float, str]] = [(0.0, start)]

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        if u == end:
            break
        for v, w in graph.get(u, []):
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                prev[v] = u
                heapq.heappush(heap, (nd, v))

    # Reconstruct path
    path: list[str] = []
    cur: Optional[str] = end
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    if not path or path[0] != start:
        return [], float("inf")
    return path, dist[end]


def suggest_route(
    from_zone: str,
    to_zone: str,
    zone_states: dict[str, dict],
) -> dict:
    """Return primary + alternate routes with time estimates."""

    # Primary: congestion-weighted
    graph_weighted = build_graph(zone_states)
    primary, primary_time = dijkstra(graph_weighted, from_zone, to_zone)

    # Alternate: unweighted (pure distance), penalise already-in-primary middle nodes
    graph_flat = build_graph({z: {"color": "unknown"} for z in ZONES})  # flat weights
    # Slightly increase weight of primary middle edges to force different path
    middle_primary = set(primary[1:-1])
    for node in middle_primary:
        for i, (nb, w) in enumerate(graph_flat.get(node, [])):
            graph_flat[node][i] = (nb, w * 8.0)

    alternate, alternate_time = dijkstra(graph_flat, from_zone, to_zone)

    # Time saved vs direct/alternate
    time_saved = max(0.0, alternate_time - primary_time) if alternate else 0.0

    # Congested zones avoided by primary route
    red_zones   = {z for z, st in zone_states.items() if st.get("color") == "red"}
    avoided     = [z for z in red_zones if z not in primary]

    return {
        "primary":            primary,
        "alternate":          alternate if alternate != primary else [],
        "primary_time":       round(primary_time, 1),
        "alternate_time":     round(alternate_time, 1),
        "time_saved":         round(time_saved, 1),
        "congestion_avoided": avoided,
    }

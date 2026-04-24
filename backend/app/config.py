"""
Stadium zones layout and graph definition.
SVG coordinate space: 1000 x 700
Zone GPS coordinates map to the SVG positions.
"""

from typing import Dict, List, Tuple

# --- Zone Definitions ---
ZONES: Dict[str, dict] = {
    "gate_n": {
        "id": "gate_n",
        "name": "Gate North",
        "type": "gate",
        "svg_x": 470,
        "svg_y": 70,
        "lat": 51.5568,
        "lng": -0.2795,
    },
    "gate_s": {
        "id": "gate_s",
        "name": "Gate South",
        "type": "gate",
        "svg_x": 470,
        "svg_y": 620,
        "lat": 51.5546,
        "lng": -0.2795,
    },
    "gate_e": {
        "id": "gate_e",
        "name": "Gate East",
        "type": "gate",
        "svg_x": 890,
        "svg_y": 345,
        "lat": 51.5557,
        "lng": -0.2768,
    },
    "gate_w": {
        "id": "gate_w",
        "name": "Gate West",
        "type": "gate",
        "svg_x": 50,
        "svg_y": 345,
        "lat": 51.5557,
        "lng": -0.2822,
    },
    "food_ne": {
        "id": "food_ne",
        "name": "Food Court NE",
        "type": "food",
        "svg_x": 740,
        "svg_y": 155,
        "lat": 51.5565,
        "lng": -0.2773,
    },
    "food_sw": {
        "id": "food_sw",
        "name": "Food Court SW",
        "type": "food",
        "svg_x": 200,
        "svg_y": 535,
        "lat": 51.5549,
        "lng": -0.2817,
    },
    "wash_nw": {
        "id": "wash_nw",
        "name": "Washroom NW",
        "type": "washroom",
        "svg_x": 200,
        "svg_y": 155,
        "lat": 51.5565,
        "lng": -0.2817,
    },
    "wash_se": {
        "id": "wash_se",
        "name": "Washroom SE",
        "type": "washroom",
        "svg_x": 740,
        "svg_y": 535,
        "lat": 51.5549,
        "lng": -0.2773,
    },
}

# --- Walking Graph ---
# (zone_a, zone_b, base_distance_minutes)
GRAPH_EDGES: List[Tuple[str, str, float]] = [
    ("gate_n", "food_ne", 2.0),
    ("gate_n", "wash_nw", 2.0),
    ("gate_n", "gate_e", 3.5),
    ("gate_n", "gate_w", 3.5),
    ("gate_s", "food_sw", 2.0),
    ("gate_s", "wash_se", 2.0),
    ("gate_s", "gate_e", 3.5),
    ("gate_s", "gate_w", 3.5),
    ("gate_e", "food_ne", 2.5),
    ("gate_e", "wash_se", 2.5),
    ("gate_w", "wash_nw", 2.5),
    ("gate_w", "food_sw", 2.5),
    ("food_ne", "wash_se", 4.0),
    ("food_sw", "wash_nw", 4.0),
    ("food_ne", "gate_e", 2.5),
    ("food_sw", "gate_w", 2.5),
    ("wash_nw", "gate_n", 2.0),
    ("wash_se", "gate_s", 2.0),
    ("food_ne", "food_sw", 6.0),
    ("wash_nw", "wash_se", 6.0),
]

# Congestion threshold constants (minutes)
WAIT_GREEN_MAX = 3.0   # < 3 min  -> green
WAIT_YELLOW_MAX = 8.0  # 3-8 min  -> yellow
                        # > 8 min  -> red

# Points rewards
POINTS_JOIN_QUEUE = 5
POINTS_LEAVE_QUEUE = 2
POINTS_FOLLOW_ROUTE = 10
POINTS_CORRECT_PREDICTION = 15
POINTS_BEAT_RUSH = 20

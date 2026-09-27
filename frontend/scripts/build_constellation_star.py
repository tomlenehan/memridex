"""Build the portable, shape-only Lottie mascot used on the memory map.

Run from anywhere with: python3 frontend/scripts/build_constellation_star.py
The output has no images, fonts, expressions, masks, or web-only effects so it
can also be used by a native iOS Lottie player.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


OUTPUT = Path(__file__).resolve().parents[1] / "public/animations/constellation-star.json"
FRAMES = 120


def color(value: str) -> list[float]:
    return [round(int(value[index : index + 2], 16) / 255, 6) for index in (1, 3, 5)] + [1]


def static(value: object) -> dict:
    return {"a": 0, "k": value}


def animated(stops: list[tuple[int, object]]) -> dict:
    keys = []
    for index, (frame, value) in enumerate(stops):
        key = {"t": frame, "s": value if isinstance(value, list) else [value]}
        if index < len(stops) - 1:
            next_value = stops[index + 1][1]
            key.update(
                {
                    "e": next_value if isinstance(next_value, list) else [next_value],
                    "i": {"x": [0.58], "y": [1]},
                    "o": {"x": [0.42], "y": [0]},
                }
            )
        keys.append(key)
    return {"a": 1, "k": keys}


def transform(
    *,
    position: object = None,
    anchor: object = None,
    scale: object = None,
    rotation: object = None,
    opacity: object = None,
    group: bool = False,
) -> dict:
    props = {
        "a": static(anchor if anchor is not None else ([0, 0] if group else [0, 0, 0])),
        "p": position if isinstance(position, dict) else static(position if position is not None else ([0, 0] if group else [0, 0, 0])),
        "s": scale if isinstance(scale, dict) else static(scale if scale is not None else ([100, 100] if group else [100, 100, 100])),
        "r": rotation if isinstance(rotation, dict) else static(rotation if rotation is not None else 0),
        "o": opacity if isinstance(opacity, dict) else static(opacity if opacity is not None else 100),
    }
    if group:
        props.update({"ty": "tr", "sk": static(0), "sa": static(0), "nm": "Transform"})
    return props


def path(vertices: list[list[float]], incoming=None, outgoing=None, closed=True, name="Path") -> dict:
    count = len(vertices)
    return {
        "ty": "sh",
        "ks": static(
            {
                "v": vertices,
                "i": incoming or [[0, 0] for _ in range(count)],
                "o": outgoing or [[0, 0] for _ in range(count)],
                "c": closed,
            }
        ),
        "nm": name,
    }


def rounded_star(cx: float, cy: float, outer: float, inner: float, points=5, rounding=0.12) -> dict:
    corners = []
    for index in range(points * 2):
        angle = -math.pi / 2 + index * math.pi / points
        radius = outer if index % 2 == 0 else inner
        corners.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))

    vertices, incoming, outgoing = [], [], []
    for index, vertex in enumerate(corners):
        previous = corners[index - 1]
        following = corners[(index + 1) % len(corners)]
        before = [vertex[axis] + rounding * (previous[axis] - vertex[axis]) for axis in (0, 1)]
        after = [vertex[axis] + rounding * (following[axis] - vertex[axis]) for axis in (0, 1)]
        vertices.extend([[round(v, 3) for v in before], [round(v, 3) for v in after]])
        incoming.extend([[0, 0], [round((vertex[axis] - after[axis]) * 2 / 3, 3) for axis in (0, 1)]])
        outgoing.extend([[round((vertex[axis] - before[axis]) * 2 / 3, 3) for axis in (0, 1)], [0, 0]])
    return path(vertices, incoming, outgoing, name="Soft five-point star")


def ellipse(width: float, height: float, name="Ellipse") -> dict:
    return {"ty": "el", "p": static([0, 0]), "s": static([width, height]), "d": 1, "nm": name}


def fill(hex_value: str, opacity=100) -> dict:
    return {"ty": "fl", "c": static(color(hex_value)), "o": static(opacity), "r": 1, "bm": 0, "nm": "Fill"}


def stroke(hex_value: str, width: float, opacity=100) -> dict:
    return {
        "ty": "st",
        "c": static(color(hex_value)),
        "o": static(opacity),
        "w": static(width),
        "lc": 2,
        "lj": 2,
        "ml": 4,
        "bm": 0,
        "nm": "Stroke",
    }


def group(name: str, *items: dict, **transform_options) -> dict:
    return {
        "ty": "gr",
        "it": [*items, transform(group=True, **transform_options)],
        "nm": name,
        "np": len(items),
        "cix": 2,
        "bm": 0,
    }


def layer(index: int, name: str, shapes: list[dict], parent: int | None = None, **transform_options) -> dict:
    result = {
        "ddd": 0,
        "ind": index,
        "ty": 4,
        "nm": name,
        "sr": 1,
        "ks": transform(**transform_options),
        "ao": 0,
        "shapes": shapes,
        "ip": 0,
        "op": FRAMES,
        "st": 0,
        "bm": 0,
    }
    if parent is not None:
        result["parent"] = parent
    return result


def dot(x: float, y: float, diameter: float, hex_value: str, opacity=100) -> dict:
    return group(
        "Constellation point",
        ellipse(diameter, diameter),
        fill(hex_value, opacity),
        position=[x, y],
    )


def build() -> dict:
    floating = animated([(0, [128, 119, 0]), (30, [128, 111, 0]), (60, [128, 119, 0]), (90, [128, 111, 0]), (120, [128, 119, 0])])
    swaying = animated([(0, -2), (30, 2), (60, -2), (90, 2), (120, -2)])
    blink = animated([(0, [100, 100]), (47, [100, 100]), (50, [100, 8]), (53, [100, 100]), (101, [100, 100]), (104, [100, 8]), (107, [100, 100]), (120, [100, 100])])

    sparkle_a = group(
        "Teal twinkle",
        rounded_star(0, 0, 10, 3, 4, 0.13),
        fill("#4B8D82"),
        position=[211, 65],
        scale=animated([(0, [65, 65]), (24, [112, 112]), (55, [65, 65]), (84, [105, 105]), (120, [65, 65])]),
        opacity=animated([(0, 55), (24, 100), (55, 55), (84, 95), (120, 55)]),
    )
    sparkle_b = group(
        "Apricot twinkle",
        rounded_star(0, 0, 7, 2.5, 4, 0.14),
        fill("#D88B4A"),
        position=[48, 177],
        scale=animated([(0, [100, 100]), (38, [65, 65]), (70, [120, 120]), (120, [100, 100])]),
        opacity=animated([(0, 85), (38, 50), (70, 100), (120, 85)]),
    )

    eyes = []
    for name, x in (("Left eye", 110), ("Right eye", 146)):
        eyes.append(
            group(
                name,
                ellipse(8, 12, "Eye"),
                fill("#17353B"),
                group("Eye glint", ellipse(2.2, 2.5), fill("#FFFDF5"), position=[-1.6, -2.5]),
                position=[x, 121],
                scale=blink,
            )
        )

    smile = path(
        [[116, 139], [140, 139]],
        incoming=[[0, 0], [-6, 10]],
        outgoing=[[6, 10], [0, 0]],
        closed=False,
        name="Warm smile",
    )
    legs = [
        group("Left leg", path([[103, 162], [101, 188]], closed=False), stroke("#2F716A", 6)),
        group("Right leg", path([[153, 162], [155, 188]], closed=False), stroke("#2F716A", 6)),
        group("Left foot", ellipse(22, 10), fill("#2F716A"), position=[98, 191]),
        group("Right foot", ellipse(22, 10), fill("#2F716A"), position=[158, 191]),
    ]

    constellation = path(
        [[32, 78], [62, 59], [211, 65], [226, 168]],
        closed=False,
        name="Constellation thread",
    )
    layers = [
        layer(1, "Little stars — alternating twinkle", [sparkle_a, sparkle_b, dot(35, 76, 5, "#4B8D82", 70), dot(225, 168, 5, "#D88B4A", 75)]),
        layer(2, "Eyes — blink twice", eyes, parent=10),
        layer(3, "Smile", [group("Smile", smile, stroke("#17353B", 3.4))], parent=10),
        layer(4, "Rosy cheeks", [group("Left cheek", ellipse(14, 7), fill("#E38E79", 63), position=[92, 138]), group("Right cheek", ellipse(14, 7), fill("#E38E79", 63), position=[164, 138])], parent=10),
        layer(5, "Soft reflected light", [group("Pearl highlight", ellipse(23, 9), fill("#FFF9E5", 75), position=[96, 98], rotation=-28)], parent=10),
        layer(6, "Star character — warm gold", [group("Rounded star", rounded_star(128, 119, 78, 48), fill("#F7D783"), stroke("#D88B4A", 3.5))], parent=10),
        layer(7, "Dancing little feet", legs, parent=10),
        layer(8, "Halo", [group("Quiet halo", ellipse(176, 176), fill("#F7D783", 19), position=[128, 119])], parent=10),
        {
            "ddd": 0,
            "ind": 10,
            "ty": 3,
            "nm": "Character bob and sway",
            "sr": 1,
            "ks": transform(position=floating, anchor=[128, 119, 0], rotation=swaying),
            "ao": 0,
            "ip": 0,
            "op": FRAMES,
            "st": 0,
            "bm": 0,
        },
        layer(11, "Constellation thread", [group("Linked stars", constellation, stroke("#4B8D82", 1.5, 24)), dot(62, 59, 5, "#4B8D82", 52)]),
        layer(12, "Grounding shadow", [group("Breathing shadow", ellipse(94, 12), fill("#4B8D82", 18), position=[128, 220], scale=animated([(0, [100, 100]), (30, [88, 88]), (60, [100, 100]), (90, [88, 88]), (120, [100, 100])]))]),
    ]
    return {
        "v": "5.10.2",
        "fr": 30,
        "ip": 0,
        "op": FRAMES,
        "w": 256,
        "h": 256,
        "nm": "MemriPlace constellation companion",
        "ddd": 0,
        "assets": [],
        "layers": layers,
        "markers": [],
    }


if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(build(), separators=(",", ":")) + "\n")
    print(f"Wrote {OUTPUT}")

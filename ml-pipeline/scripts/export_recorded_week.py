"""
Export the most recent recorded week of occupancy for the app's
"forecast vs actual" comparison.

For each weekday and hour, "gym" is the share of equipment types that were
fully occupied (mean of is_fully_occupied across the 8 types). That is the
observed counterpart of the app's gym-wide forecast (mean predicted
probability across the same 8 types), so the two can be plotted side by side.

Run from ml-pipeline/:
    python scripts/export_recorded_week.py
Writes models/recorded_occupancy.json and copies it to the mobile app.
"""
import json
import shutil
from collections import defaultdict
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "synthetic_occupancy_data.csv"
OUT = ROOT / "models" / "recorded_occupancy.json"
APP = ROOT.parent / "mobile-app" / "src" / "data" / "recorded_occupancy.json"


def main():
    df = pd.read_csv(SRC)
    week = int(df["week"].max())
    last = df[df["week"] == week]

    data = defaultdict(dict)
    for (weekday, hour), g in last.groupby(["weekday", "hour"]):
        data[weekday][str(int(hour))] = {
            "gym": round(float(g["is_fully_occupied"].mean()), 3),
            "equipment": {r.equipment_type: int(r.is_fully_occupied) for r in g.itertuples()},
        }

    out = {
        "source": "synthetic_occupancy_data.csv",
        "week": week,
        "note": "Recorded outcomes for the latest week of the demo dataset. "
        "gym = share of equipment types fully occupied.",
        "data": data,
    }
    OUT.write_text(json.dumps(out, indent=1))
    shutil.copy(OUT, APP)
    print(f"Wrote {OUT} and {APP} (week {week}, {sum(len(v) for v in data.values())} hours)")


if __name__ == "__main__":
    main()

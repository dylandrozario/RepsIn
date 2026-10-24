#!/usr/bin/env python3
"""
One-time seed: turn BestTime foot-traffic data for real Boston gyms into the
app's data files. Reads a BestTime venue-search progress JSON (saved locally)
and writes:

  mobile-app/src/data/bostonGyms.json          — real gym list (name, address, geo, hours)
  mobile-app/src/data/occupancyPredictions.json — per-gym, per-equipment hourly
                                                   busyness derived from real venue curves

IMPORTANT: run locally only. Uses data already fetched with the private key;
the private key is NOT referenced here and never ships in the app.

Usage:
  .venv/bin/python ml-pipeline/scripts/seed_boston_gyms.py /tmp/bt_progress.json
"""
import json
import sys
import os

WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

# Equipment catalog (kept from the app) with a "demand multiplier" — how much
# busier/quieter this equipment tends to be vs. the venue's overall traffic.
EQUIPMENT = [
    ('bench_press', 'Bench Press', 3, 1.15),
    ('squat_rack', 'Squat Rack', 2, 1.10),
    ('leg_press', 'Leg Press', 2, 0.85),
    ('cable_machine', 'Cable Machine', 4, 0.80),
    ('treadmill', 'Treadmill', 10, 0.70),
    ('rowing_machine', 'Rowing Machine', 5, 0.55),
    ('dumbbells', 'Dumbbell Area', 15, 0.95),
    ('smith_machine', 'Smith Machine', 1, 1.20),
]

HOURS = list(range(6, 23))  # 6..22


def congestion_level(p):
    if p < 0.34:
        return 'low'
    if p < 0.67:
        return 'moderate'
    return 'high'


def slugify(name):
    return ''.join(c.lower() if c.isalnum() else '-' for c in name).strip('-')


def main(path):
    data = json.load(open(path))
    venues = [v for v in data.get('venues', []) if v.get('venue_foot_traffic_forecast')]
    if not venues:
        print('No venues with foot-traffic data found.')
        sys.exit(1)

    gyms = []
    predictions = {}  # gymId -> equipmentType -> weekday -> hour -> {probability, congestion_level}

    for v in venues:
        name = v['venue_name']
        gym_id = 'gym-' + slugify(name)[:32]
        ft = v['venue_foot_traffic_forecast']  # 7 days

        # Operating hours from day_info (fallback 6-22).
        hours = {}
        for day in ft:
            di = day['day_int']
            info = day.get('day_info', {})
            opn = info.get('venue_open', 6)
            cls = info.get('venue_closed', 22)
            if cls <= opn:
                opn, cls = 6, 22
            hours[WEEKDAYS[di]] = {'open': int(opn), 'close': int(cls)}

        gyms.append({
            'id': gym_id,
            'name': name,
            'address': v.get('venue_address', ''),
            'lat': v.get('venue_lat'),
            'lng': v.get('venue_lon'),
            'operatingHours': hours,
            'equipment': [
                {'type': t, 'name': n, 'units': u} for (t, n, u, _m) in EQUIPMENT
            ],
            'source': 'BestTime foot-traffic data',
        })

        # Build per-equipment predictions from the venue's real busyness curve.
        gym_pred = {}
        # index day_raw by day_int for quick lookup
        by_day = {d['day_int']: d['day_raw'] for d in ft}
        for (t, _n, _u, mult) in EQUIPMENT:
            gym_pred[t] = {}
            for di, weekday in enumerate(WEEKDAYS):
                raw = by_day.get(di)
                gym_pred[t][weekday] = {}
                for h in HOURS:
                    # day_raw is a 24-length array of 0..100 relative busyness.
                    base = (raw[h] / 100.0) if raw and h < len(raw) else 0.4
                    p = max(0.02, min(0.98, base * mult))
                    gym_pred[t][weekday][str(h)] = {
                        'probability': round(p, 2),
                        'congestion_level': congestion_level(p),
                    }
        predictions[gym_id] = gym_pred

    out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'mobile-app', 'src', 'data')
    out_dir = os.path.abspath(out_dir)

    with open(os.path.join(out_dir, 'bostonGyms.json'), 'w') as f:
        json.dump(gyms, f, indent=2)
    with open(os.path.join(out_dir, 'occupancyPredictions.json'), 'w') as f:
        json.dump(predictions, f)

    print(f'Wrote {len(gyms)} Boston gyms to bostonGyms.json')
    print(f'Wrote per-gym predictions to occupancyPredictions.json')
    for g in gyms:
        print(f"  - {g['name']} ({g['address']})")


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '/tmp/bt_progress.json')

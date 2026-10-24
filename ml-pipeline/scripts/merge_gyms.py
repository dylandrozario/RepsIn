#!/usr/bin/env python3
"""
Merge an additional BestTime search result (e.g. all Planet Fitness locations)
into the existing bostonGyms.json + occupancyPredictions.json without re-fetching
everything. Dedupes by address. Disambiguates duplicate names by neighborhood.

Usage:
  .venv/bin/python ml-pipeline/scripts/merge_gyms.py /tmp/pf_progress.json
"""
import json
import os
import sys

WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
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
HOURS = list(range(6, 23))
DATA = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'mobile-app', 'src', 'data'))


def level(p):
    return 'low' if p < 0.34 else 'moderate' if p < 0.67 else 'high'


def slug(s):
    return ''.join(c.lower() if c.isalnum() else '-' for c in s).strip('-')


def neighborhood(addr):
    # crude: pull the city/area token before the state
    parts = addr.replace(',', '').split()
    for i, tok in enumerate(parts):
        if tok == 'MA' and i >= 1:
            return parts[i - 1]
    return ''


def main(path):
    gyms = json.load(open(os.path.join(DATA, 'bostonGyms.json')))
    preds = json.load(open(os.path.join(DATA, 'occupancyPredictions.json')))
    existing_addr = {g['address'] for g in gyms}

    data = json.load(open(path))
    added = 0
    for v in data.get('venues', []):
        ft = v.get('venue_foot_traffic_forecast')
        if not ft:
            continue
        addr = v.get('venue_address', '')
        if addr in existing_addr:
            continue
        nb = neighborhood(addr)
        name = v['venue_name']
        disp = f'{name} — {nb}' if nb else name
        gid = 'gym-' + slug(disp)[:40]

        hours = {}
        for day in ft:
            info = day.get('day_info', {})
            opn, cls = info.get('venue_open', 6), info.get('venue_closed', 22)
            if cls <= opn:
                opn, cls = 6, 22
            hours[WEEKDAYS[day['day_int']]] = {'open': int(opn), 'close': int(cls)}

        gyms.append({
            'id': gid, 'name': disp, 'address': addr,
            'lat': v.get('venue_lat'), 'lng': v.get('venue_lon'),
            'operatingHours': hours,
            'equipment': [{'type': t, 'name': n, 'units': u} for (t, n, u, _m) in EQUIPMENT],
            'source': 'BestTime foot-traffic data',
        })
        by_day = {d['day_int']: d['day_raw'] for d in ft}
        gp = {}
        for (t, _n, _u, mult) in EQUIPMENT:
            gp[t] = {}
            for di, wd in enumerate(WEEKDAYS):
                raw = by_day.get(di)
                gp[t][wd] = {}
                for h in HOURS:
                    base = (raw[h] / 100.0) if raw and h < len(raw) else 0.4
                    p = max(0.02, min(0.98, base * mult))
                    gp[t][wd][str(h)] = {'probability': round(p, 2), 'congestion_level': level(p)}
        preds[gid] = gp
        existing_addr.add(addr)
        added += 1
        print('  + added', disp)

    json.dump(gyms, open(os.path.join(DATA, 'bostonGyms.json'), 'w'), indent=2)
    json.dump(preds, open(os.path.join(DATA, 'occupancyPredictions.json'), 'w'))
    print(f'Merged {added} new locations. Total gyms: {len(gyms)}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '/tmp/pf_progress.json')

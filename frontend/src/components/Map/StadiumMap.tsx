import { useStore, ZoneState, RouteResult } from '../../store';

// ── Zone metadata (matches backend config.py) ────────────────────────────────
const ZONE_META: Record<string, { label: string; icon: string; svgX: number; svgY: number }> = {
  gate_n:  { label: 'Gate N',       icon: '🚪', svgX: 470, svgY: 70  },
  gate_s:  { label: 'Gate S',       icon: '🚪', svgX: 470, svgY: 620 },
  gate_e:  { label: 'Gate E',       icon: '🚪', svgX: 890, svgY: 345 },
  gate_w:  { label: 'Gate W',       icon: '🚪', svgX: 50,  svgY: 345 },
  food_ne: { label: 'Food NE',      icon: '🍔', svgX: 740, svgY: 155 },
  food_sw: { label: 'Food SW',      icon: '🍔', svgX: 200, svgY: 535 },
  wash_nw: { label: 'Washroom NW',  icon: '🚻', svgX: 200, svgY: 155 },
  wash_se: { label: 'Washroom SE',  icon: '🚻', svgX: 740, svgY: 535 },
};

const COLOR_MAP: Record<string, string> = {
  green:   '#39ff14',
  yellow:  '#ffbe00',
  red:     '#ff3131',
  unknown: '#4a4a6e',
};

const BG_COLOR_MAP: Record<string, string> = {
  green:   'rgba(57,255,20,0.12)',
  yellow:  'rgba(255,190,0,0.12)',
  red:     'rgba(255,49,49,0.12)',
  unknown: 'rgba(74,74,110,0.12)',
};

const WALKAWAYS = [
  ['gate_n','food_ne'],['gate_n','wash_nw'],['gate_n','gate_e'],['gate_n','gate_w'],
  ['gate_s','food_sw'],['gate_s','wash_se'],['gate_s','gate_e'],['gate_s','gate_w'],
  ['gate_e','food_ne'],['gate_e','wash_se'],
  ['gate_w','wash_nw'],['gate_w','food_sw'],
  ['food_ne','wash_se'],['food_sw','wash_nw'],
];

interface Props {
  route: RouteResult | null;
}

export default function StadiumMap({ route }: Props) {
  const zones   = useStore((s) => s.zones);
  const selId   = useStore((s) => s.selectedZoneId);
  const setSelZ = useStore((s) => s.setSelectedZone);
  const userPos = useStore((s) => s.userPosition);

  // Merge live zone data with static SVG coords
  const resolvedZones = Object.keys(ZONE_META).map((id) => {
    const live = zones[id];
    const meta = ZONE_META[id];
    return {
      id,
      label: meta.label,
      icon: meta.icon,
      svgX: meta.svgX,
      svgY: meta.svgY,
      color: live?.color ?? 'unknown',
      active_users: live?.active_users ?? 0,
      avg_wait_seconds: live?.avg_wait_seconds ?? 0,
    };
  });

  // Route path IDs
  const routeEdges: Set<string> = new Set();
  if (route) {
    const path = route.primary;
    for (let i = 0; i < path.length - 1; i++) {
      routeEdges.add([path[i], path[i + 1]].sort().join(':'));
      routeEdges.add([path[i + 1], path[i]].sort().join(':'));
    }
  }

  return (
    <div style={{ perspective: '1200px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
      <div style={{
        transform: 'rotateX(55deg) rotateZ(-30deg) scale(1.4)',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s ease',
        boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,245,255,0.2)',
        borderRadius: '20px',
        background: '#07070f'
      }}>
        <svg
          viewBox="0 0 940 700"
          className="stadium-svg"
          style={{ 
            width: '100vw', 
            maxWidth: '1200px', 
            height: 'auto', 
            display: 'block'
          }}
        >
          {/* ── Outer stadium shell ── */}
          <g style={{ transform: 'translateZ(-20px)' }}>
            <ellipse cx="470" cy="350" rx="430" ry="318" fill="#0c0c1e" stroke="rgba(0,245,255,0.10)" strokeWidth="1" />
          </g>

          {/* ── Stands gradient ── */}
          <g style={{ transform: 'translateZ(-10px)' }}>
            <ellipse cx="470" cy="350" rx="380" ry="278" fill="none" stroke="rgba(0,245,255,0.07)" strokeWidth="40" />
          </g>

          {/* ── Track ── */}
          <ellipse cx="470" cy="350" rx="265" ry="195" fill="none" stroke="#1a1a35" strokeWidth="28" />
          <ellipse cx="470" cy="350" rx="265" ry="195" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

          {/* ── Pitch ── */}
          <ellipse cx="470" cy="350" rx="236" ry="166" fill="#0d3b1f" stroke="#1a6b38" strokeWidth="1.5" />
          {/* Center circle */}
          <circle cx="470" cy="350" r="38" fill="none" stroke="#1a6b38" strokeWidth="1" />
          {/* Center spot */}
          <circle cx="470" cy="350" r="3" fill="#1a6b38" />
          {/* Halfway line */}
          <line x1="234" y1="350" x2="706" y2="350" stroke="#1a6b38" strokeWidth="1" />
          {/* Goal areas */}
          <rect x="234" y="310" width="44" height="80" fill="none" stroke="#1a6b38" strokeWidth="1" />
          <rect x="662" y="310" width="44" height="80" fill="none" stroke="#1a6b38" strokeWidth="1" />
          {/* Penalty spots */}
          <circle cx="278" cy="350" r="2" fill="#1a6b38" />
          <circle cx="662" cy="350" r="2" fill="#1a6b38" />

          {/* ── Corner arcs ── */}
          {[
            [234, 184],[706, 184],[234, 516],[706, 516]
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="10" fill="none" stroke="#1a6b38" strokeWidth="1" />
          ))}

          {/* ── Seat sections (decorative arcs) ── */}
          {[0.2, 0.5, 0.8].map((t, i) => (
            <ellipse
              key={i}
              cx="470" cy="350"
              rx={310 + i * 22} ry={228 + i * 17}
              fill="none"
              stroke="rgba(255,255,255,0.025)"
              strokeWidth="18"
              strokeDasharray="4 6"
            />
          ))}

          {/* ── Walkway edges ── */}
          <g style={{ transform: 'translateZ(10px)' }}>
            {WALKAWAYS.map(([a, b]) => {
              const ma = ZONE_META[a]; const mb = ZONE_META[b];
              if (!ma || !mb) return null;
              const edgeKey = [a, b].sort().join(':');
              const isRoute = routeEdges.has(edgeKey);
              return (
                <line
                  key={edgeKey}
                  x1={ma.svgX} y1={ma.svgY}
                  x2={mb.svgX} y2={mb.svgY}
                  stroke={isRoute ? '#00f5ff' : 'rgba(255,255,255,0.06)'}
                  strokeWidth={isRoute ? 3 : 1}
                  strokeDasharray={isRoute ? '8 4' : '4 6'}
                  style={{ transition: 'all 0.4s' }}
                />
              );
            })}
          </g>

          {/* ── Route glow overlay ── */}
          <g style={{ transform: 'translateZ(15px)' }}>
            {route && route.primary.map((id, i) => {
              if (i === 0) return null;
              const prev = route.primary[i - 1];
              const ma = ZONE_META[prev]; const mb = ZONE_META[id];
              if (!ma || !mb) return null;
              return (
                <line
                  key={`route-${i}`}
                  x1={ma.svgX} y1={ma.svgY}
                  x2={mb.svgX} y2={mb.svgY}
                  stroke="rgba(0,245,255,0.25)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* ── Zone nodes ── */}
          <g style={{ transform: 'translateZ(25px)' }}>
            {resolvedZones.map((z) => {
              const col = COLOR_MAP[z.color];
              const bg  = BG_COLOR_MAP[z.color];
              const sel = selId === z.id;
              const inRoute = route?.primary.includes(z.id);

              return (
                <g
                  key={z.id}
                  transform={`translate(${z.svgX},${z.svgY})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelZ(sel ? null : z.id)}
                >
                  {/* Pulse rings */}
                  {z.color !== 'unknown' && (
                    <>
                      <circle r="22" fill="none" stroke={col} strokeWidth="1.5" opacity="0.4">
                        <animate attributeName="r" values="22;42" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle r="22" fill="none" stroke={col} strokeWidth="1" opacity="0.2">
                        <animate attributeName="r" values="22;52" dur="2s" begin="0.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.2;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}

                  {/* Main circle */}
                  <circle
                    r={sel ? 20 : 16}
                    fill={bg}
                    stroke={sel ? col : 'rgba(0,245,255,0.25)'}
                    strokeWidth={sel ? 2.5 : 1.5}
                    style={{ transition: 'all 0.2s', filter: sel ? `drop-shadow(0 0 8px ${col})` : 'none' }}
                  />

                  {/* Route highlight ring */}
                  {inRoute && (
                    <circle
                      r="24"
                      fill="none"
                      stroke="#00f5ff"
                      strokeWidth="2"
                      strokeDasharray="5 3"
                      opacity="0.8"
                    />
                  )}

                  {/* Icon */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="13"
                    style={{ userSelect: 'none', transform: 'rotateX(-55deg) rotateZ(30deg)' }}
                  >
                    {z.icon}
                  </text>

                  {/* Label */}
                  <text
                    y="28"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.75)"
                    fontSize="9"
                    fontFamily="'Rajdhani',sans-serif"
                    fontWeight="600"
                    letterSpacing="0.06em"
                    style={{ userSelect: 'none' }}
                  >
                    {z.label.toUpperCase()}
                  </text>

                  {/* Wait time */}
                  {z.avg_wait_seconds > 0 && (
                    <text
                      y="39"
                      textAnchor="middle"
                      fill={col}
                      fontSize="8"
                      fontFamily="'Orbitron',monospace"
                      fontWeight="700"
                      style={{ userSelect: 'none' }}
                    >
                      {Math.ceil(z.avg_wait_seconds / 60)}m
                    </text>
                  )}

                  {/* Users badge */}
                  {z.active_users > 0 && (
                    <g transform="translate(14,-14)">
                      <circle r="9" fill={col} opacity="0.9" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#000"
                        fontSize="7"
                        fontFamily="'Orbitron',monospace"
                        fontWeight="900"
                        style={{ userSelect: 'none' }}
                      >
                        {z.active_users}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── User position ── */}
          {userPos && (
            <g style={{ transform: `translate(${userPos[0]}px, ${userPos[1]}px) translateZ(40px)` }}>
              <circle r="8" fill="#00f5ff" opacity="0.9" stroke="white" strokeWidth="1.5" />
              <circle r="14" fill="none" stroke="#00f5ff" strokeWidth="1">
                <animate attributeName="r" values="8;20" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <text y="-18" textAnchor="middle" fill="#00f5ff" fontSize="8" fontFamily="'Rajdhani',sans-serif" fontWeight="700">
                YOU
              </text>
            </g>
          )}

          {/* ── Legend ── */}
          <g style={{ transform: 'translate(16px, 16px) translateZ(50px)' }}>
            <rect width="130" height="76" rx="6" fill="rgba(7,7,15,0.85)" stroke="rgba(0,245,255,0.12)" strokeWidth="1" />
            {[
              { col: '#39ff14', label: 'Low wait (<3 min)',  y: 18 },
              { col: '#ffbe00', label: 'Moderate (3–8 min)', y: 38 },
              { col: '#ff3131', label: 'High wait (>8 min)', y: 58 },
            ].map(({ col, label, y }) => (
              <g key={y} transform={`translate(10,${y})`}>
                <circle r="5" fill={col} cx="5" cy="0" />
                <text x="16" dominantBaseline="middle" fill="rgba(255,255,255,0.7)" fontSize="8.5" fontFamily="'Inter',sans-serif">
                  {label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

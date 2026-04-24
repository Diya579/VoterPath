import { useState } from 'react';
import { useStore } from '../../store';

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'VIP'];

export default function SeatSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState('A');
  const [row, setRow] = useState('1');
  const [seat, setSeat] = useState('1');
  const [saved, setSaved] = useState(false);

  const setUserPosition = useStore((s) => s.setUserPosition);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    // Map sections to approximate SVG coordinates on the stadium
    const sectionCoords: Record<string, [number, number]> = {
      'A': [470, 150], // North
      'B': [750, 350], // East
      'C': [470, 550], // South
      'D': [190, 350], // West
      'E': [680, 200], // North-East
      'F': [260, 500], // South-West
      'VIP': [470, 280] // Center-North
    };
    
    const baseCoords = sectionCoords[section] || [470, 350];
    
    // Add small deterministic jitter based on row/seat so it feels exact
    const r = parseInt(row) || 1;
    const s = parseInt(seat) || 1;
    const offsetX = (s % 10) * 5 - 25;
    const offsetY = (r % 10) * 5 - 25;

    setUserPosition([baseCoords[0] + offsetX, baseCoords[1] + offsetY]);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)',
            padding: '10px 16px',
            borderRadius: '8px',
            color: 'white',
            fontFamily: 'var(--font-heading)',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          🪑 Select Your Seat
        </button>
      ) : (
        <div style={{
          background: 'rgba(15, 15, 35, 0.85)',
          border: '1px solid rgba(0, 245, 255, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          width: '280px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 20px rgba(0,245,255,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backdropFilter: 'blur(12px)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.1em', color: 'var(--cyan)' }}>LOCATE YOUR SEAT</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.2rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'}>✕</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.05em' }}>STADIUM SECTION</label>
            <select value={section} onChange={e => setSection(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
              {SECTIONS.map(s => <option key={s} value={s} style={{ background: '#111' }}>Section {s}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.05em' }}>ROW</label>
              <input type="number" min="1" max="50" value={row} onChange={e => setRow(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none', width: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.05em' }}>SEAT</label>
              <input type="number" min="1" max="100" value={seat} onChange={e => setSeat(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none', width: '100%' }} />
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="btn btn-cyan"
            style={{
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              marginTop: '4px',
            }}
          >
            CONFIRM LOCATION
          </button>
        </div>
      )}
      {saved && (
        <div style={{ position: 'absolute', top: 60, right: 0, background: 'var(--green)', color: '#000', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,255,0,0.3)', fontFamily: 'var(--font-heading)' }}>
          ✓ SEAT SAVED
        </div>
      )}
    </div>
  );
}

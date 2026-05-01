import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function EVMSimulator() {
  const { t } = useTranslation();
  const [votedFor, setVotedFor] = useState(null);
  const audioRef = useRef(null);

  const candidates = [
    { id: 1, name: 'Rajesh Kumar', party: 'Bharatiya Janata Party (BJP)' },
    { id: 2, name: 'Priya Patel', party: 'Indian National Congress (INC)' },
    { id: 3, name: 'Arvind Sharma', party: 'Aam Aadmi Party (AAP)' },
    { id: 4, name: 'S. K. Stalin', party: 'Dravida Munnetra Kazhagam (DMK)' },
    { id: 5, name: 'NOTA', party: 'None of the Above' }
  ];

  const handleVote = (id) => {
    if (votedFor) return;
    setVotedFor(id);
    
    if (!audioRef.current) {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2); 
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 2);
    }

    // Intentionally removed setTimeout to simulate the EVM locking after one vote
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-4xl font-black uppercase inline-block bg-primary p-3 brutal-border shadow-brutal-sm rotate-1 mb-8">{t('evm')}</h2>
      
      <div className="bg-gray-200 p-10 brutal-border shadow-brutal relative">
        <div className="absolute top-4 right-4 bg-tertiary px-4 py-2 brutal-border shadow-brutal-sm font-black uppercase tracking-widest rotate-2">
          Ready
        </div>
        
        <div className="space-y-6 mt-12 bg-white p-6 brutal-border">
          {candidates.map(candidate => (
            <div key={candidate.id} className="flex items-center justify-between bg-gray-100 p-6 brutal-border shadow-brutal-sm">
              <div className="flex-1">
                <h3 className="text-3xl font-black uppercase">{candidate.name}</h3>
                <p className="text-xl font-bold text-gray-600 bg-white inline-block px-2 brutal-border mt-2">{candidate.party}</p>
              </div>
              
              <div className="flex items-center space-x-8">
                {/* Red LED Indicator - Flat Brutalist Style */}
                <div 
                  className={`w-8 h-8 rounded-full border-4 border-black transition-colors ${votedFor === candidate.id ? 'bg-secondary' : 'bg-gray-400'}`}
                />
                
                {/* Blue Voting Button */}
                <button
                  onClick={() => handleVote(candidate.id)}
                  disabled={votedFor !== null}
                  className={`w-20 h-16 brutal-border transition-all ${votedFor !== null ? 'opacity-50 cursor-not-allowed bg-blue-300' : 'bg-blue-600 hover:bg-blue-500 shadow-brutal-sm active:translate-y-1 active:shadow-none'}`}
                  aria-label={`Vote for ${candidate.name}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Accessible vote confirmation announcement */}
      <p 
        className="text-2xl font-bold bg-white inline-block p-4 brutal-border shadow-brutal-sm mt-8 uppercase"
        aria-live="assertive"
        aria-atomic="true"
      >
        {votedFor
          ? `✅ Vote cast for ${candidates.find(c => c.id === votedFor)?.name}. Your vote has been recorded.`
          : t('evmInstruct')
        }
      </p>
    </div>
  );
}

import React from 'react';
import { useTwitchStatus } from '../hooks/useTwitchStatus';

export default function VotingBanner() {
  const { isLive, loading } = useTwitchStatus();

  // Don't show banner if not live or still loading
  if (loading || !isLive) {
    return null;
  }

  return (
    <div className="retro-container p-4 retro-glow mb-6 border-2 border-retro-cyan">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="animate-pulse">
            <span className="text-2xl">🔴</span>
          </div>
          <h2 className="retro-title text-xl font-bold text-retro-cyan">
            VOTING IS LIVE!
          </h2>
          <div className="animate-pulse">
            <span className="text-2xl">🔴</span>
          </div>
        </div>
        
        <div className="bg-retro-bg/50 p-4 rounded-lg border border-retro-cyan/30">
          <h3 className="text-lg font-bold text-retro-text mb-3">
            How to Vote for Stream Ideas:
          </h3>
          
          <div className="space-y-2 text-left max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <span className="bg-retro-cyan text-retro-bg px-2 py-1 rounded font-mono text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </span>
              <span className="text-retro-text">
                Find the <strong className="text-retro-cyan">Idea #</strong> in the idea cards below
              </span>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-retro-cyan text-retro-bg px-2 py-1 rounded font-mono text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </span>
              <span className="text-retro-text">
                Redeem <strong className="text-retro-cyan">"Vote for Stream Idea"</strong> reward on Twitch
              </span>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-retro-cyan text-retro-bg px-2 py-1 rounded font-mono text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </span>
              <span className="text-retro-text">
                Enter the idea number (e.g., <span className="font-mono bg-retro-bg px-1 rounded">012345</span>)
              </span>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-retro-cyan text-retro-bg px-2 py-1 rounded font-mono text-sm font-bold flex-shrink-0 mt-0.5">
                4
              </span>
              <span className="text-retro-text">
                Each vote costs <strong className="text-retro-cyan">100 channel points</strong>
              </span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              💡 <strong>Tip:</strong> You can vote multiple times for the same idea with more channel points!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

// Reusable ad placeholder component.
// Purpose: reserve responsive space for ad units (e.g., Google AdSense)
// Integration notes (do NOT include your AdSense script here unless you know what you're doing):
// - Replace the inner placeholder div with the AdSense <ins className="adsbygoogle" ...></ins>
//   and include the official AdSense script once globally (usually in index.html).
// - Keep the container classes so the layout reserves space and doesn't jump when ads load.

export default function AdSlot({ id = 'ad-slot', variant = 'leaderboard', client, slot }) {
  // variant: 'leaderboard' | 'square' | 'small'
  const base = 'w-full flex items-center justify-center overflow-hidden rounded-md';

  const variantMap = {
    leaderboard: `${base} h-20 sm:h-28 md:h-36 lg:h-44 bg-gray-50 border border-dashed border-gray-200`,
    square: `${base} h-40 sm:h-44 md:h-48 bg-gray-50 border border-dashed border-gray-200`,
    small: `${base} h-12 sm:h-14 bg-gray-50 border border-dashed border-gray-200`,
  };

  const className = variantMap[variant] || variantMap.leaderboard;

  return (
    <div id={id} className={className} role="region" aria-label="Advertisement placeholder">
      {/*
        Replace the following placeholder with your AdSense element when ready.
        Example AdSense replacement (do NOT include here automatically):
        <ins className="adsbygoogle"
             style={{display:'block'}}
             data-ad-client="ca-pub-XXXXXXXXXXXX"
             data-ad-slot="1234567890"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        Then call: (adsbygoogle = window.adsbygoogle || []).push({});

        For now we show a neutral placeholder so the layout does not shift and the UI remains organized.
      */}

      <div className="text-center px-4">
        <div className="text-xs text-gray-500">Ad space reserved</div>
        <div className="text-sm text-gray-700">{variant === 'small' ? 'Sponsored' : 'Advertisement'}</div>
      </div>
    </div>
  );
}

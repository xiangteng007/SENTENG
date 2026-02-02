import React from 'react';

/**
 * Skeleton Loading Components (UX-003)
 * Unified loading placeholders for better perceived performance
 */

export const Skeleton = ({ className = '', animate = true }) => (
  <div
    className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
  />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="px-6 py-4 border-b last:border-b-0 flex gap-4">
        {Array.from({ length: cols }).map((_, colIdx) => (
          <Skeleton key={colIdx} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonStats = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
        <Skeleton className="h-3 w-1/2 mb-2" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    ))}
  </div>
);

export default Skeleton;

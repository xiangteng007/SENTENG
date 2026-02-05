import React from 'react';

/**
 * PageLoadingSkeleton (PERF-003)
 * Professional loading states for lazy-loaded pages
 */
export const PageLoadingSkeleton = ({ type = 'default' }) => {
  const skeletonPulse = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]";
  
  if (type === 'table') {
    return (
      <div className="p-6 space-y-4">
        <div className={`h-8 w-48 rounded ${skeletonPulse}`} />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className={`h-6 w-24 rounded ${skeletonPulse}`} />
              <div className={`h-6 flex-1 rounded ${skeletonPulse}`} />
              <div className={`h-6 w-32 rounded ${skeletonPulse}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (type === 'dashboard') {
    return (
      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className={`h-4 w-20 mb-2 rounded ${skeletonPulse}`} />
              <div className={`h-8 w-24 rounded ${skeletonPulse}`} />
            </div>
          ))}
        </div>
        {/* Chart area */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className={`h-6 w-32 mb-4 rounded ${skeletonPulse}`} />
          <div className={`h-48 rounded-lg ${skeletonPulse}`} />
        </div>
      </div>
    );
  }
  
  if (type === 'form') {
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <div className={`h-8 w-48 rounded ${skeletonPulse}`} />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={`h-4 w-24 rounded ${skeletonPulse}`} />
            <div className={`h-10 w-full rounded-lg ${skeletonPulse}`} />
          </div>
        ))}
        <div className={`h-10 w-32 rounded-lg ${skeletonPulse}`} />
      </div>
    );
  }
  
  // Default
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <div className="absolute -inset-1 border-2 border-gray-300 border-t-amber-500 rounded-2xl animate-spin" />
        </div>
        <p className="text-gray-500 text-sm">載入中...</p>
      </div>
    </div>
  );
};

/**
 * SkeletonCard - Reusable skeleton card
 */
export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-xl p-4 shadow-sm ${className}`}>
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-3/4 bg-gray-200 rounded" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
    </div>
  </div>
);

/**
 * SkeletonTable - Skeleton for table content
 */
export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-2">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4 animate-pulse">
        <div className="h-5 w-1/4 bg-gray-200 rounded" />
        <div className="h-5 flex-1 bg-gray-100 rounded" />
        <div className="h-5 w-1/6 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

export default PageLoadingSkeleton;

/**
 * Enhanced Skeleton Components Library
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: UI/UX Designer 建議 - 增加更多 loading skeleton
 */

import React from 'react';

// Base Skeleton with pulse animation
export const SkeletonBase = ({ className = '', style = {} }) => (
  <div 
    className={`animate-pulse bg-zinc-200 rounded ${className}`}
    style={style}
  />
);

// Text Skeleton
export const SkeletonText = ({ lines = 1, width = 'full' }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBase 
        key={i}
        className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : `w-${width}`}`}
      />
    ))}
  </div>
);

// Avatar Skeleton
export const SkeletonAvatar = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  return <SkeletonBase className={`${sizes[size]} rounded-full`} />;
};

// Card Skeleton
export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
    <div className="flex items-center gap-3">
      <SkeletonAvatar size="lg" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-1/2" />
        <SkeletonBase className="h-3 w-1/3" />
      </div>
    </div>
    <SkeletonBase className="h-20 w-full" />
    <div className="flex gap-2">
      <SkeletonBase className="h-8 w-20" />
      <SkeletonBase className="h-8 w-20" />
    </div>
  </div>
);

// Stat Card Skeleton
export const SkeletonStatCard = () => (
  <div className="bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-2xl p-5 animate-pulse">
    <SkeletonBase className="w-10 h-10 rounded-xl bg-zinc-300 mb-3" />
    <SkeletonBase className="h-8 w-16 bg-zinc-300 mb-2" />
    <SkeletonBase className="h-4 w-24 bg-zinc-300" />
  </div>
);

// Table Row Skeleton
export const SkeletonTableRow = ({ columns = 5 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <SkeletonBase className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Table Skeleton
export const SkeletonTable = ({ rows = 5, columns = 5 }) => (
  <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
    <table className="w-full">
      <thead className="bg-zinc-50">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-3">
              <SkeletonBase className="h-4 w-3/4" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

// List Item Skeleton
export const SkeletonListItem = () => (
  <div className="flex items-center gap-3 p-3 animate-pulse">
    <SkeletonAvatar />
    <div className="flex-1 space-y-2">
      <SkeletonBase className="h-4 w-2/3" />
      <SkeletonBase className="h-3 w-1/2" />
    </div>
    <SkeletonBase className="h-6 w-16 rounded-full" />
  </div>
);

// Form Skeleton
export const SkeletonForm = ({ fields = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-10 w-full rounded-xl" />
      </div>
    ))}
    <SkeletonBase className="h-10 w-32 rounded-xl mt-6" />
  </div>
);

// Chart Skeleton
export const SkeletonChart = ({ type = 'bar' }) => (
  <div className="bg-white rounded-2xl border border-zinc-100 p-6">
    <div className="flex items-center justify-between mb-6">
      <SkeletonBase className="h-6 w-32" />
      <SkeletonBase className="h-8 w-24 rounded-lg" />
    </div>
    {type === 'bar' && (
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1">
            <SkeletonBase 
              className="w-full rounded-t" 
              style={{ height: `${40 + (i * 15)}px` }}
            />
          </div>
        ))}
      </div>
    )}
  </div>
);

// Dashboard Skeleton
export const SkeletonDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
    <div className="grid lg:grid-cols-2 gap-6">
      <SkeletonChart type="bar" />
      <SkeletonChart type="bar" />
    </div>
    <SkeletonTable rows={5} columns={6} />
  </div>
);

// Page Loading Skeleton
export const SkeletonPage = ({ title = true }) => (
  <div className="space-y-6 animate-pulse">
    {title && (
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBase className="h-8 w-48" />
          <SkeletonBase className="h-4 w-64" />
        </div>
        <SkeletonBase className="h-10 w-32 rounded-xl" />
      </div>
    )}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

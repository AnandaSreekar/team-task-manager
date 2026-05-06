import React from 'react';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/60 ${className}`}
      {...props}
    />
  );
};

export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <Skeleton className="h-40 w-full rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Skeleton className="lg:col-span-2 h-[400px] rounded-3xl" />
      <Skeleton className="h-[400px] rounded-3xl" />
    </div>
  </div>
);

export const ProjectCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
    <Skeleton className="h-10 w-10 rounded-xl" />
    <Skeleton className="h-6 w-3/4 rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-5/6 rounded" />
    </div>
    <div className="pt-4 border-t border-slate-100 flex justify-between">
      <Skeleton className="h-3 w-20 rounded" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 3 }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <div className="flex gap-4">
          {[...Array(cols)].map((_, i) => (
            <Skeleton key={i} className={`h-4 rounded ${i === 0 ? 'flex-1' : 'w-24'}`} />
          ))}
        </div>
      </div>
      <div className="p-4 space-y-6">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-2 w-1/4 rounded" />
            </div>
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;

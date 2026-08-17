import React from 'react';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import Card from '../ui/Card';

const LeaderboardSkeleton = () => {
  return (
    <div className="w-full flex flex-col space-y-8 animate-pulse">
      {/* Platform tabs skeleton */}
      <div className="w-64 h-10 bg-frost-800/60 rounded-xl mx-auto border border-frost-50/5" />

      {/* Top 3 grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full pt-6">
        {/* 2nd Place */}
        <div className="flex flex-col items-center order-2 md:order-1 w-full">
          <div className="w-20 h-4 bg-frost-700/40 rounded mb-2" />
          <Card variant="default" className="w-full p-6 flex flex-col items-center space-y-4 h-64 border border-frost-50/5">
            <div className="w-16 h-16 rounded-full bg-frost-700/50" />
            <div className="w-28 h-5 bg-frost-700/50 rounded" />
            <div className="w-20 h-3 bg-frost-700/40 rounded" />
            <div className="flex space-x-2 pt-4 w-full justify-center">
              <div className="w-16 h-8 bg-frost-700/40 rounded" />
              <div className="w-24 h-8 bg-frost-700/40 rounded" />
            </div>
          </Card>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center order-1 md:order-2 md:-mt-6 w-full">
          <div className="w-24 h-4 bg-frost-700/40 rounded mb-2" />
          <Card variant="default" className="w-full p-6 flex flex-col items-center space-y-4 h-72 border border-frost-50/10">
            <div className="w-20 h-20 rounded-full bg-frost-700/50" />
            <div className="w-32 h-5 bg-frost-700/50 rounded" />
            <div className="w-24 h-3 bg-frost-700/40 rounded" />
            <div className="flex space-x-2 pt-6 w-full justify-center">
              <div className="w-16 h-8 bg-frost-700/40 rounded" />
              <div className="w-24 h-8 bg-frost-700/40 rounded" />
            </div>
          </Card>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center order-3 w-full">
          <div className="w-16 h-4 bg-frost-700/40 rounded mb-2" />
          <Card variant="default" className="w-full p-6 flex flex-col items-center space-y-4 h-64 border border-frost-50/5">
            <div className="w-16 h-16 rounded-full bg-frost-700/50" />
            <div className="w-28 h-5 bg-frost-700/50 rounded" />
            <div className="w-20 h-3 bg-frost-700/40 rounded" />
            <div className="flex space-x-2 pt-4 w-full justify-center">
              <div className="w-16 h-8 bg-frost-700/40 rounded" />
              <div className="w-24 h-8 bg-frost-700/40 rounded" />
            </div>
          </Card>
        </div>
      </div>

      {/* Row skeleton list */}
      <div className="w-full max-w-5xl mx-auto space-y-3 pt-6">
        <LoadingSkeleton variant="rect" className="h-20" count={5} />
      </div>
    </div>
  );
};

export default LeaderboardSkeleton;

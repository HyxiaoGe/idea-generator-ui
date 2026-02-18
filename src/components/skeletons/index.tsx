"use client";

import { motion } from "motion/react";
import { Skeleton, SkeletonText, SkeletonButton, SkeletonTag } from "@/components/ui/skeleton";

export function RecentGenerationsSkeleton({ count = 5 }: { count?: number } = {}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex-shrink-0"
        >
          <div className="w-40 space-y-2">
            <Skeleton className="h-40 w-40 rounded-xl" delay={i * 0.1} />
            <div className="space-y-1">
              <Skeleton variant="text" className="h-3 w-4/5" delay={i * 0.1 + 0.1} />
              <Skeleton variant="text" className="h-3 w-3/5" delay={i * 0.1 + 0.2} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function AdvancedModeCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="border-border bg-surface rounded-2xl border p-6"
        >
          <div className="mb-4 flex items-start justify-between">
            <Skeleton className="h-12 w-12 rounded-xl" variant="default" delay={i * 0.1} />
            <SkeletonTag delay={i * 0.1 + 0.1} />
          </div>
          <Skeleton variant="text" className="mb-2 h-5 w-2/3" delay={i * 0.1 + 0.2} />
          <Skeleton variant="text" className="mb-4 h-4 w-4/5" delay={i * 0.1 + 0.3} />
          <Skeleton className="h-24 w-full rounded-lg" delay={i * 0.1 + 0.4} />
        </motion.div>
      ))}
    </div>
  );
}

export function PreviewAreaSkeleton() {
  return (
    <div className="border-border bg-surface flex aspect-square items-center justify-center rounded-2xl border border-dashed">
      <div className="text-center">
        <Skeleton className="mx-auto mb-4 h-12 w-12 rounded-xl" />
        <Skeleton variant="text" className="mx-auto h-4 w-32" />
      </div>
    </div>
  );
}

export function GalleryMasonrySkeleton() {
  const heights = [200, 280, 350, 420, 250, 320, 380, 220];

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {[...Array(16)].map((_, i) => {
        const height = heights[i % heights.length];
        const colIndex = i % 4;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: colIndex * 0.1 + Math.floor(i / 4) * 0.05 }}
            className="mb-4 break-inside-avoid"
          >
            <div className="border-border bg-surface overflow-hidden rounded-2xl border">
              <Skeleton
                className="w-full"
                style={{ height: `${height}px` }}
                delay={colIndex * 0.1}
              />
              <div className="p-4">
                <Skeleton variant="text" className="mb-2 h-4 w-4/5" delay={colIndex * 0.1 + 0.1} />
                <Skeleton variant="text" className="mb-3 h-3 w-3/5" delay={colIndex * 0.1 + 0.2} />
                <div className="flex gap-2">
                  <SkeletonTag delay={colIndex * 0.1 + 0.3} />
                  <SkeletonTag className="w-20" delay={colIndex * 0.1 + 0.4} />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function GalleryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(12)].map((_, i) => {
        const colIndex = i % 4;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: colIndex * 0.1 + Math.floor(i / 4) * 0.05 }}
          >
            <div className="border-border bg-surface overflow-hidden rounded-2xl border">
              <Skeleton className="aspect-square w-full" delay={colIndex * 0.1} />
              <div className="p-4">
                <Skeleton variant="text" className="mb-2 h-4 w-4/5" delay={colIndex * 0.1 + 0.1} />
                <Skeleton variant="text" className="mb-3 h-3 w-3/5" delay={colIndex * 0.1 + 0.2} />
                <div className="flex gap-2">
                  <SkeletonTag delay={colIndex * 0.1 + 0.3} />
                  <SkeletonTag className="w-20" delay={colIndex * 0.1 + 0.4} />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function DetailModalSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="relative">
        <Skeleton className="aspect-square w-full rounded-2xl" />
      </div>

      <div className="space-y-6">
        <div>
          <Skeleton variant="text" className="mb-2 h-6 w-3/5" />
          <Skeleton variant="text" className="h-4 w-2/5" />
        </div>

        <div className="bg-border h-px" />

        <div>
          <Skeleton variant="text" className="mb-2 h-4 w-20" />
          <SkeletonText lines={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <Skeleton variant="text" className="mb-1 h-3 w-16" delay={i * 0.1} />
              <Skeleton variant="text" className="h-4 w-24" delay={i * 0.1 + 0.1} />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <SkeletonButton className="flex-1" />
          <SkeletonButton className="w-12" />
          <SkeletonButton className="w-12" />
        </div>
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton variant="circle" className="h-8 w-8 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-4 w-4/5" />
        <Skeleton variant="text" className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function ChatImageSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Skeleton variant="circle" className="h-8 w-8 flex-shrink-0" />
        <div className="flex-1">
          <SkeletonText lines={2} />
        </div>
      </div>
      <Skeleton className="aspect-square w-full max-w-md rounded-xl" />
    </div>
  );
}

export function TemplateCardSkeleton() {
  return (
    <div className="border-border bg-surface overflow-hidden rounded-2xl border">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <Skeleton variant="text" className="mb-2 h-5 w-2/3" />
            <Skeleton variant="text" className="h-3 w-4/5" />
          </div>
          <Skeleton variant="circle" className="h-8 w-8" />
        </div>
        <div className="flex gap-2">
          <SkeletonTag />
          <SkeletonTag className="w-16" />
        </div>
      </div>
    </div>
  );
}

export function StyleTransferSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <div key={i}>
          <Skeleton variant="text" className="mb-3 h-4 w-24" delay={i * 0.1} />
          <Skeleton className="aspect-square w-full rounded-xl" delay={i * 0.1 + 0.1} />
        </div>
      ))}
    </div>
  );
}

export function BlendImagesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-xl" delay={i * 0.1} />
      ))}
    </div>
  );
}

export function VideoResultSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <SkeletonButton />
          <SkeletonButton />
        </div>
        <Skeleton variant="text" className="h-4 w-32" />
      </div>
    </div>
  );
}

export function LoadingSpinner({
  size = "md",
  variant = "default",
}: {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient";
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <motion.div
      className="relative"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      {variant === "default" ? (
        <div
          className={`${sizeClasses[size]} border-border border-t-primary-start rounded-full border-2`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full`}
          style={{
            background: "conic-gradient(from 0deg, transparent, #7C3AED, #2563EB)",
          }}
        />
      )}
    </motion.div>
  );
}

export function FullPageLoading({ message = "加载中..." }: { message?: string }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" variant="gradient" />
      <p className="text-text-secondary text-sm">{message}</p>
    </div>
  );
}

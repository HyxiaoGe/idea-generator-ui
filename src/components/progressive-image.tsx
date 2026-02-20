"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageOff, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  thumbnail?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "portrait" | "auto";
  objectFit?: "cover" | "contain";
  eager?: boolean;
  showLoader?: boolean;
  loaderSize?: "sm" | "md" | "lg";
  onLoad?: () => void;
  onError?: () => void;
}

type LoadingState = "skeleton" | "loading" | "loaded" | "error";

function isImageCached(url: string): boolean {
  if (!url) return false;
  const img = new Image();
  img.src = url;
  return img.complete && img.naturalWidth > 0;
}

export function ProgressiveImage({
  src,
  alt,
  thumbnail,
  className,
  aspectRatio = "auto",
  objectFit = "cover",
  eager = false,
  showLoader = true,
  loaderSize = "md",
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const cached = eager && isImageCached(src);
  const [loadingState, setLoadingState] = useState<LoadingState>(
    cached ? "loaded" : eager ? "loading" : "skeleton"
  );
  const [shouldLoad, setShouldLoad] = useState(eager && !cached);
  const imgRef = useRef<HTMLDivElement>(null);

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    auto: "",
  };

  const loaderSizes = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  useEffect(() => {
    if (eager) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px",
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!shouldLoad) return;

    if (!src) {
      setLoadingState("error");
      return;
    }

    const img = new Image();
    img.src = src;

    // Browser cache hit — skip loading state entirely
    if (img.complete && img.naturalWidth > 0) {
      setLoadingState("loaded");
      onLoad?.();
      return;
    }

    setLoadingState("loading");

    img.onload = () => {
      setLoadingState("loaded");
      onLoad?.();
    };

    img.onerror = () => {
      setLoadingState("error");
      onError?.();
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [shouldLoad, src, onLoad, onError]);

  const handleRetry = () => {
    setLoadingState("skeleton");
    setShouldLoad(false);
    setTimeout(() => setShouldLoad(true), 100);
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        "bg-surface relative overflow-hidden",
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      <AnimatePresence mode="wait">
        {loadingState === "skeleton" && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-surface-elevated absolute inset-0"
          >
            <motion.div
              className="via-border absolute inset-0 bg-gradient-to-r from-transparent to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}

        {loadingState === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {thumbnail && (
              <img
                src={thumbnail}
                alt={alt}
                className="h-full w-full scale-110 object-cover blur-xl"
              />
            )}

            {showLoader && (
              <div className="bg-background/50 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Loader2 className={cn("text-primary-start", loaderSizes[loaderSize])} />
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {loadingState === "loaded" && (
          <motion.img
            key="loaded"
            src={src}
            alt={alt}
            initial={{ opacity: 0, filter: "blur(20px)" }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              scale: [1.02, 1],
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "h-full w-full",
              objectFit === "contain" ? "object-contain" : "object-cover"
            )}
          />
        )}

        {loadingState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-surface absolute inset-0 flex flex-col items-center justify-center gap-3"
          >
            <ImageOff className="h-12 w-12 text-[#71717A]" />
            <p className="text-sm text-[#71717A]">图片加载失败</p>
            <button
              onClick={handleRetry}
              className="bg-surface-elevated text-text-secondary hover:bg-border hover:text-text-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              重试
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loadingState === "loading" && !showLoader && loaderSize === "sm" && (
        <div className="absolute right-2 bottom-2">
          <div className="rounded-full bg-black/60 p-1.5 backdrop-blur-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Loader2 className="h-4 w-4 text-white/80" />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProgressiveImageGrid({
  images,
  columns = 4,
  gap = 4,
  className,
}: {
  images: Array<{ src: string; alt: string; thumbnail?: string }>;
  columns?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap * 4}px`,
      }}
    >
      {images.map((image, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: (index % columns) * 0.1 + Math.floor(index / columns) * 0.05,
            duration: 0.3,
          }}
        >
          <ProgressiveImage
            src={image.src}
            alt={image.alt}
            thumbnail={image.thumbnail}
            aspectRatio="square"
          />
        </motion.div>
      ))}
    </div>
  );
}

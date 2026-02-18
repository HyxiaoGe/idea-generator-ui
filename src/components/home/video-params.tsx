"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AspectRatio } from "@/lib/types";

interface VideoParamsProps {
  videoModel: string;
  onVideoModelChange: (model: string) => void;
  videoModelOptions: { value: string; label: string }[];
  videoResolution: string;
  onVideoResolutionChange: (resolution: string) => void;
  videoDuration: string;
  onVideoDurationChange: (duration: string) => void;
  videoFrameRate: string;
  onVideoFrameRateChange: (rate: string) => void;
  videoAspectRatio: AspectRatio;
  onVideoAspectRatioChange: (ratio: AspectRatio) => void;
  videoMotionStrength: string;
  onVideoMotionStrengthChange: (strength: string) => void;
}

export function VideoParams({
  videoModel,
  onVideoModelChange,
  videoModelOptions,
  videoResolution,
  onVideoResolutionChange,
  videoDuration,
  onVideoDurationChange,
  videoFrameRate,
  onVideoFrameRateChange,
  videoAspectRatio,
  onVideoAspectRatioChange,
  videoMotionStrength,
  onVideoMotionStrengthChange,
}: VideoParamsProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-6">
      <div>
        <label className="text-text-secondary mb-2 block text-xs">模型</label>
        <Select value={videoModel} onValueChange={onVideoModelChange}>
          <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {videoModelOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-text-secondary mb-2 block text-xs">分辨率</label>
        <Select value={videoResolution} onValueChange={onVideoResolutionChange}>
          <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="480p">480p</SelectItem>
            <SelectItem value="720p">720p</SelectItem>
            <SelectItem value="1080p">1080p</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-text-secondary mb-2 block text-xs">时长</label>
        <Select value={videoDuration} onValueChange={onVideoDurationChange}>
          <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2秒</SelectItem>
            <SelectItem value="4">4秒</SelectItem>
            <SelectItem value="6">6秒</SelectItem>
            <SelectItem value="10">10秒</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-text-secondary mb-2 block text-xs">帧率</label>
        <Select value={videoFrameRate} onValueChange={onVideoFrameRateChange}>
          <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24">24fps</SelectItem>
            <SelectItem value="30">30fps</SelectItem>
            <SelectItem value="60">60fps</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-text-secondary mb-2 block text-xs">比例</label>
        <Select
          value={videoAspectRatio}
          onValueChange={(v) => onVideoAspectRatioChange(v as AspectRatio)}
        >
          <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9</SelectItem>
            <SelectItem value="9:16">9:16</SelectItem>
            <SelectItem value="1:1">1:1</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-text-secondary mb-2 block text-xs">运动强度</label>
        <Select value={videoMotionStrength} onValueChange={onVideoMotionStrengthChange}>
          <SelectTrigger className="border-border bg-surface-elevated h-9 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">低</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="high">高</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

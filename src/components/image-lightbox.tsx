"use client";

import { useCallback, useState } from "react";
import Lightbox, { type Slide, type SlideImage } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";
import { Download, Heart, RotateCw, Trash2 } from "lucide-react";
import type { HistoryItem } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export type LightboxSlide = Slide & {
  historyItem?: HistoryItem;
};

interface ImageLightboxProps {
  open: boolean;
  close: () => void;
  slides: LightboxSlide[];
  index: number;
  onFavorite?: (item: HistoryItem) => void;
  onDelete?: (item: HistoryItem) => void;
  onRegenerate?: (item: HistoryItem) => void;
  onDownload?: (src: string, item?: HistoryItem) => void;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className="yarl__button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon className={`h-6 w-6 ${className || "text-white"}`} />
    </button>
  );
}

export function ImageLightbox({
  open,
  close,
  slides,
  index,
  onFavorite,
  onDelete,
  onRegenerate,
  onDownload,
}: ImageLightboxProps) {
  const { t } = useTranslation();

  // Track current index via on.view for toolbar buttons.
  // This does NOT feed back into YARL's index prop — YARL manages navigation internally.
  const [currentIndex, setCurrentIndex] = useState(index);

  const getSlide = useCallback(
    () => slides[currentIndex] as LightboxSlide | undefined,
    [slides, currentIndex]
  );

  const handleDownload = useCallback(() => {
    const slide = getSlide();
    if (!slide) return;

    const src = (slide as SlideImage).src || "";
    if (onDownload) {
      onDownload(src, slide.historyItem);
    } else if (src) {
      const link = document.createElement("a");
      link.href = src;
      link.download = `generated-${slide.historyItem?.id || Date.now()}.png`;
      link.click();
    }
  }, [getSlide, onDownload]);

  const handleFavorite = useCallback(() => {
    const slide = getSlide();
    if (slide?.historyItem && onFavorite) {
      onFavorite(slide.historyItem);
    }
  }, [getSlide, onFavorite]);

  const handleRegenerate = useCallback(() => {
    const slide = getSlide();
    if (slide?.historyItem && onRegenerate) {
      onRegenerate(slide.historyItem);
    }
  }, [getSlide, onRegenerate]);

  const handleDelete = useCallback(() => {
    const slide = getSlide();
    if (slide?.historyItem && onDelete) {
      onDelete(slide.historyItem);
    }
  }, [getSlide, onDelete]);

  const currentSlide = slides[currentIndex] as LightboxSlide | undefined;
  const currentItem = currentSlide?.historyItem;

  const toolbarButtons: React.ReactNode[] = [];

  if (onFavorite && currentItem) {
    toolbarButtons.push(
      <ToolbarButton
        key="favorite"
        icon={Heart}
        label={currentItem.favorite ? t("lightbox.unfavorite") : t("lightbox.favorite")}
        onClick={handleFavorite}
        className={currentItem.favorite ? "fill-red-500 text-red-500" : "text-white"}
      />
    );
  }

  toolbarButtons.push(
    <ToolbarButton
      key="download"
      icon={Download}
      label={t("lightbox.download")}
      onClick={handleDownload}
    />
  );

  if (onRegenerate && currentItem) {
    toolbarButtons.push(
      <ToolbarButton
        key="regenerate"
        icon={RotateCw}
        label={t("lightbox.regenerate")}
        onClick={handleRegenerate}
      />
    );
  }

  if (onDelete && currentItem) {
    toolbarButtons.push(
      <ToolbarButton
        key="delete"
        icon={Trash2}
        label={t("lightbox.delete")}
        onClick={handleDelete}
        className="text-red-400"
      />
    );
  }

  return (
    <Lightbox
      open={open}
      close={close}
      index={index}
      slides={slides as Slide[]}
      plugins={[Zoom, Fullscreen, Captions, Thumbnails, Video]}
      on={{
        view: ({ index: newIndex }) => setCurrentIndex(newIndex),
      }}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      captions={{
        descriptionMaxLines: 3,
        descriptionTextAlign: "start",
      }}
      video={{
        controls: true,
        playsInline: true,
      }}
      carousel={{
        finite: false,
        preload: 2,
      }}
      toolbar={{
        buttons: [...toolbarButtons, "close"],
      }}
      styles={{
        root: {
          "--yarl__color_backdrop": "rgba(9, 9, 11, 0.95)",
        } as Record<string, string>,
      }}
      labels={{
        Previous: t("lightbox.previous"),
        Next: t("lightbox.next"),
        Close: t("lightbox.close"),
      }}
    />
  );
}

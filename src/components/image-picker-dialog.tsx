"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import useSWR from "swr";
import { Check, ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ProgressiveImage } from "@/components/progressive-image";
import { useTranslation } from "@/lib/i18n";
import { getImageUrl, getTemplateDisplayName, inferContentType } from "@/lib/transforms";
import { useAuth } from "@/lib/auth/auth-context";
import type {
  PaginatedResponse,
  HistoryItem,
  TemplateListResponse,
  TemplateListItem,
} from "@/lib/types";

export interface SelectedImage {
  key: string;
  previewUrl: string;
  label?: string;
}

interface ImagePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (images: SelectedImage[]) => void;
  minImages?: number;
  maxImages?: number;
}

const TEMPLATE_PAGE_SIZE = 30;

export function ImagePickerDialog({
  open,
  onOpenChange,
  onConfirm,
  minImages = 2,
  maxImages = 4,
}: ImagePickerDialogProps) {
  const { t, language } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<SelectedImage[]>([]);
  const [templatePage, setTemplatePage] = useState(1);
  const [allTemplates, setAllTemplates] = useState<TemplateListItem[]>([]);

  // History: single request, 50 items is usually enough
  const { data: historyData, isLoading: historyLoading } = useSWR<PaginatedResponse<HistoryItem>>(
    open && isAuthenticated ? "/history?limit=50" : null
  );

  // Templates: paginated
  const { data: templateData, isLoading: templateLoading } = useSWR<TemplateListResponse>(
    open ? `/templates?media_type=image&page_size=${TEMPLATE_PAGE_SIZE}&page=${templatePage}` : null
  );

  // Accumulate template pages
  useEffect(() => {
    if (templateData?.items) {
      setAllTemplates((prev) => {
        if (templatePage === 1) return templateData.items;
        // Deduplicate by id
        const existingIds = new Set(prev.map((t) => t.id));
        const newItems = templateData.items.filter((t) => !existingIds.has(t.id));
        return [...prev, ...newItems];
      });
    }
  }, [templateData, templatePage]);

  // Reset pagination when dialog closes
  useEffect(() => {
    if (!open) {
      setTemplatePage(1);
      setAllTemplates([]);
    }
  }, [open]);

  const hasMoreTemplates = templateData
    ? templatePage * TEMPLATE_PAGE_SIZE < templateData.total
    : false;

  const historyImages = useMemo(() => {
    if (!historyData?.items) return [];
    return historyData.items.filter(
      (item) => item.r2_key && inferContentType(item.filename) === "image"
    );
  }, [historyData]);

  const templateImages = useMemo(() => {
    return allTemplates.filter((item) => item.preview_storage_key);
  }, [allTemplates]);

  const isSelected = useCallback((key: string) => selected.some((s) => s.key === key), [selected]);

  const toggleSelect = useCallback(
    (image: SelectedImage) => {
      setSelected((prev) => {
        if (prev.some((s) => s.key === image.key)) {
          return prev.filter((s) => s.key !== image.key);
        }
        if (prev.length >= maxImages) return prev;
        return [...prev, image];
      });
    },
    [maxImages]
  );

  const getSelectionIndex = useCallback(
    (key: string) => {
      const idx = selected.findIndex((s) => s.key === key);
      return idx >= 0 ? idx + 1 : 0;
    },
    [selected]
  );

  const handleConfirm = () => {
    onConfirm(selected);
    setSelected([]);
    onOpenChange(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) setSelected([]);
    onOpenChange(value);
  };

  const renderImageCard = (
    key: string,
    previewUrl: string,
    label: string | undefined,
    eager?: boolean
  ) => {
    const checked = isSelected(key);
    const idx = getSelectionIndex(key);
    return (
      <button
        key={key}
        type="button"
        onClick={() => toggleSelect({ key, previewUrl, label })}
        className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
          checked
            ? "border-primary-start ring-primary-start/30 ring-2"
            : "border-border hover:border-primary-start/50"
        }`}
      >
        <ProgressiveImage
          src={previewUrl}
          alt={label || "image"}
          aspectRatio="square"
          eager={eager}
          className="h-full w-full"
        />
        {checked && (
          <div className="from-primary-start to-primary-end absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white">
            {idx}
          </div>
        )}
        {!checked && selected.length < maxImages && (
          <div className="bg-background/60 border-border absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
        {label && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="truncate text-xs text-white">{label}</p>
          </div>
        )}
      </button>
    );
  };

  const renderEmpty = (text: string) => (
    <div className="flex flex-col items-center justify-center py-16">
      <ImageIcon className="text-text-secondary mb-3 h-12 w-12 opacity-40" />
      <p className="text-text-secondary text-sm">{text}</p>
    </div>
  );

  const renderLoading = () => (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-surface-elevated aspect-square animate-pulse rounded-xl" />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("imagePicker.title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("imagePicker.minImages", { min: minImages })}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="bg-surface-elevated mb-4 w-full">
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-primary-start/20 data-[state=active]:text-primary-start dark:data-[state=active]:bg-primary-start/20 dark:data-[state=active]:text-primary-start dark:data-[state=active]:border-primary-start/40 flex-1"
            >
              {t("imagePicker.myWorks")}
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-primary-start/20 data-[state=active]:text-primary-start dark:data-[state=active]:bg-primary-start/20 dark:data-[state=active]:text-primary-start dark:data-[state=active]:border-primary-start/40 flex-1"
            >
              {t("imagePicker.templates")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <ScrollArea className="h-[400px]">
              {historyLoading ? (
                renderLoading()
              ) : historyImages.length === 0 ? (
                renderEmpty(t("imagePicker.noHistory"))
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {historyImages.map((item) =>
                    renderImageCard(
                      item.r2_key!,
                      getImageUrl(item.url || item.r2_key),
                      item.prompt?.slice(0, 40),
                      true
                    )
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="templates">
            <ScrollArea className="h-[400px]">
              {templateLoading && templatePage === 1 ? (
                renderLoading()
              ) : templateImages.length === 0 ? (
                renderEmpty(t("imagePicker.noTemplates"))
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    {templateImages.map((item: TemplateListItem) =>
                      renderImageCard(
                        item.preview_storage_key!,
                        getImageUrl(item.preview_image_url || item.preview_storage_key),
                        getTemplateDisplayName(item, language),
                        true
                      )
                    )}
                  </div>
                  {hasMoreTemplates && (
                    <div className="flex justify-center py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={templateLoading}
                        onClick={() => setTemplatePage((p) => p + 1)}
                      >
                        {templateLoading ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : null}
                        {t("imagePicker.loadMore")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {selected.length > 0 && (
          <div className="border-border flex items-center gap-2 border-t pt-3">
            <div className="flex flex-1 gap-2 overflow-x-auto">
              {selected.map((img, i) => (
                <div
                  key={img.key}
                  className="border-primary-start/50 relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border"
                >
                  <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                  <div className="from-primary-start to-primary-end absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-bl bg-gradient-to-br text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
            <span className="text-text-secondary flex-shrink-0 text-xs">
              {t("imagePicker.selectedCount", { count: selected.length })}
            </span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.length < minImages}
            className="from-primary-start to-primary-end bg-gradient-to-r"
          >
            {selected.length < minImages
              ? t("imagePicker.minImages", { min: minImages })
              : t("imagePicker.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

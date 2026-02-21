"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

interface ModeChipsProps {
  contentType: "image" | "video";
}

interface ChipDef {
  emoji: string;
  label: string;
  path: string;
  demo?: boolean;
}

export function ModeChips({ contentType }: ModeChipsProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const imageChips: ChipDef[] = [
    { emoji: "💬", label: t("modes.chatRefine"), path: "/chat" },
    { emoji: "🎨", label: t("modes.styleTransfer"), path: "/style", demo: true },
    { emoji: "🖼️", label: t("modes.imageBlend"), path: "/blend" },
  ];

  const videoChips: ChipDef[] = [
    { emoji: "🎬", label: t("modes.imageToVideo"), path: "/image-to-video" },
  ];

  const chips = contentType === "image" ? imageChips : videoChips;

  return (
    <div className="mb-6 flex items-center gap-2 overflow-x-auto">
      <span className="text-text-secondary flex-shrink-0 text-xs">{t("modes.advancedModes")}</span>
      <div className="bg-border h-4 w-px flex-shrink-0" />
      {chips.map((chip) => (
        <button
          key={chip.path}
          onClick={() => router.push(chip.path)}
          className="border-border bg-surface text-text-secondary hover:border-primary-start hover:text-text-primary relative flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
        >
          <span>{chip.emoji}</span>
          <span>{chip.label}</span>
          {chip.demo && (
            <span className="bg-warning/20 text-warning rounded px-1 py-0.5 text-[9px] leading-none">
              {t("common.demo")}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

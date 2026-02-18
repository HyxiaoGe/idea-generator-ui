"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion } from "motion/react";

export default function BlendPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [instruction, setInstruction] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "result">("idle");
  const [progress, setProgress] = useState(0);
  const [resultImage] = useState(
    "https://images.unsplash.com/photo-1672581437674-3186b17b405a?w=800"
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && images.length < 6) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImages([...images, result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleBlend = () => {
    setState("loading");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setState("result");
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <BackButton onClick={() => router.push("/")} />
        <h1 className="text-text-primary text-2xl font-semibold">图像混合</h1>
      </div>

      <div className="border-warning/30 bg-warning/10 mb-6 rounded-2xl border p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚧</span>
          <div>
            <h3 className="text-text-primary font-semibold">功能开发中</h3>
            <p className="text-text-secondary text-sm">
              图像混合功能正在开发中，当前为演示模式，生成结果为示例图片。
            </p>
          </div>
        </div>
      </div>

      <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-text-primary font-semibold">上传图片（{images.length}/6）</h3>
          {images.length > 0 && (
            <p className="text-text-secondary text-xs">拖拽调整顺序，顺序影响混合权重</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {images.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group border-border relative aspect-square overflow-hidden rounded-xl border"
            >
              <img src={img} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
              <Button
                size="sm"
                variant="secondary"
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 p-0 hover:bg-red-600"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                {index + 1}
              </div>
            </motion.div>
          ))}

          {images.length < 6 && (
            <label className="border-border bg-background hover:bg-surface hover:border-primary-start flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all">
              <div className="from-primary-start/20 to-primary-end/20 mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                <Plus className="text-primary-start h-6 w-6" />
              </div>
              <p className="text-text-secondary text-xs">添加图片</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          )}
        </div>

        {images.length === 0 && (
          <label className="border-border bg-background hover:bg-surface hover:border-primary-start mt-4 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed py-12 transition-all">
            <div className="text-center">
              <div className="from-primary-start/20 to-primary-end/20 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br text-3xl">
                🖼️
              </div>
              <p className="text-text-primary mb-1 text-sm font-medium">点击上传图片</p>
              <p className="text-text-secondary text-xs">至少上传 2 张，最多 6 张</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        )}
      </div>

      <div className="border-border bg-surface mb-6 rounded-2xl border p-6">
        <label className="text-text-primary mb-3 block font-semibold">混合指令</label>
        <Textarea
          placeholder="描述如何混合这些图片，例如：将这些元素组合成一个奇幻森林场景..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          className="mb-4 min-h-[100px] resize-none rounded-xl"
        />

        <div>
          <label className="text-text-secondary mb-2 block text-xs">混合模式</label>
          <Select defaultValue="smart">
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="smart">智能融合</SelectItem>
              <SelectItem value="style">风格统一</SelectItem>
              <SelectItem value="collage">元素拼接</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleBlend}
        disabled={images.length < 2 || state === "loading"}
        className="from-primary-start to-primary-end hover:from-primary-start/90 hover:to-primary-end/90 mb-6 w-full rounded-xl bg-gradient-to-r py-6"
      >
        开始混合
      </Button>

      {state === "loading" && (
        <div className="border-border bg-surface mb-6 rounded-2xl border p-8">
          <div className="mb-4 text-center">
            <p className="text-text-primary mb-2 text-lg font-semibold">正在混合图像...</p>
            <p className="text-text-secondary text-sm">{progress}%</p>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {state === "result" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="bg-border h-px flex-1"></div>
            <span className="text-text-secondary text-sm">混合结果</span>
            <div className="bg-border h-px flex-1"></div>
          </div>

          <div className="border-border bg-surface rounded-2xl border p-6">
            <img src={resultImage} alt="Blended result" className="mb-4 w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="rounded-xl">
                下载原图
              </Button>
              <Button variant="outline" className="rounded-xl">
                重新混合
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => router.push("/")}>
                继续创作
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

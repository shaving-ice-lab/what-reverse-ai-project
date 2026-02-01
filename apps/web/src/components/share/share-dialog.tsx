"use client";

/**
 * 分享对话框组件
 * 
 * 功能：
 * - 生成分享链接
 * - 生成二维码
 * - 生成嵌入代码
 * - 社交平台分享
 */

import { useState, useEffect, useRef } from "react";
import {
  Link2,
  Copy,
  Check,
  QrCode,
  Code,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,
  Share2,
  Download,
  ExternalLink,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// 分享类型
export type ShareType = "agent" | "workflow" | "document" | "profile";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ShareType;
  title: string;
  description?: string;
  shareId: string;
  coverImage?: string;
}

// 社交平台配置
const socialPlatforms = [
  {
    id: "twitter",
    name: "Twitter",
    icon: Twitter,
    color: "bg-[#1DA1F2]",
    getUrl: (url: string, text: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "bg-[#4267B2]",
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-[#0077B5]",
    getUrl: (url: string, text: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: "wechat",
    name: "微信",
    icon: MessageCircle,
    color: "bg-[#07C160]",
    getUrl: () => "", // 微信需要扫码分享
    isQRCode: true,
  },
  {
    id: "weibo",
    name: "微博",
    icon: Share2,
    color: "bg-[#E6162D]",
    getUrl: (url: string, text: string) =>
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    id: "email",
    name: "邮件",
    icon: Mail,
    color: "bg-muted",
    getUrl: (url: string, text: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

export function ShareDialog({
  open,
  onOpenChange,
  type,
  title,
  description,
  shareId,
  coverImage,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState<"never" | "1d" | "7d" | "30d">("never");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 生成分享链接
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${baseUrl}/share/${type}/${shareId}`;
  const shareText = `${title}${description ? ` - ${description}` : ""}`;

  // 生成嵌入代码
  const embedCode = `<iframe src="${shareUrl}/embed" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`;

  // 生成二维码
  useEffect(() => {
    if (open) {
      generateQRCode(shareUrl);
    }
  }, [open, shareUrl]);

  const generateQRCode = async (url: string) => {
    try {
      // 使用 QRCode API 生成二维码
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      setQrCodeUrl(qrApiUrl);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  // 复制链接
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // 复制嵌入代码
  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // 下载二维码
  const downloadQRCode = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${title}-qrcode.png`;
    link.click();
  };

  // 社交分享
  const handleSocialShare = (platform: typeof socialPlatforms[0]) => {
    if (platform.isQRCode) {
      // 微信显示二维码
      return;
    }
    const url = platform.getUrl(shareUrl, shareText, title);
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            分享
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            分享「{title}」给其他人
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="w-full bg-muted">
            <TabsTrigger value="link" className="flex-1">
              <Link2 className="h-4 w-4 mr-2" />
              链接
            </TabsTrigger>
            <TabsTrigger value="qrcode" className="flex-1">
              <QrCode className="h-4 w-4 mr-2" />
              二维码
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex-1">
              <Code className="h-4 w-4 mr-2" />
              嵌入
            </TabsTrigger>
            <TabsTrigger value="social" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              社交
            </TabsTrigger>
          </TabsList>

          {/* 链接分享 */}
          <TabsContent value="link" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">分享链接</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-muted border-border"
                />
                <Button
                  onClick={copyLink}
                  className={cn(
                    "shrink-0",
                    copied
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-primary hover:bg-primary/90"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      复制
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 分享设置 */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4" />
                分享设置
              </h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">公开访问</Label>
                  <p className="text-xs text-muted-foreground">
                    任何人都可以通过链接访问
                  </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">密码保护</Label>
                  <p className="text-xs text-muted-foreground">
                    需要输入密码才能访问
                  </p>
                </div>
                <Switch checked={hasPassword} onCheckedChange={setHasPassword} />
              </div>

              {hasPassword && (
                <Input
                  type="password"
                  placeholder="设置访问密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted border-border"
                />
              )}
            </div>
          </TabsContent>

          {/* 二维码分享 */}
          <TabsContent value="qrcode" className="mt-4 space-y-4">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-xl border border-border">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 bg-muted animate-pulse rounded" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                扫描二维码访问
              </p>
              <Button
                variant="outline"
                onClick={downloadQRCode}
                className="mt-4 border-border"
              >
                <Download className="h-4 w-4 mr-2" />
                下载二维码
              </Button>
            </div>
          </TabsContent>

          {/* 嵌入代码 */}
          <TabsContent value="embed" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">嵌入代码</Label>
              <Textarea
                value={embedCode}
                readOnly
                rows={4}
                className="font-mono text-xs bg-muted border-border"
              />
              <Button
                onClick={copyEmbedCode}
                className={cn(
                  "w-full",
                  embedCopied
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                {embedCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    复制代码
                  </>
                )}
              </Button>
            </div>

            {/* 预览 */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Label className="text-muted-foreground">预览</Label>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="bg-muted h-40 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    嵌入内容预览
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 社交分享 */}
          <TabsContent value="social" className="mt-4">
            <div className="grid grid-cols-3 gap-3">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => handleSocialShare(platform)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                      "border border-border",
                      "hover:border-border",
                      "hover:bg-muted"
                    )}
                  >
                    <div className={cn("p-2.5 rounded-full text-white", platform.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {platform.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 分享提示 */}
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">
                分享到社交平台时，将自动附带标题和描述。微信分享请使用二维码功能。
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// 分享按钮组件
interface ShareButtonProps {
  type: ShareType;
  title: string;
  description?: string;
  shareId: string;
  coverImage?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShareButton({
  type,
  title,
  description,
  shareId,
  coverImage,
  className,
  variant = "outline",
  size = "default",
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Share2 className="h-4 w-4" />
        {size !== "icon" && <span className="ml-2">分享</span>}
      </Button>
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        type={type}
        title={title}
        description={description}
        shareId={shareId}
        coverImage={coverImage}
      />
    </>
  );
}

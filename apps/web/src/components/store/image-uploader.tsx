"use client";

/**
 * ImageUploadComponent
 * 
 * Supportface, Screenshot, Icon'sUploadandPreview
 */

import { useState, useRef, useCallback } from "react";
import {
 Upload,
 X,
 Image as ImageIcon,
 Plus,
 Loader2,
 AlertCircle,
 GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
 // alreadyUpload'sImage
 images: string[];
 
 // Callback
 onChange: (images: string[]) => void;
 
 // Config
 maxImages?: number;
 maxSizeMB?: number;
 aspectRatio?: "16/9" | "1/1" | "4/3" | "auto";
 acceptTypes?: string[];
 
 // style
 variant?: "cover" | "screenshot" | "icon";
 className?: string;
 
 // Tags
 label?: string;
 helperText?: string;
}

export function ImageUploader({
 images,
 onChange,
 maxImages = 5,
 maxSizeMB = 5,
 aspectRatio = "16/9",
 acceptTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
 variant = "screenshot",
 className,
 label,
 helperText,
}: ImageUploaderProps) {
 const [isUploading, setIsUploading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [dragIndex, setDragIndex] = useState<number | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 // ProcessFileSelect
 const handleFileSelect = useCallback(
 async (files: FileList | null) => {
 if (!files || files.length === 0) return;

 setError(null);
 setIsUploading(true);

 try {
 const newImages: string[] = [];

 for (let i = 0; i < files.length; i++) {
 const file = files[i];

 // CheckFileType
 if (!acceptTypes.includes(file.type)) {
 throw new Error(`notSupport'sFileType: ${file.type}`);
 }

 // CheckFileSize
 if (file.size > maxSizeMB * 1024 * 1024) {
 throw new Error(`FileSizenotcanExceed ${maxSizeMB}MB`);
 }

 // CheckCountLimit
 if (images.length + newImages.length >= maxImages) {
 throw new Error(`mostmultipleUpload ${maxImages} Image`);
 }

 // MockUpload(ActualitemCallUpload API)
 // const formData = new FormData();
 // formData.append("file", file);
 // const response = await fetch("/api/upload", { method: "POST", body: formData });
 // const { url } = await response.json();

 // timeUsage Data URL(ActualitemshouldUsageStorage URL)
 const dataUrl = await readFileAsDataURL(file);
 newImages.push(dataUrl);
 }

 onChange([...images, ...newImages]);
 } catch (err) {
 setError(err instanceof Error ? err.message: "UploadFailed");
 } finally {
 setIsUploading(false);
 }
 },
 [images, maxImages, maxSizeMB, acceptTypes, onChange]
 );

 // ReadFileas Data URL
 const readFileAsDataURL = (file: File): Promise<string> => {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = () => resolve(reader.result as string);
 reader.onerror = reject;
 reader.readAsDataURL(file);
 });
 };

 // DeleteImage
 const handleRemove = (index: number) => {
 const newImages = images.filter((_, i) => i !== index);
 onChange(newImages);
 };

 // Drag & DropSort
 const handleDragStart = (index: number) => {
 setDragIndex(index);
 };

 const handleDragOver = (e: React.DragEvent, index: number) => {
 e.preventDefault();
 if (dragIndex === null || dragIndex === index) return;

 const newImages = [...images];
 const draggedImage = newImages[dragIndex];
 newImages.splice(dragIndex, 1);
 newImages.splice(index, 0, draggedImage);
 onChange(newImages);
 setDragIndex(index);
 };

 const handleDragEnd = () => {
 setDragIndex(null);
 };

 // ProcessDrag and DropUpload
 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 handleFileSelect(e.dataTransfer.files);
 };

 const handleDragOverUpload = (e: React.DragEvent) => {
 e.preventDefault();
 };

 // ClickUpload
 const handleClick = () => {
 fileInputRef.current?.click();
 };

 const aspectRatioClass = {
 "16/9": "aspect-video",
 "1/1": "aspect-square",
 "4/3": "aspect-4/3",
 auto: "",
 }[aspectRatio];

 const isSingle = variant === "cover" || variant === "icon";
 const canAddMore = images.length < maxImages;

 return (
 <div className={cn("space-y-3", className)}>
 {/* Tags */}
 {label && (
 <label className="block text-sm font-medium text-foreground">
 {label}
 </label>
 )}

 {/* Upload(face/Icon) */}
 {isSingle && (
 <div
 className={cn(
 "relative group cursor-pointer border-2 border-dashed rounded-xl transition-colors",
 aspectRatioClass,
 variant === "icon" && "w-24 h-24 aspect-square",
 images.length > 0
 ? "border-primary/30 bg-primary/5"
 : "border-border hover:border-primary/50 bg-muted/50"
 )}
 onClick={handleClick}
 onDrop={handleDrop}
 onDragOver={handleDragOverUpload}
 >
 {images.length > 0 ? (
 <>
 <img
 src={images[0]}
 alt="UploadPreview"
 className={cn(
 "w-full h-full object-cover",
 variant === "icon" ? "rounded-xl" : "rounded-lg"
 )}
 />
 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
 <Button
 type="button"
 size="sm"
 variant="secondary"
 onClick={(e) => {
 e.stopPropagation();
 handleClick();
 }}
 >
 more
 </Button>
 <Button
 type="button"
 size="sm"
 variant="destructive"
 onClick={(e) => {
 e.stopPropagation();
 handleRemove(0);
 }}
 >
 <X className="w-4 h-4" />
 </Button>
 </div>
 </>
 ) : (
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 {isUploading ? (
 <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
 ) : (
 <>
 <Upload className="w-8 h-8 text-muted-foreground mb-2" />
 <span className="text-sm text-muted-foreground">
 ClickorDrag & DropUpload
 </span>
 <span className="text-xs text-muted-foreground/60 mt-1">
 Maximum {maxSizeMB}MB
 </span>
 </>
 )}
 </div>
 )}
 </div>
 )}

 {/* multipleUpload(Screenshot) */}
 {!isSingle && (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {/* alreadyUpload'sImage */}
 {images.map((image, index) => (
 <div
 key={index}
 className={cn(
 "relative group cursor-move border-2 rounded-xl overflow-hidden transition-all",
 aspectRatioClass,
 dragIndex === index
 ? "border-primary scale-105 shadow-lg"
 : "border-transparent hover:border-primary/30"
 )}
 draggable
 onDragStart={() => handleDragStart(index)}
 onDragOver={(e) => handleDragOver(e, index)}
 onDragEnd={handleDragEnd}
 >
 <img
 src={image}
 alt={`Screenshot ${index + 1}`}
 className="w-full h-full object-cover"
 />
 
 {/* Drag & DropHandle */}
 <div className="absolute top-2 left-2 p-1 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
 <GripVertical className="w-4 h-4 text-white" />
 </div>

 {/* DeleteButton */}
 <button
 type="button"
 onClick={() => handleRemove(index)}
 className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
 >
 <X className="w-4 h-4" />
 </button>

 {/* Serial NumberMark */}
 <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/50 text-white text-xs">
 {index + 1}
 </div>
 </div>
 ))}

 {/* AddmoremultipleButton */}
 {canAddMore && (
 <div
 className={cn(
 "relative cursor-pointer border-2 border-dashed rounded-xl transition-colors",
 aspectRatioClass,
 "border-border hover:border-primary/50 bg-muted/50 hover:bg-muted"
 )}
 onClick={handleClick}
 onDrop={handleDrop}
 onDragOver={handleDragOverUpload}
 >
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 {isUploading ? (
 <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
 ) : (
 <>
 <Plus className="w-6 h-6 text-muted-foreground mb-1" />
 <span className="text-xs text-muted-foreground">
 AddScreenshot
 </span>
 </>
 )}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Hide'sFileInput */}
 <input
 ref={fileInputRef}
 type="file"
 accept={acceptTypes.join(",")}
 multiple={!isSingle}
 onChange={(e) => handleFileSelect(e.target.files)}
 className="hidden"
 />

 {/* ErrorTip */}
 {error && (
 <div className="flex items-center gap-2 text-sm text-destructive">
 <AlertCircle className="w-4 h-4" />
 <span>{error}</span>
 </div>
 )}

 {/* AuxiliaryText */}
 {helperText && (
 <p className="text-xs text-muted-foreground">{helperText}</p>
 )}
 </div>
 );
}

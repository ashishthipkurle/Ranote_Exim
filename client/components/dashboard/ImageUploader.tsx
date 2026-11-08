"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { UploadCloud, X, AlertCircle, RefreshCw, Loader2, StopCircle } from "lucide-react";
import CropModal from "./CropModal";
import { createClient } from "@/lib/supabase/client";

export type UploadStatus = "pending" | "uploading" | "success" | "error";

export interface UploadItem {
 id: string;
 file: File;
 previewUrl: string;
 status: UploadStatus;
 progress: number;
 errorText?: string;
 url?: string;
 retryCount: number;
 xhr?: XMLHttpRequest;
}

interface ImageUploaderProps {
 images: string[];
 onChange: (urls: string[]) => void;
 maxFiles?: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const CONCURRENCY_LIMIT = 2;
const MAX_RETRIES = 3;

export default function ImageUploader({ images, onChange, maxFiles = 8 }: ImageUploaderProps) {
 const [isDragging, setIsDragging] = useState(false);
 const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
 const [batchToCrop, setBatchToCrop] = useState<{ id: string; file: File; currentUrl: string; isCropped: boolean }[] | null>(null);

 // Use an immediate ref to drive our continuous queue processor
 const queueRef = useRef<UploadItem[]>([]);
 queueRef.current = uploadQueue;

 // Phase 1: Prevent Memory Leaks on Component Dismount
 useEffect(() => {
 return () => {
 queueRef.current.forEach(item => {
 if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
 });
 };
 }, []);

 // Phase 4: Manage Upload Queue Concurrency automatically
 useEffect(() => {
 const processQueue = async () => {
 const activeCount = queueRef.current.filter(i => i.status === "uploading").length;
 if (activeCount >= CONCURRENCY_LIMIT) return;

 const nextPending = queueRef.current.find(i => i.status === "pending");
 if (!nextPending) {
 syncSuccessURLs();
 return;
 }

 startUpload(nextPending);
 };

 processQueue();
 }, [uploadQueue]);

 // Push confirmed Cloudinary strings to parent and cleanup native preview
 const syncSuccessURLs = useCallback(() => {
 const successes = queueRef.current.filter(i => i.status === "success" && i.url);
 if (successes.length > 0) {
 const newUrls = successes.map(s => s.url!);
 onChange([...images, ...newUrls]);

 // Clean up memory leaks for Object URLs that succeeded
 successes.forEach(s => {
 if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
 });

 // Remove successes from our local queue UI
 setUploadQueue(prev => prev.filter(p => p.status !== "success"));
 }
 }, [images, onChange]);

 const startUpload = async (item: UploadItem) => {
 updateItem(item.id, { status: "uploading", progress: 0, errorText: undefined });

 try {
 // Retrieve Supabase JWT token and enable credentials
		const supabase = createClient();
		const { data: { session } } = await supabase.auth.getSession();
		const token = session?.access_token;

 const xhr = new XMLHttpRequest();
		xhr.withCredentials = true;
 updateItem(item.id, { xhr });

 // Feed live XHR percentage to progress bar UI
 xhr.upload.onprogress = (event) => {
 if (event.lengthComputable) {
 const progress = Math.round((event.loaded * 100) / event.total);
 updateItemLocal(item.id, { progress });
 }
 };

 xhr.onload = () => {
 if (xhr.status >= 200 && xhr.status < 300) {
 try {
 const res = JSON.parse(xhr.responseText);
 updateItem(item.id, { status: "success", progress: 100, url: res.url });
 } catch (e) {
 handleUploadError(item, "Invalid server response");
 }
 } else {
 let errorMessage = `Upload failed (${xhr.status})`;
 try {
 const res = JSON.parse(xhr.responseText);
 if (res.error) errorMessage = res.error;
 } catch (e) { }
 handleUploadError(item, errorMessage);
 }
 };

 xhr.onerror = () => handleUploadError(item, "Network error occurred");
 xhr.onabort = () => updateItem(item.id, { status: "error", errorText: "Upload cancelled" });

 xhr.open("POST", "/api/upload/image", true);
 if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

 const formData = new FormData();
 formData.append("file", item.file);
 xhr.send(formData);

 } catch (error: any) {
 handleUploadError(item, error.message || "Failed to start upload");
 }
 };

 // Phase 3: Implement Auto-Retry with Exponential Backoff
 const handleUploadError = (item: UploadItem, errorText: string) => {
 if (item.retryCount < MAX_RETRIES) {
 const delay = Math.pow(2, item.retryCount) * 1000;
 updateItem(item.id, {
 status: "error",
 errorText: `Failed: ${errorText}. Retrying in ${delay / 1000}s...`,
 retryCount: item.retryCount + 1
 });

 setTimeout(() => {
 // Return to pending to be picked up by effect loop
 updateItem(item.id, { status: "pending", progress: 0, errorText: undefined });
 }, delay);
 } else {
 updateItem(item.id, { status: "error", errorText: `Final failure: ${errorText}` });
 }
 };

 const updateItem = (id: string, updates: Partial<UploadItem>) => {
 setUploadQueue(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
 };

 // Performance optimization: prevent React rendering waterfall when progress ticks 0-100 quickly
 const updateItemLocal = (id: string, updates: Partial<UploadItem>) => {
 setUploadQueue(prev => {
 const index = prev.findIndex(i => i.id === id);
 if (index === -1) return prev;
 if (updates.progress !== undefined && Math.abs(prev[index].progress - updates.progress) < 5 && updates.progress !== 100) {
 return prev;
 }
 return prev.map(i => i.id === id ? { ...i, ...updates } : i);
 });
 };

 const handleFiles = async (files: FileList | null) => {
		if (!files) return;

		const totalAllowed = maxFiles - images.length - uploadQueue.length;
		if (totalAllowed <= 0) return;

		const filesToProcess = Array.from(files).slice(0, totalAllowed);

		const validFiles: { id: string; file: File; currentUrl: string; isCropped: boolean }[] = [];
		const errorItems: UploadItem[] = [];

		for (const file of filesToProcess) {
			let errorText: string | undefined;
			let status: UploadStatus = "pending";

			if (!ALLOWED_TYPES.includes(file.type)) {
				errorText = "Invalid file type. Need JPG, PNG, WEBP.";
				status = "error";
			} else if (file.size > MAX_SIZE) {
				errorText = "File too large. Max 5MB.";
				status = "error";
			}

			const id = Math.random().toString(36).substring(7);

			let previewUrl = "";
			try {
				previewUrl = URL.createObjectURL(file);
			} catch {
				previewUrl = "";
			}

			// Read as DataURL to ensure 100% CSP compatibility
			const dataUrl = await new Promise<string>((resolve) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = () => resolve(previewUrl);
				reader.readAsDataURL(file);
			});

			const finalUrl = dataUrl || previewUrl;

			if (status === "pending") {
				validFiles.push({
					id,
					file,
					currentUrl: finalUrl,
					isCropped: false
				});
			} else {
				errorItems.push({
					id,
					file,
					previewUrl: finalUrl,
					status,
					progress: 0,
					errorText,
					retryCount: 0
				});
			}
		}

		// Any invalid files go straight to queue to show errors
		if (errorItems.length > 0) {
			setUploadQueue(prev => [...prev, ...errorItems]);
		}

		// All valid files go into the batch crop queue
		if (validFiles.length > 0) {
			setBatchToCrop(validFiles);
		}
	};

 const handleCropComplete = async (croppedImages: { id: string; file: File; isCropped: boolean }[]) => {
		if (!batchToCrop) return;

		const newItems: UploadItem[] = await Promise.all(
			croppedImages.map(async img => {
				let preview = "";
				try { preview = URL.createObjectURL(img.file); } catch {}
				const dataUrl = await new Promise<string>((resolve) => {
					const reader = new FileReader();
					reader.onload = () => resolve(reader.result as string);
					reader.onerror = () => resolve(preview);
					reader.readAsDataURL(img.file);
				});
				return {
					id: img.id,
					file: img.file,
					previewUrl: dataUrl || preview,
					status: "pending" as UploadStatus,
					progress: 0,
					retryCount: 0
				};
			})
		);

		setUploadQueue(prev => [...prev, ...newItems]);
		setBatchToCrop(null);
	};

 const handleCropCancel = () => {
 if (!batchToCrop) return;

 // Push original un-cropped files to queue
 const originalItems: UploadItem[] = batchToCrop.map(item => ({
 id: item.id,
 file: item.file,
 previewUrl: item.currentUrl, // We already made an object URL for it
 status: "pending",
 progress: 0,
 retryCount: 0
 }));

 setUploadQueue(prev => [...prev, ...originalItems]);
 setBatchToCrop(null);
 };

 // Phase 5: Expose XHR Abort capabilities
 const cancelOrRemoveUpload = (item: UploadItem) => {
 if (item.xhr && item.status === "uploading") item.xhr.abort();
 if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
 setUploadQueue(prev => prev.filter(i => i.id !== item.id));
 };

 return (
 <div className="space-y-4">
 <div
 className={`relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors
 ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}
 onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
 onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
 onDrop={(e) => {
 e.preventDefault();
 setIsDragging(false);
 handleFiles(e.dataTransfer.files);
 }}
 >
 <input
 type="file" multiple
 accept={ALLOWED_TYPES.join(",")}
 onChange={(e) => handleFiles(e.target.files)}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 title=" "
 />

 <UploadCloud className="w-8 h-8 text-muted-foreground mb-3" />
 <p className="text-foreground text-sm font-bold">Drag & Drop visual assets here</p>
 <p className="text-muted-foreground text-xs mt-1">or click to browse your files</p>
 <div className="mt-4 px-3 py-1 bg-muted rounded-lg border border-border">
 <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
 Supported: JPG, PNG, WEBP • Max Size: 5MB
 </p>
 </div>
 </div>

  {/* In-flight and Pre-upload Gallery */}
  {(images.length > 0 || uploadQueue.length > 0) && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
    {/* Already Uploaded Images */}
    {images.map((url, idx) => (
      <div key={`uploaded-${idx}`} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square bg-card shadow-xl">
        <img src={url} alt={`product-image-${idx}`} className="w-full h-full object-cover transition-transform duration-700" />
        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onChange(images.filter((_, i) => i !== idx));
            }}
            className="p-1.5 bg-red-500/90 hover:bg-red-500 rounded-lg shadow-xl"
            title="Remove Image"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    ))}

    {/* Currently Uploading / Failed Images */}
    {uploadQueue.map(item => (
      <div key={item.id} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square bg-card shadow-xl">
        <img src={item.previewUrl} alt="preview" className={`w-full h-full object-cover transition-transform duration-700 ${item.status === 'uploading' ? 'opacity-40 brightness-50' : ''}`} />

        {item.status === "uploading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <Loader2 className="w-5 h-5 text-white animate-spin mb-2" />
            <div className="w-3/4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${item.progress}%` }} />
            </div>
            <p className="text-[10px] text-white font-bold mt-2">{item.progress}%</p>
          </div>
        )}

        {item.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 p-2 text-center pointer-events-none">
            <AlertCircle className="w-6 h-6 text-red-200 mb-1" />
            <p className="text-[9px] text-red-100 font-bold leading-tight">{item.errorText}</p>
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          {item.status === "error" && item.errorText !== "File too large. Max 5MB." && item.errorText !== "Invalid file type. Need JPG, PNG, WEBP." && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); updateItem(item.id, { status: "pending", retryCount: 0 }); }}
              className="p-1.5 bg-primary/90 hover:bg-primary rounded-lg shadow-xl"
              title="Retry manually"
            >
              <RefreshCw className="w-3 h-3 text-white" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); cancelOrRemoveUpload(item); }}
            className="p-1.5 bg-red-500/90 hover:bg-red-500 rounded-lg shadow-xl"
            title="Remove/Cancel"
          >
            {item.status === "uploading" ? <StopCircle className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
          </button>
        </div>
      </div>
    ))}
  </div>
  )}

 {batchToCrop && (
 <CropModal
 images={batchToCrop}
 onComplete={handleCropComplete}
 onCancel={handleCropCancel}
 />
 )}
 </div>
 );
}

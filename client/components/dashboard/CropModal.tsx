"use client";

import React, { useRef, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { X, Crop as CropIcon, Check, Loader2, RotateCcw, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { useImageCrop, InteractiveImage } from "@/hooks/useImageCrop";

interface CropModalProps {
 images: InteractiveImage[];
 onComplete: (croppedImages: InteractiveImage[]) => void;
 onCancel: () => void;
}

export default function CropModal({ images: initialImages, onComplete, onCancel }: CropModalProps) {
 const fileInputRef = useRef<HTMLInputElement>(null);

 const {
 images,
 activeImage,
 activeIndex,
 crop,
 zoom,
 isConverting,
 isCropping,
 
 setCrop,
 setZoom,
 setCroppedAreaPixels,
 setIsCropping,
 setActiveImageIndex,
 
 handleRotate,
 applyCurrentCrop,
 addImages,
 } = useImageCrop(initialImages, 800);

 const handleSaveAll = () => {
 onComplete(images);
 };

 const handleAddNewClick = () => {
 if (fileInputRef.current) {
 fileInputRef.current.click();
 }
 };

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 if (!e.target.files?.length) return;
 
 const newFiles = Array.from(e.target.files);
 const success = await addImages(newFiles);
 
 if (!success) {
 alert("Invalid file type or size. Please ensure images are JPG, PNG, or WEBP and under 5MB.");
 }

 e.target.value = "";
 };

 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 document.body.style.overflow = "hidden";
 return () => {
 document.body.style.overflow = "unset";
 };
 }, []);

 if (!mounted) return null;

 if (!activeImage) return null; // Safety check

 return createPortal(
 <div className="fixed inset-0 z-[9999] font-sans text-foreground flex flex-col bg-background animate-in fade-in duration-200 overflow-hidden">
 
 {/* Header Navigation */}
 <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border bg-card shadow-sm z-10 flex-shrink-0">
 <div className="flex items-center space-x-3">
 <div 
 onClick={onCancel}
 className="p-2 rounded-full hover:bg-muted cursor-pointer transition-colors"
 >
 <X className="h-6 w-6 text-muted-foreground" />
 </div>
 <h1 className="text-base md:text-lg font-semibold text-foreground">Edit Assets</h1>
 </div>
 
 <div className="flex items-center space-x-4 md:space-x-6 text-muted-foreground">
 <button 
 onClick={() => setIsCropping(!isCropping)}
 className={`p-1.5 hover:bg-muted rounded-lg transition-colors flex items-center justify-center ${isCropping ? "bg-primary text-white hover:bg-primary/90" : ""}`}
 title="Toggle Crop Mode"
 >
 <CropIcon className="h-5 w-5 md:h-6 md:w-6" />
 </button>
 </div>

 <div className="flex items-center space-x-4">
 <button 
 onClick={handleSaveAll}
 disabled={isConverting}
 className="bg-primary text-primary-foreground px-4 py-2 md:px-5 md:py-2 text-sm md:text-base rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10 flex items-center space-x-2 disabled:opacity-50"
 >
 {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Batch ({images.length})</span>}
 </button>
 </div>
 </header>

 {/* Canvas Preview Area */}
 <div className="flex-1 bg-muted/50 flex flex-col items-center justify-center p-2 md:p-6 relative min-h-0">
 <div className="relative w-full max-w-4xl flex flex-col h-full bg-card shadow-xl rounded-lg border border-border p-2 md:p-4 min-h-0">
 
 {isCropping ? (
 <div className="relative w-full flex-1 min-h-0 rounded-md overflow-hidden bg-muted">
 <Cropper
 image={activeImage.currentUrl}
 crop={crop}
 zoom={zoom}
 aspect={1}
 onCropChange={setCrop}
 onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
 onZoomChange={setZoom}
 showGrid={true}
 restrictPosition={false}
 minZoom={0.1}
 />
 </div>
 ) : (
 <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
 <img 
  src={activeImage.currentUrl} 
  alt="Original Image" 
  className="max-w-full max-h-full object-contain block mx-auto rounded-md"
  onError={(e) => {
    if (activeImage.file) {
      const reader = new FileReader();
      reader.onload = () => {
        (e.target as HTMLImageElement).src = reader.result as string;
      };
      reader.readAsDataURL(activeImage.file);
    }
  }}
/>
 </div>
 )}

 {/* Zoom Slider */}
 {isCropping && (
 <div className="flex flex-col items-center mt-4 flex-shrink-0 w-full px-4 z-10 relative">
 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Zoom Image</label>
 <input 
 type="range"
 min={0.1}
 max={3}
 step={0.01}
 value={zoom}
 onChange={(e) => setZoom(Number(e.target.value))}
 className="w-full max-w-sm h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
 />
 </div>
 )}

 </div>

 <div className="absolute bottom-6 right-8 flex gap-3">
 {isCropping && (
 <button 
 onClick={applyCurrentCrop}
 disabled={isConverting}
 title="Apply Crop to this layer"
 className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg border border-primary/20 hover:bg-primary/90 hover:shadow-xl transition-all disabled:opacity-50"
 >
 {isConverting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Check className="h-6 w-6" />}
 </button>
 )}
 <button 
 onClick={handleRotate}
 disabled={isConverting}
 title="Rotate Image 90deg"
 className={`bg-card p-3 rounded-full shadow-lg border border-border hover:shadow-xl transition-all text-foreground hover:text-primary disabled:opacity-50`}
 >
 {isConverting ? <Loader2 className="h-6 w-6 animate-spin" /> : <RotateCcw className="h-6 w-6" />}
 </button>
 <button 
 onClick={() => setIsCropping(!isCropping)}
 title={isCropping ? "Cancel Cropping" : "Start Cropping"}
 className={`bg-card p-3 rounded-full shadow-lg border border-border hover:shadow-xl transition-all ${isCropping ? "text-primary" : "text-foreground hover:text-primary"}`}
 >
 <CropIcon className="h-6 w-6" />
 </button>
 </div>
 </div>

 {/* Thumbnail Gallery (Bottom) */}
 <footer className="bg-card border-t border-border p-6 z-10 flex-shrink-0">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Project Assets ({images.length} Active)</h3>
 </div>
 
 <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-muted">
 
 {images.map((img, index) => (
 <div 
 key={img.id}
 onClick={() => {
 setActiveImageIndex(index);
 }}
 className={`flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden cursor-pointer relative group transition-colors ${activeIndex === index ? "border-[3px] border-primary" : "border border-border hover:border-primary"}`}
 >
 <img 
  alt={`Upload ${index}`} 
  className="w-full h-full object-cover" 
  src={img.currentUrl}
  onError={(e) => {
    if (img.file) {
      const reader = new FileReader();
      reader.onload = () => {
        (e.target as HTMLImageElement).src = reader.result as string;
      };
      reader.readAsDataURL(img.file);
    }
  }}
/>
 
 {img.isCropped && (
 <div className="absolute top-1 left-1 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
 CROPPED
 </div>
 )}
 
 {activeIndex === index && (
 <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
 <span className="text-white text-[10px] font-bold drop-shadow-md">ACTIVE</span>
 </div>
 )}
 </div>
 ))}

 {/* Add New Button */}
 <div 
 onClick={handleAddNewClick}
 className="flex-shrink-0 w-28 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-muted transition-all text-muted-foreground hover:text-primary"
 >
 <input
 type="file"
 ref={fileInputRef}
 onChange={handleFileChange}
 accept="image/jpeg, image/png, image/webp"
 multiple
 className="hidden"
 />
 <div className="text-center">
 <Plus className="h-6 w-6 mx-auto" />
 <span className="text-[10px] font-bold uppercase mt-1 block">Add New</span>
 </div>
 </div>
 </div>
 </footer>

 </div>,
 document.body
 );
}

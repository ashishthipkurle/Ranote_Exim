import { useState, useCallback } from "react";
import { Area, Point } from "react-easy-crop";
import { getCroppedImg, getRotatedImage } from "@/utils/cropUtils";

export interface InteractiveImage {
    id: string;
    file: File;
    currentUrl: string;
    isCropped: boolean;
}

export function useImageCrop(initialImages: InteractiveImage[], fixedSize: number = 800) {
    const [images, setImages] = useState<InteractiveImage[]>(initialImages);
    const [activeIndex, setActiveIndex] = useState(0);

    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const [isConverting, setIsConverting] = useState(false);
    const [isCropping, setIsCropping] = useState(true);

    const activeImage = images[activeIndex];

    const resetCropLayout = useCallback(() => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setIsCropping(true);
    }, []);

    const setActiveImageIndex = useCallback((index: number) => {
        setActiveIndex(index);
        resetCropLayout();
    }, [resetCropLayout]);

    const handleRotate = useCallback(async () => {
        if (!activeImage) return;
        
        setIsConverting(true);
        try {
            const { file, url } = await getRotatedImage(activeImage.currentUrl, 90, activeImage.file.type);
            setImages(prev => prev.map((item, idx) => 
                idx === activeIndex 
                    ? { ...item, file, currentUrl: url, isCropped: true } 
                    : item
            ));
            resetCropLayout();
        } catch (err) {
            console.error("Failed to rotate image", err);
        } finally {
            setIsConverting(false);
        }
    }, [activeImage, activeIndex, resetCropLayout]);

    const applyCurrentCrop = useCallback(async () => {
        if (!croppedAreaPixels || !activeImage) return;

        setIsConverting(true);
        try {
            const { file, url } = await getCroppedImg(
                activeImage.currentUrl, 
                croppedAreaPixels, 
                fixedSize, 
                fixedSize, 
                activeImage.file.type
            );

            setImages(prev => prev.map((item, idx) => 
                idx === activeIndex 
                    ? { ...item, file, currentUrl: url, isCropped: true } 
                    : item
            ));
            
            setIsCropping(false);
        } catch (err) {
            console.error("Failed to crop image locally", err);
        } finally {
            setIsConverting(false);
        }
    }, [croppedAreaPixels, activeImage, activeIndex, fixedSize]);

    const addImages = useCallback(async (newFiles: File[]) => {
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

        const filtered = newFiles.filter(file => ALLOWED_TYPES.includes(file.type) && file.size <= MAX_SIZE);
        if (filtered.length === 0) return false;

        const validNewImages: InteractiveImage[] = [];
        for (const file of filtered) {
            let blobUrl = "";
            try {
                blobUrl = URL.createObjectURL(file);
            } catch {
                blobUrl = "";
            }
            const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => resolve(blobUrl);
                reader.readAsDataURL(file);
            });
            validNewImages.push({
                id: Math.random().toString(36).substring(7),
                file,
                currentUrl: dataUrl || blobUrl,
                isCropped: false
            });
        }

        if (validNewImages.length > 0) {
            setImages(prev => {
                const updated = [...prev, ...validNewImages];
                setActiveIndex(updated.length - validNewImages.length); // Switch to the first newly added image
                resetCropLayout();
                return updated;
            });
            return true;
        }
        
        return false;
    }, [resetCropLayout]);

    return {
        // State
        images,
        activeImage,
        activeIndex,
        crop,
        zoom,
        isConverting,
        isCropping,
        
        // Handlers
        setCrop,
        setZoom,
        setCroppedAreaPixels,
        setIsCropping,
        setActiveImageIndex,
        
        // Actions
        handleRotate,
        applyCurrentCrop,
        addImages,
    };
}

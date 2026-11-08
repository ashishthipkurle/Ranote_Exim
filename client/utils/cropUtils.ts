import { Area } from "react-easy-crop";

export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        // Only set crossOrigin for external HTTP(S) URLs. Blob and Data URLs fail in Chrome if crossOrigin is set.
        if (!url.startsWith("blob:") && !url.startsWith("data:")) {
            image.setAttribute("crossOrigin", "anonymous");
        }
        image.src = url;
    });

function getExtensionForMime(mimeType: string): string {
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/webp") return ".webp";
    return ".jpg";
}

/**
 * Resolves a cropped Blob from an image URL given crop boundaries and strict output dimensions.
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    fixedWidth: number = 800,
    fixedHeight: number = 800,
    mimeType: string = "image/jpeg"
): Promise<{ file: File; url: string }> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("No 2d context available");
    }

    canvas.width = fixedWidth;
    canvas.height = fixedHeight;

    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        fixedWidth,
        fixedHeight
    );

    const ext = getExtensionForMime(mimeType);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Canvas to Blob conversion failed"));
                return;
            }
            const file = new File([blob], `cropped-${Date.now()}${ext}`, { type: mimeType });
            const url = URL.createObjectURL(file);
            resolve({ file, url });
        }, mimeType, 0.95);
    });
}

/**
 * Returns a horizontally/vertically rotated image Blob.
 */
export async function getRotatedImage(
    imageSrc: string,
    rotationDegrees: number = 90,
    mimeType: string = "image/jpeg"
): Promise<{ file: File; url: string }> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
        throw new Error("No 2d context available");
    }

    const image = await createImage(imageSrc);
    
    // Canvas rotation pivots around origin, so we adjust canvas size safely to fit the rotated image boundaries.
    const isOrthogonal = rotationDegrees % 180 === 90;
    canvas.width = isOrthogonal ? image.height : image.width;
    canvas.height = isOrthogonal ? image.width : image.height;
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotationDegrees * Math.PI) / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    const ext = getExtensionForMime(mimeType);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Canvas to Blob rotation failed"));
                return;
            }
            const file = new File([blob], `rotated-${Date.now()}${ext}`, { type: mimeType });
            const url = URL.createObjectURL(file);
            resolve({ file, url });
        }, mimeType, 0.95);
    });
}

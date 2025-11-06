export const compressImage = (
  file: File,
  maxSizeKB: number = 500
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const maxDimension = 800;
      let { width, height } = img;

      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      // Try different quality levels to meet size requirement
      let quality = 0.8;
      let dataURL = canvas.toDataURL("image/jpeg", quality);

      // Estimate size (base64 is ~4/3 of binary size)
      const sizeKB = (dataURL.length * 3) / (4 * 1024);

      if (sizeKB > maxSizeKB && quality > 0.1) {
        quality = Math.max(0.1, (maxSizeKB / sizeKB) * quality);
        dataURL = canvas.toDataURL("image/jpeg", quality);
      }

      resolve(dataURL);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const validateImageFile = (file: File): string | null => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return "Please upload a valid image file (JPEG, PNG, GIF, or WebP)";
  }

  if (file.size > maxSize) {
    return "Image size must be less than 10MB";
  }

  return null;
};

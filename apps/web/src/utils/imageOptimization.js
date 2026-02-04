/**
 * Image Optimization Utilities
 * Expert Panel v4.9: Performance Engineer 建議 - WebP 格式與 lazy loading
 */

/**
 * Convert image to WebP format
 * @param {File|Blob} imageFile - Original image
 * @param {number} quality - Quality 0-1 (default 0.85)
 * @returns {Promise<Blob>} - WebP image blob
 */
export const convertToWebP = (imageFile, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => resolve(blob),
        'image/webp',
        quality
      );
    };

    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Resize image while maintaining aspect ratio
 * @param {File|Blob} imageFile - Original image
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<Blob>} - Resized image
 */
export const resizeImage = (imageFile, maxWidth = 1920, maxHeight = 1080) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(blob),
        'image/webp',
        0.85
      );
    };

    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Generate thumbnail
 * @param {File|Blob} imageFile - Original image
 * @param {number} size - Thumbnail size (square)
 * @returns {Promise<Blob>} - Thumbnail blob
 */
export const generateThumbnail = (imageFile, size = 200) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      
      // Calculate crop area for square thumbnail
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      canvas.toBlob(
        (blob) => resolve(blob),
        'image/webp',
        0.8
      );
    };

    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Lazy load image component helper
 * Creates an IntersectionObserver for lazy loading
 */
export const createLazyLoader = (options = {}) => {
  const { rootMargin = '50px', threshold = 0.1 } = options;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
        }
        
        observer.unobserve(img);
      }
    });
  }, { rootMargin, threshold });

  return {
    observe: (element) => observer.observe(element),
    disconnect: () => observer.disconnect(),
  };
};

/**
 * React hook for lazy loading images
 * Usage: const imgRef = useLazyImage(src);
 */
export const useLazyImageSetup = () => {
  // This is a setup function, actual hook would need React import
  return `
  import { useRef, useEffect, useState } from 'react';
  
  export const useLazyImage = (src) => {
    const imgRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (imgRef.current) {
              imgRef.current.src = src;
              setLoaded(true);
            }
            observer.disconnect();
          }
        },
        { rootMargin: '50px' }
      );
      
      if (imgRef.current) {
        observer.observe(imgRef.current);
      }
      
      return () => observer.disconnect();
    }, [src]);
    
    return { imgRef, loaded };
  };
  `;
};

/**
 * Picture element srcset generator for responsive images
 */
export const generateSrcSet = (basePath, filename, sizes = [320, 640, 1280, 1920]) => {
  const ext = filename.split('.').pop();
  const name = filename.replace(`.${ext}`, '');
  
  return {
    webp: sizes.map(s => `${basePath}/${name}-${s}.webp ${s}w`).join(', '),
    fallback: sizes.map(s => `${basePath}/${name}-${s}.${ext} ${s}w`).join(', '),
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  };
};

/**
 * Process uploaded images with optimization pipeline
 * @param {FileList|File[]} files - Image files
 * @returns {Promise<{original: string, webp: Blob, thumbnail: Blob}[]>}
 */
export const processUploadedImages = async (files, options = {}) => {
  const { maxWidth = 1920, maxHeight = 1080, thumbnailSize = 200 } = options;
  const results = [];

  for (const file of files) {
    try {
      // Convert and resize to WebP
      const resized = await resizeImage(file, maxWidth, maxHeight);
      const webp = await convertToWebP(resized);
      
      // Generate thumbnail
      const thumbnail = await generateThumbnail(file, thumbnailSize);

      results.push({
        original: file.name,
        webp,
        thumbnail,
        size: {
          original: file.size,
          optimized: webp.size,
          savings: Math.round((1 - webp.size / file.size) * 100),
        },
      });
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      results.push({ original: file.name, error });
    }
  }

  return results;
};

export default {
  convertToWebP,
  resizeImage,
  generateThumbnail,
  createLazyLoader,
  generateSrcSet,
  processUploadedImages,
};

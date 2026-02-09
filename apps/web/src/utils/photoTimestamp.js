/**
 * Photo Timestamp Utility
 * Expert Panel v4.9: Construction Site Manager 建議 - 施工照片時間戳功能
 */

/**
 * Add timestamp watermark to an image
 * @param {File|Blob} imageFile - Original image file
 * @param {Object} options - Timestamp options
 * @returns {Promise<Blob>} - Image with timestamp
 */
export const addPhotoTimestamp = async (imageFile, options = {}) => {
  const {
    timestamp = new Date(),
    location = '',
    projectName = '',
    position = 'bottom-right', // top-left, top-right, bottom-left, bottom-right
    fontSize = 14,
    padding = 10,
    backgroundColor = 'rgba(0, 0, 0, 0.6)',
    textColor = '#FFFFFF',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Prepare timestamp text
      const dateStr = timestamp.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const timeStr = timestamp.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      
      const lines = [
        `📅 ${dateStr} ${timeStr}`,
        location ? `📍 ${location}` : null,
        projectName ? `🏗️ ${projectName}` : null,
      ].filter(Boolean);

      // Calculate text dimensions
      ctx.font = `${fontSize}px sans-serif`;
      const lineHeight = fontSize * 1.4;
      const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
      const textHeight = lines.length * lineHeight;

      // Calculate position
      const boxWidth = textWidth + padding * 2;
      const boxHeight = textHeight + padding * 2;
      
      let x, y;
      switch (position) {
        case 'top-left':
          x = padding;
          y = padding;
          break;
        case 'top-right':
          x = canvas.width - boxWidth - padding;
          y = padding;
          break;
        case 'bottom-left':
          x = padding;
          y = canvas.height - boxHeight - padding;
          break;
        case 'bottom-right':
        default:
          x = canvas.width - boxWidth - padding;
          y = canvas.height - boxHeight - padding;
          break;
      }

      // Draw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(x, y, boxWidth, boxHeight);

      // Draw text
      ctx.fillStyle = textColor;
      ctx.font = `${fontSize}px sans-serif`;
      lines.forEach((line, i) => {
        ctx.fillText(line, x + padding, y + padding + (i + 0.8) * lineHeight);
      });

      // Convert to blob
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    };

    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Add GPS coordinates to timestamp if available
 * @returns {Promise<{latitude: number, longitude: number, address: string}>}
 */
export const getLocationInfo = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get address using reverse geocoding (requires API)
        let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        resolve({ latitude, longitude, address });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true }
    );
  });
};

/**
 * Create timestamped filename
 * @param {string} originalName - Original filename
 * @param {Date} timestamp - Timestamp to use
 * @returns {string} - New filename with timestamp
 */
export const createTimestampedFilename = (originalName, timestamp = new Date()) => {
  const ext = originalName.split('.').pop();
  const baseName = originalName.replace(`.${ext}`, '');
  const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${baseName}_${dateStr}.${ext}`;
};

/**
 * Process multiple photos with timestamps
 * @param {FileList|File[]} files - Image files
 * @param {Object} options - Options for all photos
 * @returns {Promise<{file: Blob, filename: string}[]>}
 */
export const processPhotosBatch = async (files, options = {}) => {
  const results = [];
  
  for (const file of files) {
    try {
      const timestampedBlob = await addPhotoTimestamp(file, options);
      const filename = createTimestampedFilename(file.name);
      results.push({ file: timestampedBlob, filename, original: file.name });
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      results.push({ error, original: file.name });
    }
  }
  
  return results;
};

/**
 * React hook-friendly photo capture with timestamp
 */
export const capturePhotoWithTimestamp = async (options = {}) => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      try {
        // Try to get location
        let location = '';
        try {
          const locInfo = await getLocationInfo();
          location = locInfo.address;
        } catch (e) {
          console.error('Location not available');
        }
        
        const timestampedBlob = await addPhotoTimestamp(file, {
          ...options,
          location,
          timestamp: new Date(),
        });
        
        const filename = createTimestampedFilename(file.name);
        resolve({ file: timestampedBlob, filename, original: file.name });
      } catch (error) {
        reject(error);
      }
    };
    
    input.click();
  });
};

export default {
  addPhotoTimestamp,
  getLocationInfo,
  createTimestampedFilename,
  processPhotosBatch,
  capturePhotoWithTimestamp,
};

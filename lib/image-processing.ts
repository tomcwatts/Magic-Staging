import sharp from 'sharp';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
}

export interface ProcessedImageResult {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    originalSize: number;
    compressionRatio: number;
  };
}

export async function processImage(
  inputBuffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 85,
    format = 'jpeg',
    progressive = true,
  } = options;

  const originalSize = inputBuffer.length;

  // Get original metadata
  const originalMetadata = await sharp(inputBuffer).metadata();

  // Process image with Sharp
  let pipeline = sharp(inputBuffer)
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .rotate(); // Auto-rotate based on EXIF

  // Apply format-specific optimizations
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({
        quality,
        progressive,
        mozjpeg: true, // Use mozjpeg encoder for better compression
      });
      break;
    case 'png':
      pipeline = pipeline.png({
        compressionLevel: 9,
        progressive,
      });
      break;
    case 'webp':
      pipeline = pipeline.webp({
        quality,
        effort: 6, // Max compression effort
      });
      break;
  }

  const processedBuffer = await pipeline.toBuffer();
  const processedMetadata = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    metadata: {
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0,
      format: processedMetadata.format || format,
      size: processedBuffer.length,
      originalSize,
      compressionRatio: Math.round(((originalSize - processedBuffer.length) / originalSize) * 100),
    },
  };
}

export async function generateThumbnail(
  inputBuffer: Buffer,
  size: number = 300
): Promise<Buffer> {
  return sharp(inputBuffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

export async function validateImageFile(buffer: Buffer): Promise<{
  isValid: boolean;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      return {
        isValid: false,
        error: 'Invalid image: Unable to determine dimensions',
      };
    }

    // Check minimum dimensions
    if (metadata.width < 100 || metadata.height < 100) {
      return {
        isValid: false,
        error: 'Image too small: Minimum 100x100 pixels required',
      };
    }

    // Check maximum dimensions
    if (metadata.width > 10000 || metadata.height > 10000) {
      return {
        isValid: false,
        error: 'Image too large: Maximum 10000x10000 pixels allowed',
      };
    }

    // Check file format
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!metadata.format || !supportedFormats.includes(metadata.format.toLowerCase())) {
      return {
        isValid: false,
        error: 'Unsupported format: Only JPEG, PNG, and WebP are allowed',
      };
    }

    return {
      isValid: true,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
import fs from 'fs';
import path from 'path';
import { writeFile, mkdir, access } from 'fs/promises';
import sharp from 'sharp';

// Base upload directory structure
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const ORIGINALS_DIR = path.join(UPLOADS_DIR, 'originals');
const STAGED_DIR = path.join(UPLOADS_DIR, 'staged');

export interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  path: string;
  url: string;
}

export interface UploadResult {
  success: boolean;
  file?: FileMetadata;
  error?: string;
}

// Ensure upload directories exist
export async function ensureUploadDirectories(): Promise<void> {
  const dirs = [UPLOADS_DIR, ORIGINALS_DIR, STAGED_DIR];
  
  for (const dir of dirs) {
    try {
      await access(dir);
    } catch {
      await mkdir(dir, { recursive: true });
    }
  }
}

// Generate secure filename with timestamp
export function generateSecureFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const name = prefix ? `${prefix}_${timestamp}_${randomSuffix}_${sanitized}` : `${timestamp}_${randomSuffix}_${sanitized}`;
  return name.toLowerCase();
}

// Create organized directory structure
export function createFilePath(organizationId: string, projectId: string, filename: string, type: 'original' | 'staged' = 'original'): {
  fullPath: string;
  relativePath: string;
  url: string;
} {
  const baseDir = type === 'original' ? ORIGINALS_DIR : STAGED_DIR;
  const orgDir = path.join(baseDir, organizationId);
  const projectDir = path.join(orgDir, projectId);
  
  const fullPath = path.join(projectDir, filename);
  const relativePath = path.relative(path.join(process.cwd(), 'public'), fullPath);
  const url = '/' + relativePath.replace(/\\/g, '/'); // Ensure forward slashes for URLs
  
  return { fullPath, relativePath, url };
}

// Save uploaded file with metadata extraction
export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  organizationId: string,
  projectId: string,
  type: 'original' | 'staged' = 'original'
): Promise<UploadResult> {
  try {
    await ensureUploadDirectories();
    
    const filename = generateSecureFilename(originalName);
    const { fullPath, url } = createFilePath(organizationId, projectId, filename, type);
    
    // Ensure project directory exists
    const projectDir = path.dirname(fullPath);
    await mkdir(projectDir, { recursive: true });
    
    // Extract image metadata using sharp
    let width: number | undefined;
    let height: number | undefined;
    
    if (mimeType.startsWith('image/')) {
      try {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width;
        height = metadata.height;
      } catch (error) {
        console.warn('Failed to extract image metadata:', error);
      }
    }
    
    // Save file
    await writeFile(fullPath, buffer);
    
    return {
      success: true,
      file: {
        filename,
        originalName,
        mimeType,
        size: buffer.length,
        width,
        height,
        path: fullPath,
        url,
      },
    };
  } catch (error) {
    console.error('File save failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Validate uploaded file
export function validateFile(file: File): { valid: boolean; error?: string } {
  // File size validation (10MB max)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  // File type validation
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  
  // Filename validation
  if (!file.name || file.name.trim().length === 0) {
    return { valid: false, error: 'Invalid filename' };
  }
  
  return { valid: true };
}

// Delete file from storage
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    console.error('File deletion failed:', error);
    return false;
  }
}

// Get file statistics
export async function getFileStats(filePath: string): Promise<{ exists: boolean; size?: number; modified?: Date }> {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime,
    };
  } catch {
    return { exists: false };
  }
}
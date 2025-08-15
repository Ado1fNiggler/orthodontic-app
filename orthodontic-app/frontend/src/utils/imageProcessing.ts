/**
 * Image Processing Utilities for Orthodontic App
 * Location: frontend/src/utils/imageProcessing.ts
 */

export interface ImageDimensions {
  width: number
  height: number
}

export interface ImageMetadata {
  filename: string
  size: number
  dimensions: ImageDimensions
  format: string
  quality?: number
  exif?: any
}

export interface ResizeOptions {
  width?: number
  height?: number
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  maintainAspectRatio?: boolean
}

export interface FilterOptions {
  brightness?: number // -100 to 100
  contrast?: number // -100 to 100
  saturation?: number // -100 to 100
  hue?: number // 0 to 360
  blur?: number // 0 to 10
  sharpen?: number // 0 to 10
  sepia?: number // 0 to 100
  grayscale?: boolean
  invert?: boolean
}

export interface CropOptions {
  x: number
  y: number
  width: number
  height: number
}

export interface RotateOptions {
  angle: number // in degrees
  backgroundColor?: string
}

export interface WatermarkOptions {
  text?: string
  image?: HTMLImageElement
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity?: number
  fontSize?: number
  color?: string
}

/**
 * Create canvas from image file
 */
export const createCanvasFromFile = (file: File): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      canvas.width = img.width
      canvas.height = img.height
      
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Create canvas from image URL
 */
export const createCanvasFromUrl = (url: string): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      canvas.width = img.width
      canvas.height = img.height
      
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.crossOrigin = 'anonymous'
    img.src = url
  })
}

/**
 * Get image metadata
 */
export const getImageMetadata = async (file: File): Promise<ImageMetadata> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const metadata: ImageMetadata = {
        filename: file.name,
        size: file.size,
        dimensions: {
          width: img.width,
          height: img.height
        },
        format: file.type
      }
      
      resolve(metadata)
    }
    
    img.onerror = () => reject(new Error('Failed to load image for metadata'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Resize image
 */
export const resizeImage = async (
  canvas: HTMLCanvasElement, 
  options: ResizeOptions
): Promise<HTMLCanvasElement> => {
  const { 
    width, 
    height, 
    maxWidth, 
    maxHeight, 
    maintainAspectRatio = true 
  } = options
  
  const originalWidth = canvas.width
  const originalHeight = canvas.height
  
  let newWidth = width || originalWidth
  let newHeight = height || originalHeight
  
  // Apply max constraints
  if (maxWidth && newWidth > maxWidth) {
    newWidth = maxWidth
    if (maintainAspectRatio) {
      newHeight = (newWidth / originalWidth) * originalHeight
    }
  }
  
  if (maxHeight && newHeight > maxHeight) {
    newHeight = maxHeight
    if (maintainAspectRatio) {
      newWidth = (newHeight / originalHeight) * originalWidth
    }
  }
  
  // Maintain aspect ratio if only one dimension is specified
  if (maintainAspectRatio) {
    if (width && !height) {
      newHeight = (newWidth / originalWidth) * originalHeight
    } else if (height && !width) {
      newWidth = (newHeight / originalHeight) * originalWidth
    }
  }
  
  const newCanvas = document.createElement('canvas')
  const ctx = newCanvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Canvas context not available')
  }
  
  newCanvas.width = Math.round(newWidth)
  newCanvas.height = Math.round(newHeight)
  
  // Use high-quality scaling
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height)
  
  return newCanvas
}

/**
 * Crop image
 */
export const cropImage = async (
  canvas: HTMLCanvasElement,
  options: CropOptions
): Promise<HTMLCanvasElement> => {
  const { x, y, width, height } = options
  
  const newCanvas = document.createElement('canvas')
  const ctx = newCanvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Canvas context not available')
  }
  
  newCanvas.width = width
  newCanvas.height = height
  
  ctx.drawImage(
    canvas,
    x, y, width, height,
    0, 0, width, height
  )
  
  return newCanvas
}

/**
 * Rotate image
 */
export const rotateImage = async (
  canvas: HTMLCanvasElement,
  options: RotateOptions
): Promise<HTMLCanvasElement> => {
  const { angle, backgroundColor = 'transparent' } = options
  
  const radians = (angle * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  
  const newWidth = canvas.width * cos + canvas.height * sin
  const newHeight = canvas.width * sin + canvas.height * cos
  
  const newCanvas = document.createElement('canvas')
  const ctx = newCanvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Canvas context not available')
  }
  
  newCanvas.width = newWidth
  newCanvas.height = newHeight
  
  // Fill background
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, newWidth, newHeight)
  }
  
  // Move to center and rotate
  ctx.translate(newWidth / 2, newHeight / 2)
  ctx.rotate(radians)
  
  // Draw image centered
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
  
  return newCanvas
}

/**
 * Apply filters to image
 */
export const applyFilters = async (
  canvas: HTMLCanvasElement,
  filters: FilterOptions
): Promise<HTMLCanvasElement> => {
  const newCanvas = document.createElement('canvas')
  const ctx = newCanvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Canvas context not available')
  }
  
  newCanvas.width = canvas.width
  newCanvas.height = canvas.height
  
  // Build CSS filter string
  let filterString = ''
  
  if (filters.brightness !== undefined) {
    filterString += `brightness(${100 + filters.brightness}%) `
  }
  
  if (filters.contrast !== undefined) {
    filterString += `contrast(${100 + filters.contrast}%) `
  }
  
  if (filters.saturation !== undefined) {
    filterString += `saturate(${100 + filters.saturation}%) `
  }
  
  if (filters.hue !== undefined) {
    filterString += `hue-rotate(${filters.hue}deg) `
  }
  
  if (filters.blur !== undefined) {
    filterString += `blur(${filters.blur}px) `
  }
  
  if (filters.sepia !== undefined) {
    filterString += `sepia(${filters.sepia}%) `
  }
  
  if (filters.grayscale) {
    filterString += 'grayscale(100%) '
  }
  
  if (filters.invert) {
    filterString += 'invert(100%) '
  }
  
  // Apply CSS filters
  ctx.filter = filterString.trim()
  ctx.drawImage(canvas, 0, 0)
  
  // Apply manual filters that CSS can't handle
  if (filters.sharpen && filters.sharpen > 0) {
    applySharpenFilter(ctx, newCanvas, filters.sharpen)
  }
  
  return newCanvas
}

/**
 * Apply sharpen filter manually
 */
const applySharpenFilter = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  amount: number
) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height
  
  // Sharpen kernel
  const kernel = [
    0, -amount / 8, 0,
    -amount / 8, 1 + amount, -amount / 8,
    0, -amount / 8, 0
  ]
  
  const newData = new Uint8ClampedArray(data.length)
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c
            const kernelIdx = (ky + 1) * 3 + (kx + 1)
            sum += data[idx] * kernel[kernelIdx]
          }
        }
        
        const idx = (y * width + x) * 4 + c
        newData[idx] = Math.max(0, Math.min(255, sum))
      }
      
      // Copy alpha channel
      const alphaIdx = (y * width + x) * 4 + 3
      newData[alphaIdx] = data[alphaIdx]
    }
  }
  
  const newImageData = new ImageData(newData, width, height)
  ctx.putImageData(newImageData, 0, 0)
}

/**
 * Add watermark to image
 */
export const addWatermark = async (
  canvas: HTMLCanvasElement,
  options: WatermarkOptions
): Promise<HTMLCanvasElement> => {
  const { text, image, position, opacity = 0.5, fontSize = 24, color = '#ffffff' } = options
  
  const newCanvas = document.createElement('canvas')
  const ctx = newCanvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Canvas context not available')
  }
  
  newCanvas.width = canvas.width
  newCanvas.height = canvas.height
  
  // Draw original image
  ctx.drawImage(canvas, 0, 0)
  
  // Set watermark opacity
  ctx.globalAlpha = opacity
  
  if (text) {
    // Text watermark
    ctx.font = `${fontSize}px Arial`
    ctx.fillStyle = color
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    
    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = fontSize
    
    let x = 0, y = 0
    
    switch (position) {
      case 'top-left':
        x = 20
        y = 20
        break
      case 'top-right':
        x = canvas.width - textWidth - 20
        y = 20
        break
      case 'bottom-left':
        x = 20
        y = canvas.height - textHeight - 20
        break
      case 'bottom-right':
        x = canvas.width - textWidth - 20
        y = canvas.height - textHeight - 20
        break
      case 'center':
        x = (canvas.width - textWidth) / 2
        y = (canvas.height - textHeight) / 2
        break
    }
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    
    ctx.fillText(text, x, y)
  }
  
  if (image) {
    // Image watermark
    const watermarkWidth = Math.min(image.width, canvas.width * 0.3)
    const watermarkHeight = (watermarkWidth / image.width) * image.height
    
    let x = 0, y = 0
    
    switch (position) {
      case 'top-left':
        x = 20
        y = 20
        break
      case 'top-right':
        x = canvas.width - watermarkWidth - 20
        y = 20
        break
      case 'bottom-left':
        x = 20
        y = canvas.height - watermarkHeight - 20
        break
      case 'bottom-right':
        x = canvas.width - watermarkWidth - 20
        y = canvas.height - watermarkHeight - 20
        break
      case 'center':
        x = (canvas.width - watermarkWidth) / 2
        y = (canvas.height - watermarkHeight) / 2
        break
    }
    
    ctx.drawImage(image, x, y, watermarkWidth, watermarkHeight)
  }
  
  // Reset alpha
  ctx.globalAlpha = 1
  
  return newCanvas
}

/**
 * Convert canvas to blob
 */
export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  format: string = 'image/jpeg',
  quality: number = 0.9
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to convert canvas to blob'))
      }
    }, format, quality)
  })
}

/**
 * Convert canvas to data URL
 */
export const canvasToDataUrl = (
  canvas: HTMLCanvasElement,
  format: string = 'image/jpeg',
  quality: number = 0.9
): string => {
  return canvas.toDataURL(format, quality)
}

/**
 * Generate thumbnail from image
 */
export const generateThumbnail = async (
  file: File,
  maxSize: number = 300
): Promise<Blob> => {
  const canvas = await createCanvasFromFile(file)
  const resized = await resizeImage(canvas, {
    maxWidth: maxSize,
    maxHeight: maxSize,
    maintainAspectRatio: true
  })
  
  return canvasToBlob(resized, 'image/jpeg', 0.8)
}

/**
 * Compress image
 */
export const compressImage = async (
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  } = {}
): Promise<Blob> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg'
  } = options
  
  const canvas = await createCanvasFromFile(file)
  const resized = await resizeImage(canvas, {
    maxWidth,
    maxHeight,
    maintainAspectRatio: true
  })
  
  const mimeType = `image/${format}`
  return canvasToBlob(resized, mimeType, quality)
}

/**
 * Batch process images
 */
export const batchProcessImages = async (
  files: File[],
  processor: (file: File) => Promise<Blob>,
  onProgress?: (completed: number, total: number) => void
): Promise<Blob[]> => {
  const results: Blob[] = []
  
  for (let i = 0; i < files.length; i++) {
    const result = await processor(files[i])
    results.push(result)
    
    if (onProgress) {
      onProgress(i + 1, files.length)
    }
  }
  
  return results
}

/**
 * Check if image format is supported
 */
export const isImageFormatSupported = (mimeType: string): boolean => {
  const supportedFormats = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp'
  ]
  
  return supportedFormats.includes(mimeType.toLowerCase())
}

/**
 * Get optimal image format based on content
 */
export const getOptimalFormat = (hasTransparency: boolean, isPhotographic: boolean): string => {
  if (hasTransparency) {
    return 'image/png'
  }
  
  if (isPhotographic) {
    return 'image/jpeg'
  }
  
  return 'image/webp'
}

/**
 * Calculate image file size after compression
 */
export const estimateCompressedSize = (
  originalSize: number,
  quality: number,
  newWidth: number,
  newHeight: number,
  originalWidth: number,
  originalHeight: number
): number => {
  const sizeRatio = (newWidth * newHeight) / (originalWidth * originalHeight)
  const qualityFactor = quality
  
  return Math.round(originalSize * sizeRatio * qualityFactor)
}
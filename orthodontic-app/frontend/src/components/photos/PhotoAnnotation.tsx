import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PencilIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PaintBrushIcon,
  CursorArrowRippleIcon,
  Square2StackIcon,
  EyeDropperIcon
} from '@heroicons/react/24/outline'

// Components
import Button from '@components/common/Button'
import Input from '@components/common/Input'
import Modal from '@components/common/Modal'

// Types
import { Photo } from '@types/photo'

interface PhotoAnnotationProps {
  photo: Photo
  isOpen: boolean
  onClose: () => void
  onSave: (annotations: Annotation[], annotatedImageBlob: Blob) => void
  readonly?: boolean
  className?: string
}

interface Annotation {
  id: string
  type: 'arrow' | 'text' | 'circle' | 'rectangle' | 'freehand'
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  color: string
  strokeWidth: number
  points?: { x: number; y: number }[]
  timestamp: number
}

interface DrawingState {
  isDrawing: boolean
  currentTool: Annotation['type']
  currentColor: string
  currentStrokeWidth: number
  startX: number
  startY: number
  currentPoints: { x: number; y: number }[]
}

const PhotoAnnotation: React.FC<PhotoAnnotationProps> = ({
  photo,
  isOpen,
  onClose,
  onSave,
  readonly = false,
  className
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentTool: 'arrow',
    currentColor: '#EF4444',
    currentStrokeWidth: 3,
    startX: 0,
    startY: 0,
    currentPoints: []
  })
  const [history, setHistory] = useState<Annotation[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const [textValue, setTextValue] = useState('')
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Colors palette
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EC4899', '#64748B', '#000000'
  ]

  // Stroke widths
  const strokeWidths = [1, 2, 3, 5, 8]

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || !photo) return

    const canvas = canvasRef.current
    const image = imageRef.current
    const container = containerRef.current

    if (!canvas || !image || !container) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Load existing annotations if any
    if (photo.annotations) {
      setAnnotations(photo.annotations)
      addToHistory(photo.annotations)
    }

    // Set up canvas dimensions
    const updateCanvasSize = () => {
      const containerRect = container.getBoundingClientRect()
      const imageAspectRatio = image.naturalWidth / image.naturalHeight
      const containerAspectRatio = containerRect.width / containerRect.height

      let displayWidth, displayHeight

      if (imageAspectRatio > containerAspectRatio) {
        displayWidth = containerRect.width
        displayHeight = displayWidth / imageAspectRatio
      } else {
        displayHeight = containerRect.height
        displayWidth = displayHeight * imageAspectRatio
      }

      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`

      setScale(image.naturalWidth / displayWidth)
      setOffset({
        x: (containerRect.width - displayWidth) / 2,
        y: (containerRect.height - displayHeight) / 2
      })

      redrawCanvas()
    }

    image.onload = updateCanvasSize
    window.addEventListener('resize', updateCanvasSize)

    if (image.complete) {
      updateCanvasSize()
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [isOpen, photo])

  // Add to history for undo/redo
  const addToHistory = useCallback((newAnnotations: Annotation[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push([...newAnnotations])
      return newHistory.slice(-20) // Keep last 20 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 19))
  }, [historyIndex])

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setAnnotations([...history[historyIndex - 1]])
    }
  }, [history, historyIndex])

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setAnnotations([...history[historyIndex + 1]])
    }
  }, [history, historyIndex])

  // Clear all annotations
  const clearAll = useCallback(() => {
    if (confirm('Είστε βέβαιοι ότι θέλετε να διαγράψετε όλες τις σημειώσεις;')) {
      const newAnnotations: Annotation[] = []
      setAnnotations(newAnnotations)
      addToHistory(newAnnotations)
    }
  }, [addToHistory])

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Draw annotations
    annotations.forEach(annotation => {
      context.strokeStyle = annotation.color
      context.lineWidth = annotation.strokeWidth
      context.lineCap = 'round'
      context.lineJoin = 'round'

      switch (annotation.type) {
        case 'arrow':
          drawArrow(context, annotation)
          break
        case 'circle':
          drawCircle(context, annotation)
          break
        case 'rectangle':
          drawRectangle(context, annotation)
          break
        case 'freehand':
          drawFreehand(context, annotation)
          break
        case 'text':
          drawText(context, annotation)
          break
      }
    })
  }, [annotations])

  // Draw arrow
  const drawArrow = (context: CanvasRenderingContext2D, annotation: Annotation) => {
    const { x, y, width = 0, height = 0 } = annotation
    const headSize = Math.max(10, annotation.strokeWidth * 3)

    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(x + width, y + height)
    context.stroke()

    // Arrow head
    const angle = Math.atan2(height, width)
    const headX = x + width
    const headY = y + height

    context.beginPath()
    context.moveTo(headX, headY)
    context.lineTo(
      headX - headSize * Math.cos(angle - Math.PI / 6),
      headY - headSize * Math.sin(angle - Math.PI / 6)
    )
    context.moveTo(headX, headY)
    context.lineTo(
      headX - headSize * Math.cos(angle + Math.PI / 6),
      headY - headSize * Math.sin(angle + Math.PI / 6)
    )
    context.stroke()
  }

  // Draw circle
  const drawCircle = (context: CanvasRenderingContext2D, annotation: Annotation) => {
    const { x, y, width = 0, height = 0 } = annotation
    const centerX = x + width / 2
    const centerY = y + height / 2
    const radius = Math.sqrt(width * width + height * height) / 2

    context.beginPath()
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    context.stroke()
  }

  // Draw rectangle
  const drawRectangle = (context: CanvasRenderingContext2D, annotation: Annotation) => {
    const { x, y, width = 0, height = 0 } = annotation
    context.beginPath()
    context.rect(x, y, width, height)
    context.stroke()
  }

  // Draw freehand
  const drawFreehand = (context: CanvasRenderingContext2D, annotation: Annotation) => {
    if (!annotation.points || annotation.points.length < 2) return

    context.beginPath()
    context.moveTo(annotation.points[0].x, annotation.points[0].y)
    
    for (let i = 1; i < annotation.points.length; i++) {
      context.lineTo(annotation.points[i].x, annotation.points[i].y)
    }
    
    context.stroke()
  }

  // Draw text
  const drawText = (context: CanvasRenderingContext2D, annotation: Annotation) => {
    if (!annotation.text) return

    const fontSize = Math.max(16, annotation.strokeWidth * 6)
    context.font = `${fontSize}px Arial`
    context.fillStyle = annotation.color
    context.textAlign = 'left'
    context.textBaseline = 'top'

    // Draw text with background
    const textMetrics = context.measureText(annotation.text)
    const textWidth = textMetrics.width
    const textHeight = fontSize

    // Background
    context.fillStyle = 'rgba(255, 255, 255, 0.9)'
    context.fillRect(annotation.x - 4, annotation.y - 4, textWidth + 8, textHeight + 8)

    // Text
    context.fillStyle = annotation.color
    context.fillText(annotation.text, annotation.x, annotation.y)
  }

  // Get mouse position relative to canvas
  const getCanvasPosition = (event: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * scale,
      y: (event.clientY - rect.top) * scale
    }
  }

  // Handle mouse down
  const handleMouseDown = (event: React.MouseEvent) => {
    if (readonly) return

    const position = getCanvasPosition(event)

    if (drawingState.currentTool === 'text') {
      setTextPosition(position)
      setShowTextInput(true)
      return
    }

    setDrawingState(prev => ({
      ...prev,
      isDrawing: true,
      startX: position.x,
      startY: position.y,
      currentPoints: [position]
    }))
  }

  // Handle mouse move
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!drawingState.isDrawing || readonly) return

    const position = getCanvasPosition(event)

    if (drawingState.currentTool === 'freehand') {
      setDrawingState(prev => ({
        ...prev,
        currentPoints: [...prev.currentPoints, position]
      }))

      // Draw real-time for freehand
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (context && drawingState.currentPoints.length > 1) {
        context.strokeStyle = drawingState.currentColor
        context.lineWidth = drawingState.currentStrokeWidth
        context.lineCap = 'round'
        context.lineJoin = 'round'

        const points = drawingState.currentPoints
        const lastPoint = points[points.length - 2]
        
        context.beginPath()
        context.moveTo(lastPoint.x, lastPoint.y)
        context.lineTo(position.x, position.y)
        context.stroke()
      }
    } else {
      // For other tools, just update the preview
      redrawCanvas()
      drawPreview(position)
    }
  }

  // Draw preview while drawing
  const drawPreview = (currentPosition: { x: number; y: number }) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context) return

    context.strokeStyle = drawingState.currentColor
    context.lineWidth = drawingState.currentStrokeWidth
    context.lineCap = 'round'
    context.lineJoin = 'round'

    const width = currentPosition.x - drawingState.startX
    const height = currentPosition.y - drawingState.startY

    switch (drawingState.currentTool) {
      case 'arrow':
        drawArrow(context, {
          id: 'preview',
          type: 'arrow',
          x: drawingState.startX,
          y: drawingState.startY,
          width,
          height,
          color: drawingState.currentColor,
          strokeWidth: drawingState.currentStrokeWidth,
          timestamp: Date.now()
        })
        break
      case 'circle':
        drawCircle(context, {
          id: 'preview',
          type: 'circle',
          x: drawingState.startX,
          y: drawingState.startY,
          width,
          height,
          color: drawingState.currentColor,
          strokeWidth: drawingState.currentStrokeWidth,
          timestamp: Date.now()
        })
        break
      case 'rectangle':
        drawRectangle(context, {
          id: 'preview',
          type: 'rectangle',
          x: drawingState.startX,
          y: drawingState.startY,
          width,
          height,
          color: drawingState.currentColor,
          strokeWidth: drawingState.currentStrokeWidth,
          timestamp: Date.now()
        })
        break
    }
  }

  // Handle mouse up
  const handleMouseUp = (event: React.MouseEvent) => {
    if (!drawingState.isDrawing || readonly) return

    const position = getCanvasPosition(event)

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}-${Math.random()}`,
      type: drawingState.currentTool,
      x: drawingState.startX,
      y: drawingState.startY,
      color: drawingState.currentColor,
      strokeWidth: drawingState.currentStrokeWidth,
      timestamp: Date.now()
    }

    if (drawingState.currentTool === 'freehand') {
      newAnnotation.points = drawingState.currentPoints
    } else {
      newAnnotation.width = position.x - drawingState.startX
      newAnnotation.height = position.y - drawingState.startY
    }

    const newAnnotations = [...annotations, newAnnotation]
    setAnnotations(newAnnotations)
    addToHistory(newAnnotations)

    setDrawingState(prev => ({
      ...prev,
      isDrawing: false,
      currentPoints: []
    }))

    redrawCanvas()
  }

  // Handle text input
  const handleTextSubmit = () => {
    if (!textValue.trim()) {
      setShowTextInput(false)
      setTextValue('')
      return
    }

    const newAnnotation: Annotation = {
      id: `text-${Date.now()}-${Math.random()}`,
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      text: textValue,
      color: drawingState.currentColor,
      strokeWidth: drawingState.currentStrokeWidth,
      timestamp: Date.now()
    }

    const newAnnotations = [...annotations, newAnnotation]
    setAnnotations(newAnnotations)
    addToHistory(newAnnotations)

    setShowTextInput(false)
    setTextValue('')
    redrawCanvas()
  }

  // Handle save
  const handleSave = async () => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    // Create a new canvas for the final image
    const finalCanvas = document.createElement('canvas')
    const finalContext = finalCanvas.getContext('2d')
    if (!finalContext) return

    finalCanvas.width = image.naturalWidth
    finalCanvas.height = image.naturalHeight

    // Draw the original image
    finalContext.drawImage(image, 0, 0)

    // Draw all annotations
    annotations.forEach(annotation => {
      finalContext.strokeStyle = annotation.color
      finalContext.lineWidth = annotation.strokeWidth
      finalContext.lineCap = 'round'
      finalContext.lineJoin = 'round'

      switch (annotation.type) {
        case 'arrow':
          drawArrow(finalContext, annotation)
          break
        case 'circle':
          drawCircle(finalContext, annotation)
          break
        case 'rectangle':
          drawRectangle(finalContext, annotation)
          break
        case 'freehand':
          drawFreehand(finalContext, annotation)
          break
        case 'text':
          drawText(finalContext, annotation)
          break
      }
    })

    // Convert to blob
    finalCanvas.toBlob((blob) => {
      if (blob) {
        onSave(annotations, blob)
      }
    }, 'image/jpeg', 0.9)
  }

  // Redraw when annotations change
  useEffect(() => {
    redrawCanvas()
  }, [annotations, redrawCanvas])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Σημειώσεις φωτογραφίας"
      size="full"
    >
      <div className={`h-full flex flex-col ${className}`}>
        {/* Toolbar */}
        {!readonly && (
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
            <div className="flex items-center space-x-4">
              {/* Tools */}
              <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border">
                {[
                  { tool: 'arrow', icon: CursorArrowRippleIcon, label: 'Βέλος' },
                  { tool: 'text', icon: ChatBubbleBottomCenterTextIcon, label: 'Κείμενο' },
                  { tool: 'circle', icon: 'O', label: 'Κύκλος' },
                  { tool: 'rectangle', icon: Square2StackIcon, label: 'Ορθογώνιο' },
                  { tool: 'freehand', icon: PencilIcon, label: 'Ελεύθερο σχέδιο' }
                ].map(({ tool, icon: Icon, label }) => (
                  <button
                    key={tool}
                    onClick={() => setDrawingState(prev => ({ 
                      ...prev, 
                      currentTool: tool as Annotation['type'] 
                    }))}
                    className={`p-2 rounded transition-colors ${
                      drawingState.currentTool === tool
                        ? 'bg-primary-100 text-primary-600'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title={label}
                  >
                    {typeof Icon === 'string' ? (
                      <span className="text-lg font-bold">{Icon}</span>
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </button>
                ))}
              </div>

              {/* Colors */}
              <div className="flex items-center space-x-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setDrawingState(prev => ({ ...prev, currentColor: color }))}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      drawingState.currentColor === color
                        ? 'border-gray-400 scale-110'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Stroke width */}
              <div className="flex items-center space-x-2">
                <PaintBrushIcon className="h-4 w-4 text-gray-500" />
                <select
                  value={drawingState.currentStrokeWidth}
                  onChange={(e) => setDrawingState(prev => ({ 
                    ...prev, 
                    currentStrokeWidth: parseInt(e.target.value) 
                  }))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {strokeWidths.map(width => (
                    <option key={width} value={width}>
                      {width}px
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Undo/Redo */}
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <ArrowUturnLeftIcon className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <ArrowUturnRightIcon className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={annotations.length === 0}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>

              <Button onClick={handleSave}>
                <CheckIcon className="h-4 w-4 mr-2" />
                Αποθήκευση
              </Button>
            </div>
          </div>
        )}

        {/* Canvas container */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-900">
          {/* Background image */}
          <img
            ref={imageRef}
            src={photo.url}
            alt={photo.title || photo.filename}
            className="absolute inset-0 w-full h-full object-contain"
            crossOrigin="anonymous"
          />

          {/* Annotation canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              left: `${offset.x}px`,
              top: `${offset.y}px`
            }}
          />

          {/* Text input modal */}
          <AnimatePresence>
            {showTextInput && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bg-white rounded-lg shadow-lg p-4 border"
                style={{
                  left: `${textPosition.x / scale + offset.x}px`,
                  top: `${textPosition.y / scale + offset.y}px`,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 10
                }}
              >
                <div className="space-y-3">
                  <Input
                    placeholder="Εισάγετε κείμενο..."
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTextSubmit()
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowTextInput(false)
                        setTextValue('')
                      }}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleTextSubmit}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions */}
          {!readonly && annotations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black bg-opacity-60 text-white rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium mb-2">
                  Προσθέστε σημειώσεις
                </h3>
                <p className="text-sm text-gray-300">
                  Επιλέξτε ένα εργαλείο και σχεδιάστε στη φωτογραφία
                </p>
              </div>
            </div>
          )}

          {/* Readonly indicator */}
          {readonly && (
            <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-lg text-sm">
              Μόνο προβολή
            </div>
          )}

          {/* Annotation count */}
          {annotations.length > 0 && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm">
              {annotations.length} σημειώσεις
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default PhotoAnnotation
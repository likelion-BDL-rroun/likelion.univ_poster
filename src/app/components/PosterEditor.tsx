import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Type,
  Image as ImageIcon,
  Trash2,
  Copy,
  RotateCw,
  Square,
  RectangleVertical,
  FileImage,
  FileText,
  X,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Edit3,
  Bold,
  Palette,
  ChevronLeft,
  ChevronRight,
  Move,
  Check,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
  Plus,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Slider } from './ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

// Assets (src/assets)
import graphic1 from '@/assets/7f268fcf1b34dd773c1267d6b284f6d466a7ff90.png';
import graphic2 from '@/assets/504c9692619679e1102f0604c238c93565b27e90.png';
import graphic3 from '@/assets/7f51cb8b50a5aae39d24fa57a2886510d2ddd9e7.png';
import graphic4 from '@/assets/45df1ebab6d6747802e08998f8d0bedbb927e755.png';
import graphic5 from '@/assets/f3a42bc7d1b44b2c61ea9bc91290cdf858b80ba0.png';
import graphic6 from '@/assets/61688ff0cb963d56e050036fe6fdfff880d6396c.png';
import graphic7 from '@/assets/a8a8cd21650d8151665ff3b8bc1c1bdabba4d9ea.png';
import graphic8 from '@/assets/63f824b7ca639dd2e05aff2b530df70fe9ca3454.png';
import pcLogo from '@/assets/a21d82b6c66b714b005b28616609469cb608cd01.png';
import mobileLogo from '@/assets/d96a3bfc7837e8a5dc14aaed6683b27d24322e4b.png';

const GRAPHICS = [
  { id: 1, src: graphic1, name: 'Graphic 1' },
  { id: 2, src: graphic2, name: 'Graphic 2' },
  { id: 3, src: graphic3, name: 'Graphic 3' },
  { id: 4, src: graphic4, name: 'Graphic 4' },
  { id: 5, src: graphic5, name: 'Graphic 5' },
  { id: 6, src: graphic6, name: 'Graphic 6' },
  { id: 7, src: graphic7, name: 'Graphic 7' },
  { id: 8, src: graphic8, name: 'Graphic 8' },
];

const FONTS = [
  { name: 'Pretendard', value: 'Pretendard' },
  { name: 'SUITE', value: 'SUITE' },
  { name: 'Montserrat', value: 'Montserrat' },
  { name: 'Sans Serif', value: 'sans-serif' },
  { name: 'Serif', value: 'serif' },
];

const CANVAS_RATIOS = [
  { id: '1:1', name: '1:1 (정사각형)', width: 1000, height: 1000, icon: Square },
  { id: '3:4', name: '3:4 (세로)', width: 750, height: 1000, icon: RectangleVertical },
  { id: '9:16', name: '9:16 (세로)', width: 562, height: 1000, icon: RectangleVertical },
  { id: 'A3', name: 'A3 (세로)', width: 1000, height: 1414, icon: RectangleVertical },
];

const MONO_COLORS = ['#FFFFFF', '#F9F9F9', '#E6E6E6', '#D1D1D1', '#B8B8B8', '#969696', '#787878', '#5C5C5C', '#424242', '#2B2B2B', '#1C1C1C', '#000000'];

const PRIMARY_COLORS = ['#FFF3EB', '#FFD0B2', '#FEA770', '#FF8032', '#FF6000', '#E05600', '#A23F00', '#652700', '#3E1801', '#291000'];

interface CanvasElement {
  id: string;
  type: 'graphic' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  src?: string;
  fontSize?: number;
  fontColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'italic' | 'normal';
  textDecoration?: 'underline' | 'line-through' | 'none';
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  zIndex: number;
}

type SidebarPanel = 'canvas' | 'graphics' | 'text' | 'export' | null;

export function PosterEditor() {
  const [selectedRatio, setSelectedRatio] = useState(CANVAS_RATIOS[0]);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotationStart, setRotationStart] = useState({ angle: 0, mouseAngle: 0 });
  const [activePanel, setActivePanel] = useState<SidebarPanel>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [guides, setGuides] = useState<Array<{ type: 'horizontal' | 'vertical', position: number }>>([]);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const canvasRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const [canvasScale, setCanvasScale] = useState(0.5);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const [showMobileZoom, setShowMobileZoom] = useState(false);
  const hasInitialScaleRef = useRef(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // Initialize with canvas panel open on desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setActivePanel('canvas');
    }
  }, []);

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Reliable viewport height for mobile (avoid 100vh issues)
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (window.innerWidth < 768) return;

      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const containerWidth = container.clientWidth - 80; // More padding
          const containerHeight = container.clientHeight - 80;
          
          const scaleX = containerWidth / selectedRatio.width;
          const scaleY = containerHeight / selectedRatio.height;
          const baseScale = Math.min(scaleX, scaleY);
          
          if (!hasInitialScaleRef.current) {
            setCanvasScale(Math.max(0.01, Math.min(baseScale, 0.9))); // Set only once
            hasInitialScaleRef.current = true;
          }
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [selectedRatio.width, selectedRatio.height]); // Recompute baseScale only for first ratio & on resize

  useEffect(() => {
    if (isEditingText && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isEditingText]);

  const addGraphic = (graphic: typeof GRAPHICS[0]) => {
    const newElement: CanvasElement = {
      id: `graphic-${Date.now()}`,
      type: 'graphic',
      x: selectedRatio.width / 2 - 100,
      y: selectedRatio.height / 2 - 100,
      width: 200,
      height: 200,
      rotation: 0,
      src: graphic.src,
      zIndex: elements.length,
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
    if (window.innerWidth < 768) setActivePanel(null);
  };

  const addText = () => {
    const fontSize = 48;
    const content = '텍스트 입력';
    
    // Estimate width
    const textWidth = content.length * fontSize; 
    const textHeight = fontSize * 1.5;
      
    const newElement: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: selectedRatio.width / 2 - textWidth / 2,
      y: selectedRatio.height / 2 - textHeight / 2,
      width: textWidth,
      height: textHeight,
      rotation: 0,
      content: content,
      fontSize: fontSize,
      fontColor: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      fontFamily: 'Pretendard',
      zIndex: elements.length,
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
    setIsEditingText(true);
    if (window.innerWidth < 768) setActivePanel(null);
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const duplicateElement = (id: string) => {
    const element = elements.find((el) => el.id === id);
    if (element) {
      const newElement: CanvasElement = {
        ...element,
        id: `${element.type}-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
        zIndex: elements.length,
      };
      setElements([...elements, newElement]);
      setSelectedElementId(newElement.id);
    }
  };

  const rotateElement = (id: string) => {
    const element = elements.find((el) => el.id === id);
    if (element) {
      updateElement(id, {
        rotation: (element.rotation + 90) % 360,
      });
    }
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  // Mouse/Touch Event Handlers
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    setIsDragging(true);
    setIsEditingText(false);
    const element = elements.find((el) => el.id === elementId);
    if (element) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left) / canvasScale;
        const mouseY = (e.clientY - rect.top) / canvasScale;
        setDragStart({
          x: mouseX - element.x,
          y: mouseY - element.y,
        });
      }
    }
  };

  const handleElementTouchStart = (e: React.TouchEvent, elementId: string) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    setSelectedElementId(elementId);
    setIsDragging(true);
    setIsEditingText(false);
    const touch = e.touches[0];
    const element = elements.find((el) => el.id === elementId);
    if (element && canvasRef.current && touch) {
      const rect = canvasRef.current.getBoundingClientRect();
      const touchX = (touch.clientX - rect.left) / canvasScale;
      const touchY = (touch.clientY - rect.top) / canvasScale;
      setDragStart({
        x: touchX - element.x,
        y: touchY - element.y,
      });
    }
  };

  // Shared helpers for drag/resize/rotate (mouse & touch)
  const applyDragAtPoint = (clientX: number, clientY: number) => {
    if (!selectedElementId) return;
    const element = elements.find((el) => el.id === selectedElementId);
    if (!element || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pointerX = (clientX - rect.left) / canvasScale;
    const pointerY = (clientY - rect.top) / canvasScale;
    let newX = pointerX - dragStart.x;
    let newY = pointerY - dragStart.y;

    // Smart Guides Logic
    const SNAP_THRESHOLD = 5;
    const newGuides: Array<{ type: 'horizontal' | 'vertical', position: number }> = [];
    const centerX = newX + element.width / 2;
    const centerY = newY + element.height / 2;
    const canvasCenterX = selectedRatio.width / 2;
    const canvasCenterY = selectedRatio.height / 2;

    // Snap to Canvas Center
    if (Math.abs(centerX - canvasCenterX) < SNAP_THRESHOLD) {
      newX = canvasCenterX - element.width / 2;
      newGuides.push({ type: 'vertical', position: canvasCenterX });
    }
    if (Math.abs(centerY - canvasCenterY) < SNAP_THRESHOLD) {
      newY = canvasCenterY - element.height / 2;
      newGuides.push({ type: 'horizontal', position: canvasCenterY });
    }

    // Snap to other elements
    elements.forEach(other => {
      if (other.id === selectedElementId) return;
      const otherCenterX = other.x + other.width / 2;
      const otherCenterY = other.y + other.height / 2;

      if (Math.abs(centerX - otherCenterX) < SNAP_THRESHOLD) {
        newX = otherCenterX - element.width / 2;
        newGuides.push({ type: 'vertical', position: otherCenterX });
      }
      if (Math.abs(centerY - otherCenterY) < SNAP_THRESHOLD) {
        newY = otherCenterY - element.height / 2;
        newGuides.push({ type: 'horizontal', position: otherCenterY });
      }
    });

    setGuides(newGuides);

    updateElement(selectedElementId, {
      x: newX,
      y: newY,
    });
  };

  const applyResizeAtPoint = (clientX: number, clientY: number) => {
    if (!selectedElementId || !resizeDirection) return;
    const element = elements.find((el) => el.id === selectedElementId);
    if (!element || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pointerX = (clientX - rect.left) / canvasScale;
    const pointerY = (clientY - rect.top) / canvasScale;

    let newX = element.x;
    let newY = element.y;
    let newWidth = element.width;
    let newHeight = element.height;

    // Simple resizing logic
    if (resizeDirection.includes('e')) newWidth = Math.max(20, pointerX - element.x);
    if (resizeDirection.includes('w')) {
      const diff = element.x - pointerX;
      newWidth = Math.max(20, element.width + diff);
      newX = element.x - (newWidth - element.width);
    }
    if (resizeDirection.includes('s')) newHeight = Math.max(20, pointerY - element.y);
    if (resizeDirection.includes('n')) {
      const diff = element.y - pointerY;
      newHeight = Math.max(20, element.height + diff);
      newY = element.y - (newHeight - element.height);
    }

    const updates: Partial<CanvasElement> = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };

    if (element.type === 'text' && ['nw', 'ne', 'sw', 'se'].includes(resizeDirection)) {
      const newSize = Math.max(newWidth, newHeight);
      const originalSize = (element as any).originalSize || Math.max(element.width, element.height);
      const originalFontSize = (element as any).originalFontSize || element.fontSize || 32;
      const scaleFactor = newSize / originalSize;
      updates.fontSize = Math.max(12, Math.round(originalFontSize * scaleFactor));
    }

    updateElement(selectedElementId, updates);
  };

  const applyRotateAtPoint = (clientX: number, clientY: number) => {
    if (!selectedElementId) return;
    const element = elements.find((el) => el.id === selectedElementId);
    if (!element || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pointerX = (clientX - rect.left) / canvasScale;
    const pointerY = (clientY - rect.top) / canvasScale;
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;

    const currentAngle = Math.atan2(pointerY - centerY, pointerX - centerX) * (180 / Math.PI);
    const angleDiff = currentAngle - rotationStart.mouseAngle;
    let newRotation = rotationStart.angle + angleDiff;

    // Snap rotation every 45 degrees with a small threshold
    const SNAP_ANGLE = 45;
    const SNAP_THRESHOLD_DEG = 4;
    const snapped = Math.round(newRotation / SNAP_ANGLE) * SNAP_ANGLE;
    if (Math.abs(snapped - newRotation) < SNAP_THRESHOLD_DEG) {
      newRotation = snapped;
    }

    updateElement(selectedElementId, {
      rotation: newRotation,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedElementId) {
      applyDragAtPoint(e.clientX, e.clientY);
    } else if (isResizing && selectedElementId) {
      applyResizeAtPoint(e.clientX, e.clientY);
    } else if (isRotating && selectedElementId) {
      applyRotateAtPoint(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setResizeDirection('');
    setGuides([]);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, direction: string) => {
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (element) {
      setSelectedElementId(elementId);
      setIsResizing(true);
      setResizeDirection(direction);
      if (element.type === 'text') {
        const originalSize = Math.max(element.width, element.height);
        (element as any).originalSize = originalSize;
        (element as any).originalFontSize = element.fontSize || 32;
      }
    }
  };

  const handleRotateMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    setIsRotating(true);
    const element = elements.find((el) => el.id === elementId);
    if (element) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left) / canvasScale;
        const mouseY = (e.clientY - rect.top) / canvasScale;
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
        setRotationStart({
          angle: element.rotation,
          mouseAngle: currentAngle,
        });
      }
    }
  };

  const handleResizeTouchStart = (e: React.TouchEvent, elementId: string, direction: string) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (element) {
      setSelectedElementId(elementId);
      setIsResizing(true);
      setResizeDirection(direction);
      if (element.type === 'text') {
        const originalSize = Math.max(element.width, element.height);
        (element as any).originalSize = originalSize;
        (element as any).originalFontSize = element.fontSize || 32;
      }
    }
  };

  const handleRotateTouchStart = (e: React.TouchEvent, elementId: string) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    setSelectedElementId(elementId);
    setIsRotating(true);
    const element = elements.find((el) => el.id === elementId);
    const touch = e.touches[0];
    if (element && canvasRef.current && touch) {
      const rect = canvasRef.current.getBoundingClientRect();
      const touchX = (touch.clientX - rect.left) / canvasScale;
      const touchY = (touch.clientY - rect.top) / canvasScale;
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      const currentAngle = Math.atan2(touchY - centerY, touchX - centerX) * (180 / Math.PI);
      setRotationStart({
        angle: element.rotation,
        mouseAngle: currentAngle,
      });
    }
  };

  // Touch handlers for pinch zoom
  type SimpleTouchList = {
    length: number;
    [index: number]: { clientX: number; clientY: number } | undefined;
  };

  const getTouchDistance = (touches: SimpleTouchList) => {
    const t1 = touches[0];
    const t2 = touches[1];
    if (!t1 || !t2) return 0;
  
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  // Element pinch-zoom state
  const pinchElementRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom only when an element is selected
      if (selectedElementId) {
        e.preventDefault();
        const distance = getTouchDistance(e.touches);
        setInitialPinchDistance(distance);
        setInitialScale(1);

        const element = elements.find(el => el.id === selectedElementId);
        if (element) {
          pinchElementRef.current = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            fontSize: element.fontSize,
          };
        } else {
          pinchElementRef.current = null;
        }
      }
      return;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Pinch zoom with two fingers: scale selected element only
    if (e.touches.length === 2 && initialPinchDistance !== null && selectedElementId && pinchElementRef.current) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const scale = (currentDistance / initialPinchDistance) * initialScale;

      const base = pinchElementRef.current;
      const MIN_SIZE = 40;
      const newWidth = Math.max(MIN_SIZE, base.width * scale);
      const newHeight = Math.max(MIN_SIZE, base.height * scale);

      const centerX = base.x + base.width / 2;
      const centerY = base.y + base.height / 2;
      const newX = centerX - newWidth / 2;
      const newY = centerY - newHeight / 2;

      const updates: Partial<CanvasElement> = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };

      if (base.fontSize) {
        const scaleFactor = newWidth / base.width;
        updates.fontSize = Math.max(12, Math.round(base.fontSize * scaleFactor));
      }

      updateElement(selectedElementId, updates);
      return;
    }

    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    // Single-finger interactions
    if (isDragging && selectedElementId) {
      e.preventDefault();
      applyDragAtPoint(touch.clientX, touch.clientY);
    } else if (isResizing && selectedElementId) {
      e.preventDefault();
      applyResizeAtPoint(touch.clientX, touch.clientY);
    } else if (isRotating && selectedElementId) {
      e.preventDefault();
      applyRotateAtPoint(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
      setResizeDirection('');
      pinchElementRef.current = null;
    }
    setInitialPinchDistance(null);
    setGuides([]);
  };

  const exportCanvas = async (format: 'png' | 'jpg' | 'pdf') => {
    const canvas = document.createElement('canvas');
    canvas.width = selectedRatio.width;
    canvas.height = selectedRatio.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    
    for (const element of sortedElements) {
      ctx.save();
      
      if (element.type === 'graphic' && element.src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
            ctx.rotate((element.rotation * Math.PI) / 180);
            ctx.drawImage(
              img,
              -element.width / 2,
              -element.height / 2,
              element.width,
              element.height
            );
            resolve();
          };
          img.onerror = () => resolve();
          img.src = element.src!;
        });
      } else if (element.type === 'text') {
        ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.fillStyle = element.fontColor || '#000000';
        ctx.font = `${element.fontStyle || ''} ${element.fontWeight === 'bold' ? 'bold ' : ''}${element.fontSize || 32}px ${element.fontFamily || 'sans-serif'}`;
        ctx.textAlign = element.textAlign || 'center';
        ctx.textBaseline = 'middle';
        
        const lineHeight = (element.fontSize || 32) * 1.2;
        const paragraphs = (element.content || '').split('\n');
        const lines: string[] = [];

        // Basic word wrapping
        for (const paragraph of paragraphs) {
          const words = paragraph.split(' ');
          let currentLine = '';

          for (let n = 0; n < words.length; n++) {
            const testLine = currentLine + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > element.width && n > 0) {
              lines.push(currentLine);
              currentLine = words[n] + ' ';
            } else {
              currentLine = testLine;
            }
          }
          lines.push(currentLine);
        }

        const totalTextHeight = lines.length * lineHeight;
        const startY = -totalTextHeight / 2 + lineHeight / 2;

        lines.forEach((line, index) => {
          ctx.fillText(line.trim(), 0, startY + (index * lineHeight));
        });
      }
      
      ctx.restore();
    }

    if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: selectedRatio.width > selectedRatio.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [selectedRatio.width, selectedRatio.height],
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, selectedRatio.width, selectedRatio.height);
      pdf.save('poster.pdf');
    } else {
      const link = document.createElement('a');
      link.download = `poster.${format}`;
      link.href = canvas.toDataURL(`image/${format}`, 1.0);
      link.click();
    }
    toast.success('다운로드가 완료되었습니다!');
  };

  // Render Helpers
  const renderSidebarItem = (panel: SidebarPanel, icon: React.ElementType, label: string) => (
    <button
      onClick={() => setActivePanel(activePanel === panel ? null : panel)}
      className={`group relative w-16 h-16 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 ${
        activePanel === panel
          ? 'bg-orange-50 text-[#ff6000]'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <div className={`p-2 rounded-lg transition-transform duration-200 ${activePanel === panel ? 'scale-110' : 'group-hover:scale-110'}`}>
        {React.createElement(icon, { size: 24, strokeWidth: 2 })}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
      {activePanel === panel && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#ff6000] rounded-r-full"
        />
      )}
    </button>
  );

  return (
    <div
    className="flex w-full bg-[#f8f9fa] overflow-hidden text-slate-900 overscroll-none"

      style={{ height: viewportHeight ?? '100vh' }}
    >
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-[80px] bg-white border-r border-gray-200 items-center py-6 gap-2 z-20 shadow-[2px_0_8px_rgba(0,0,0,0.02)] overflow-y-auto scrollbar-hide">
        <div className="mb-4">
          <div className="w-10 h-10 bg-[#ff6000] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <img src={pcLogo} alt="Logo" className="w-6 h-6 object-contain" />
          </div>
        </div>
        {renderSidebarItem('canvas', Layers, '판형')}
        {renderSidebarItem('graphics', ImageIcon, '그래픽')}
        {renderSidebarItem('text', Type, '텍스트')}
        <div className="flex-1" />
        {renderSidebarItem('export', Download, '내보내기')}
      </div>

      {/* Desktop Side Panel */}
      <AnimatePresence mode="wait">
        {activePanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden md:flex flex-col bg-white border-r border-gray-200 z-10 h-full overflow-hidden shadow-xl"
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-gray-900">
                {activePanel === 'canvas' && '판형 설정'}
                {activePanel === 'graphics' && '그래픽 라이브러리'}
                {activePanel === 'text' && '텍스트 추가'}
                {activePanel === 'export' && '내보내기'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)} className="h-8 w-8 rounded-full hover:bg-gray-100">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-6">
                {activePanel === 'canvas' && (
                  <>
                    <div className="space-y-4">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">캔버스 크기</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {CANVAS_RATIOS.map((ratio) => (
                          <button
                            key={ratio.id}
                            onClick={() => setSelectedRatio(ratio)}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                              selectedRatio.id === ratio.id
                                ? 'border-[#ff6000] bg-orange-50/50 ring-1 ring-[#ff6000]/20'
                                : 'border-gray-100 hover:border-gray-200 bg-white'
                            }`}
                          >
                            <div className={`p-2 rounded-lg mb-2 ${selectedRatio.id === ratio.id ? 'bg-[#ff6000] text-white' : 'bg-gray-100 text-gray-500'}`}>
                              <ratio.icon size={20} />
                            </div>
                            <span className={`text-sm font-medium ${selectedRatio.id === ratio.id ? 'text-[#ff6000]' : 'text-gray-700'}`}>{ratio.name}</span>
                            <span className="text-[10px] text-gray-400 mt-1">{ratio.width}x{ratio.height}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">배경 색상</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {['#ffffff', '#f8f9fa', '#e9ecef', '#ffe8cc', '#fff4e6', '#e6fcf5', '#e7f5ff', '#f3f0ff', '#fff0f6', '#212529'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setBackgroundColor(color)}
                            className={`w-full aspect-square rounded-full border-2 transition-all hover:scale-110 ${
                              backgroundColor === color ? 'border-[#ff6000] ring-2 ring-[#ff6000]/20' : 'border-transparent hover:border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          >
                             {backgroundColor === color && <Check className={`w-4 h-4 mx-auto ${['#ffffff', '#f8f9fa', '#e9ecef', '#ffe8cc', '#fff4e6', '#e6fcf5', '#e7f5ff', '#f3f0ff', '#fff0f6'].includes(color) ? 'text-black' : 'text-white'}`} />}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 rounded-full border border-gray-200 shadow-sm overflow-hidden relative">
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 font-mono uppercase">{backgroundColor}</span>
                      </div>
                    </div>
                  </>
                )}

                {activePanel === 'graphics' && (
                  <div className="grid grid-cols-2 gap-3">
                    {GRAPHICS.map((graphic) => (
                      <button
                        key={graphic.id}
                        onClick={() => addGraphic(graphic)}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-white hover:border-[#ff6000] hover:shadow-lg transition-all"
                      >
                        <div className="absolute inset-0 p-4 flex items-center justify-center">
                          <img
                            src={graphic.src}
                            alt={graphic.name}
                            className="w-full h-full object-contain transition-transform group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {activePanel === 'text' && (
                  <div className="flex flex-col space-y-6">
                    {/* Add Text Section */}
                    <div className="flex flex-col items-center justify-center py-4 text-center space-y-4 border-b border-gray-100 pb-6">
                      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-[#ff6000]">
                        <Type size={32} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-base">텍스트 추가</h3>
                        <p className="text-xs text-gray-500 max-w-[200px] mx-auto">
                          제목이나 본문을 추가하여 포스터를 완성하세요.
                        </p>
                      </div>
                      <Button onClick={addText} className="w-full h-10 text-sm shadow-md hover:shadow-lg transition-all" size="default">
                        텍스트 추가하기
                      </Button>
                    </div>

                    {/* Color Picker Section - Only if text is selected */}
                    {selectedElement && selectedElement.type === 'text' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-2">
                                <Palette size={16} className="text-[#ff6000]" />
                                <h3 className="font-bold text-sm text-gray-900">텍스트 색상</h3>
                            </div>

                            {/* MONO COLORS */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">MONO COLORS</Label>
                                <div className="grid grid-cols-6 gap-2">
                                {MONO_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => selectedElementId && updateElement(selectedElementId, { fontColor: color })}
                                        className={`w-full aspect-square rounded-full border transition-all hover:scale-110 ${elements.find(e => e.id === selectedElementId)?.fontColor === color ? 'border-[#ff6000] ring-2 ring-[#ff6000]/20' : 'border-gray-100'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                                </div>
                            </div>

                            {/* PRIMARY COLORS */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">PRIMARY COLORS</Label>
                                <div className="grid grid-cols-5 gap-2">
                                {PRIMARY_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => selectedElementId && updateElement(selectedElementId, { fontColor: color })}
                                        className={`w-full aspect-square rounded-full border transition-all hover:scale-110 ${elements.find(e => e.id === selectedElementId)?.fontColor === color ? 'border-[#ff6000] ring-2 ring-[#ff6000]/20' : 'border-gray-100'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="pt-4 border-t border-gray-100">
                                <Label className="mb-3 block text-xs font-semibold text-gray-500 uppercase tracking-wider">직접 선택</Label>
                                <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden relative shadow-sm shrink-0">
                                    <input 
                                        type="color" 
                                        value={selectedElementId ? elements.find(e => e.id === selectedElementId)?.fontColor : '#000000'}
                                        onChange={(e) => selectedElementId && updateElement(selectedElementId, { fontColor: e.target.value })}
                                        className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center border border-gray-200 rounded-lg px-3 h-9 bg-gray-50 focus-within:bg-white focus-within:border-[#ff6000] transition-colors">
                                        <span className="text-gray-500 mr-2 text-sm">#</span>
                                        <input 
                                            type="text"
                                            value={selectedElementId ? elements.find(e => e.id === selectedElementId)?.fontColor?.replace('#', '') : ''}
                                            onChange={(e) => selectedElementId && updateElement(selectedElementId, { fontColor: `#${e.target.value}` })}
                                            className="w-full bg-transparent outline-none font-mono text-sm uppercase"
                                            maxLength={6}
                                        />
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400 space-y-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Palette size={32} strokeWidth={1.5} className="opacity-50" />
                            <p className="text-xs">텍스트 요소를 선택하면<br/>색상 편집 옵션이 나타납니다.</p>
                        </div>
                    )}
                  </div>
                )}

                {activePanel === 'export' && (
                  <div className="space-y-3">
                    <Button onClick={() => exportCanvas('png')} variant="outline" className="w-full h-20 justify-start px-4 hover:border-[#ff6000] hover:bg-orange-50 group border-gray-200">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-white group-hover:text-[#ff6000] transition-colors">
                        <FileImage size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-900">PNG 저장</div>
                        <div className="text-xs text-gray-500">웹용 고화질 이미지</div>
                      </div>
                    </Button>
                    <Button onClick={() => exportCanvas('jpg')} variant="outline" className="w-full h-20 justify-start px-4 hover:border-[#ff6000] hover:bg-orange-50 group border-gray-200">
                      <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mr-4 group-hover:bg-white group-hover:text-[#ff6000] transition-colors">
                        <FileImage size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-900">JPG 저장</div>
                        <div className="text-xs text-gray-500">작은 파일 크기</div>
                      </div>
                    </Button>
                    <Button onClick={() => exportCanvas('pdf')} variant="outline" className="w-full h-20 justify-start px-4 hover:border-[#ff6000] hover:bg-orange-50 group border-gray-200">
                      <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-4 group-hover:bg-white group-hover:text-[#ff6000] transition-colors">
                        <FileText size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-900">PDF 저장</div>
                        <div className="text-xs text-gray-500">인쇄용 문서</div>
                      </div>
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas Area */}
      <div className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-300 ${activePanel ? 'mb-[260px] md:mb-0' : ''}`}>
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b z-30 shadow-sm relative">
          <div className="w-8" />
          <img src={mobileLogo} alt="Logo" className="h-6 object-contain" />
          <Button variant="ghost" size="icon" className="text-gray-900 hover:bg-gray-100" onClick={() => setShowMobileZoom(!showMobileZoom)}>
            {showMobileZoom ? <X size={20} /> : <ZoomIn size={20} />}
          </Button>

          <AnimatePresence>
            {showMobileZoom && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-16 right-4 bg-white rounded-lg shadow-xl border border-gray-100 p-4 flex flex-col gap-4 z-50 w-64 text-gray-900 origin-top-right"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">확대/축소</span>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{Math.round(canvasScale * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setCanvasScale(Math.max(0.1, canvasScale - 0.1))}>
                    <ZoomOut size={14} />
                  </Button>
                  <Slider
                    value={[canvasScale]}
                    min={0.01}
                    max={1}
                    step={0.01}
                    onValueChange={(val) => setCanvasScale(val[0])}
                    className="flex-1"
                  />
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setCanvasScale(Math.min(1, canvasScale + 0.1))}>
                    <ZoomIn size={14} />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Canvas Background & Container */}
        <div className="flex-1 relative bg-[#f0f2f5] overflow-hidden flex items-center justify-center md:items-center md:justify-center py-6 px-4 md:p-8 overscroll-none touch-none">
           {/* Background Pattern */}
           <div className="absolute inset-0 opacity-[0.03]" 
                style={{ 
                  backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
                  backgroundSize: '20px 20px' 
                }} 
           />
           
           {/* Canvas Wrapper */}
           <div
            className="relative shadow-2xl transition-all duration-300 ease-out"
            style={{
              width: selectedRatio.width * canvasScale,
              height: selectedRatio.height * canvasScale,
            }}
          >
            <div
              ref={canvasRef}
              className="relative w-full h-full bg-white overflow-hidden cursor-default select-none touch-none overscroll-none"
              style={{
                width: selectedRatio.width,
                height: selectedRatio.height,
                transform: `scale(${canvasScale})`,
                transformOrigin: 'top left',
                backgroundColor: backgroundColor,
                touchAction: 'none',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => { setSelectedElementId(null); setIsEditingText(false); }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {elements
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((element) => (
                  <div
                    key={element.id}
                    className={`absolute group ${selectedElementId === element.id ? 'z-50' : ''}`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      transform: `rotate(${element.rotation}deg)`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                    onTouchStart={(e) => handleElementTouchStart(e, element.id)}
                    onClick={(e) => { 
                      e.stopPropagation();
                      if (selectedElementId !== element.id) {
                        setSelectedElementId(element.id);
                        setIsEditingText(false);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (element.type === 'text') {
                        setIsEditingText(true);
                      }
                    }}
                  >
                    {/* Content */}
                    <div className="w-full h-full relative">
                       {element.type === 'graphic' ? (
                        <img
                          src={element.src}
                          alt="graphic"
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                        />
                      ) : (
                        isEditingText && selectedElementId === element.id ? (
                          <textarea
                            ref={textInputRef}
                            value={element.content || ''}
                            onChange={(e) => updateElement(element.id, { content: e.target.value })}
                            onBlur={() => setIsEditingText(false)}
                            className="w-full h-full outline-none bg-transparent resize-none overflow-hidden"
                            style={{
                              fontSize: element.fontSize,
                              color: element.fontColor,
                              fontWeight: element.fontWeight,
                              fontStyle: element.fontStyle,
                              textDecoration: element.textDecoration,
                              textAlign: element.textAlign,
                              fontFamily: element.fontFamily,
                              lineHeight: 1.2,
                              padding: 0,
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center whitespace-pre-wrap"
                            style={{
                              fontSize: element.fontSize,
                              color: element.fontColor,
                              fontWeight: element.fontWeight,
                              fontStyle: element.fontStyle,
                              textDecoration: element.textDecoration,
                              textAlign: element.textAlign,
                              fontFamily: element.fontFamily,
                              lineHeight: 1.2
                            }}
                          >
                            {element.content}
                          </div>
                        )
                      )}
                    </div>

                    {/* Selection Overlay */}
                    {selectedElementId === element.id && !isEditingText && (
                      <>
                        <div className="absolute inset-0 border-2 border-[#ff6000] pointer-events-none" />
                        {/* Resize Handles */}
                        {(element.type === 'text' ? ['nw', 'ne', 'sw', 'se', 'w', 'e'] : ['nw', 'ne', 'sw', 'se']).map((dir) => (
                          <div
                            key={dir}
                            className={`absolute bg-white border-2 border-[#ff6000] z-10 
                              ${['nw', 'ne', 'sw', 'se'].includes(dir) ? 'w-3 h-3 rounded-full' : 'w-1.5 h-6 rounded-full top-1/2 -translate-y-1/2'}
                              ${dir === 'nw' ? '-top-1.5 -left-1.5 cursor-nwse-resize' : ''}
                              ${dir === 'ne' ? '-top-1.5 -right-1.5 cursor-nesw-resize' : ''}
                              ${dir === 'sw' ? '-bottom-1.5 -left-1.5 cursor-nesw-resize' : ''}
                              ${dir === 'se' ? '-bottom-1.5 -right-1.5 cursor-nwse-resize' : ''}
                              ${dir === 'w' ? '-left-1.5 cursor-ew-resize' : ''}
                              ${dir === 'e' ? '-right-1.5 cursor-ew-resize' : ''}
                            `}
                            onMouseDown={(e) => handleResizeMouseDown(e, element.id, dir)}
                            onTouchStart={(e) => handleResizeTouchStart(e, element.id, dir)}
                          />
                        ))}
                        {/* Rotation Handle */}
                        <div
                          className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-md cursor-grab active:cursor-grabbing hover:bg-orange-50"
                          onMouseDown={(e) => handleRotateMouseDown(e, element.id)}
                          onTouchStart={(e) => handleRotateTouchStart(e, element.id)}
                        >
                          <RotateCw size={14} className="text-[#ff6000]" />
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {/* Smart Guides */}
                {guides.map((guide, i) => (
                   <div
                      key={i}
                      className={`absolute bg-[#ff6000] z-50 pointer-events-none ${guide.type === 'horizontal' ? 'h-[1px] w-full left-0' : 'w-[1px] h-full top-0'}`}
                      style={{
                         [guide.type === 'horizontal' ? 'top' : 'left']: guide.position
                      }}
                   />
                ))}
            </div>
          </div>
        </div>

        {/* Floating Context Toolbar */}
        <AnimatePresence>
          {selectedElementId && !isEditingText && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-2 flex items-center gap-2 z-40 max-w-[95vw] overflow-x-auto scrollbar-hide"
            >
              {/* Mobile Toolbar */}
              <div className="flex md:hidden items-center gap-2 px-1">
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100" onClick={() => duplicateElement(selectedElementId)}>
                   <Copy size={18} />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteElement(selectedElementId)}>
                   <Trash2 size={18} />
                 </Button>
                 <Separator orientation="vertical" className="h-5 mx-1" />
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100" onClick={() => setActivePanel('text')}>
                   <MoreHorizontal size={18} />
                 </Button>
              </div>

              <div className="hidden md:flex items-center gap-2">
              {selectedElement && selectedElement.type === 'text' ? (
                <>
                   {/* Font Family */}
                   <Popover>
                      <PopoverTrigger asChild>
                         <Button variant="ghost" className="h-9 px-3 text-sm font-medium border border-gray-200 rounded-lg min-w-[120px] justify-between hover:bg-gray-50 bg-white">
                            <span className="truncate max-w-[90px]">{selectedElement.fontFamily || 'Pretendard'}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1" align="start">
                         {FONTS.map(font => (
                            <button
                               key={font.value}
                               onClick={() => updateElement(selectedElementId, { fontFamily: font.value })}
                               className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 flex items-center justify-between ${selectedElement.fontFamily === font.value ? 'text-[#ff6000] bg-orange-50' : 'text-gray-700'}`}
                               style={{ fontFamily: font.value }}
                            >
                               {font.name}
                               {selectedElement.fontFamily === font.value && <Check size={14} />}
                            </button>
                         ))}
                      </PopoverContent>
                   </Popover>

                   {/* Font Size */}
                   <div className="flex items-center border border-gray-200 rounded-lg h-9 bg-white overflow-hidden">
                      <button 
                        onClick={() => updateElement(selectedElementId, { fontSize: Math.max(1, (selectedElement.fontSize || 32) - 2) })} 
                        className="px-3 h-full hover:bg-gray-50 border-r border-gray-100 text-gray-600"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        value={selectedElement.fontSize} 
                        onChange={(e) => updateElement(selectedElementId, { fontSize: Math.max(1, Number(e.target.value)) })} 
                        className="w-12 text-center text-sm font-medium h-full outline-none"
                      />
                      <button 
                        onClick={() => updateElement(selectedElementId, { fontSize: (selectedElement.fontSize || 32) + 2 })} 
                        className="px-3 h-full hover:bg-gray-50 border-l border-gray-100 text-gray-600"
                      >
                        +
                      </button>
                   </div>
                   
                   <Separator orientation="vertical" className="h-6" />

                   {/* Color */}
                   <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setActivePanel('text')}
                      className="relative h-9 w-9 rounded-lg hover:bg-gray-100"
                   >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                         <span className="font-bold text-sm leading-none">A</span>
                         <div className="h-1 w-5 rounded-full" style={{ backgroundColor: selectedElement.fontColor }} />
                      </div>
                   </Button>

                   {/* Styles */}
                   <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-md ${selectedElement.fontWeight === 'bold' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                        onClick={() => updateElement(selectedElementId, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                      >
                        <Bold size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-md ${selectedElement.fontStyle === 'italic' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                        onClick={() => updateElement(selectedElementId, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                      >
                        <Italic size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-md ${selectedElement.textDecoration === 'underline' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                        onClick={() => updateElement(selectedElementId, { textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })}
                      >
                        <Underline size={16} />
                      </Button>
                   </div>
                   
                   {/* Alignment */}
                   <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-md ${selectedElement.textAlign === 'left' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                        onClick={() => updateElement(selectedElementId, { textAlign: 'left' })}
                      >
                        <AlignLeft size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-md ${selectedElement.textAlign === 'center' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                        onClick={() => updateElement(selectedElementId, { textAlign: 'center' })}
                      >
                        <AlignCenter size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-md ${selectedElement.textAlign === 'right' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                        onClick={() => updateElement(selectedElementId, { textAlign: 'right' })}
                      >
                        <AlignRight size={16} />
                      </Button>
                   </div>
                   
                   <Separator orientation="vertical" className="h-6" />
                </>
              ) : null}
              
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100" onClick={() => duplicateElement(selectedElementId)}>
                <Copy size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100" onClick={() => {
                 const el = elements.find(e => e.id === selectedElementId);
                 if (el) {
                   const containerWidth = canvasRef.current?.clientWidth || 1000;
                   const containerHeight = canvasRef.current?.clientHeight || 1000;
                   updateElement(selectedElementId, { x: containerWidth/2 - el.width/2, y: containerHeight/2 - el.height/2 });
                 }
              }}>
                <Move size={16} />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteElement(selectedElementId)}>
                <Trash2 size={16} />
              </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Zoom Controls */}
        <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-100 p-1 items-center gap-2 z-20">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCanvasScale(Math.max(0.1, canvasScale - 0.1))}>
            <ZoomOut size={16} />
          </Button>
          <span className="text-xs font-medium w-12 text-center text-gray-600">{Math.round(canvasScale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCanvasScale(Math.min(2, canvasScale + 0.1))}>
            <ZoomIn size={16} />
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-6">
        <div className="grid grid-cols-4 h-16">
          <button onClick={() => setActivePanel('canvas')} className={`flex flex-col items-center justify-center gap-1 w-full h-full ${activePanel === 'canvas' ? 'text-[#ff6000]' : 'text-gray-400'}`}>
            <Layers size={20} />
            <span className="text-[10px]">판형</span>
          </button>
          <button onClick={() => setActivePanel('graphics')} className={`flex flex-col items-center justify-center gap-1 w-full h-full ${activePanel === 'graphics' ? 'text-[#ff6000]' : 'text-gray-400'}`}>
            <ImageIcon size={20} />
            <span className="text-[10px]">그래픽</span>
          </button>
          <button onClick={() => setActivePanel('text')} className={`flex flex-col items-center justify-center gap-1 w-full h-full ${activePanel === 'text' ? 'text-[#ff6000]' : 'text-gray-400'}`}>
            <Type size={20} />
            <span className="text-[10px]">텍스트</span>
          </button>
          <button onClick={() => setActivePanel('export')} className={`flex flex-col items-center justify-center gap-1 w-full h-full ${activePanel === 'export' ? 'text-[#ff6000]' : 'text-gray-400'}`}>
            <Download size={20} />
            <span className="text-[10px]">저장</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sheet/Panel */}
      <AnimatePresence>
        {activePanel && window.innerWidth < 768 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setActivePanel(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl max-h-[70vh] flex flex-col md:hidden pb-6 shadow-[0_-4px_32px_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-gray-900">
                  {activePanel === 'canvas' && '판형 선택'}
                  {activePanel === 'graphics' && '그래픽 추가'}
                  {activePanel === 'text' && '텍스트 편집'}
                  {activePanel === 'export' && '내보내기'}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setActivePanel(null)}>
                  <X size={20} />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                 {/* Re-use the same content logic as desktop, but styled for mobile if needed */}
                 {activePanel === 'canvas' && (
                    <div className="grid grid-cols-2 gap-3">
                      {CANVAS_RATIOS.map((ratio) => (
                        <button
                          key={ratio.id}
                          onClick={() => { setSelectedRatio(ratio); setActivePanel(null); }}
                          className={`flex flex-col items-center p-4 rounded-xl border ${selectedRatio.id === ratio.id ? 'border-[#ff6000] bg-orange-50' : 'border-gray-200'}`}
                        >
                          <ratio.icon className="mb-2" />
                          <span className="text-sm font-medium">{ratio.name}</span>
                        </button>
                      ))}
                      <div className="col-span-2 mt-4">
                        <Label>배경 색상</Label>
                        <div className="flex flex-col gap-2 py-2">
                           <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                             {MONO_COLORS.map(color => (
                               <button
                                 key={color}
                                 onClick={() => setBackgroundColor(color)}
                                 className="w-10 h-10 rounded-full border border-gray-200 flex-shrink-0"
                                 style={{ backgroundColor: color }}
                               />
                             ))}
                           </div>
                           <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                             {PRIMARY_COLORS.map(color => (
                               <button
                                 key={color}
                                 onClick={() => setBackgroundColor(color)}
                                 className="w-10 h-10 rounded-full border border-gray-200 flex-shrink-0"
                                 style={{ backgroundColor: color }}
                               />
                             ))}
                           </div>
                        </div>
                      </div>
                    </div>
                 )}
                 {activePanel === 'graphics' && (
                    <div className="grid grid-cols-3 gap-3">
                       {GRAPHICS.map((g) => (
                         <button key={g.id} onClick={() => addGraphic(g)} className="aspect-square bg-gray-50 rounded-lg p-2">
                           <img src={g.src} className="w-full h-full object-contain" />
                         </button>
                       ))}
                    </div>
                 )}
                 {activePanel === 'text' && (
                    <div className="flex flex-col space-y-6">
                      {selectedElementId && elements.find(e => e.id === selectedElementId)?.type === 'text' ? (
                        <div className="space-y-4">
                           {/* Font Family */}
                           <div>
                              <Label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Font</Label>
                              <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                                 {FONTS.map(font => (
                                    <button
                                       key={font.value}
                                       onClick={() => updateElement(selectedElementId, { fontFamily: font.value })}
                                       className={`px-4 py-2 text-sm border rounded-lg whitespace-nowrap ${elements.find(e => e.id === selectedElementId)?.fontFamily === font.value ? 'bg-orange-50 border-[#ff6000] text-[#ff6000]' : 'border-gray-200'}`}
                                       style={{ fontFamily: font.value }}
                                    >
                                       {font.name}
                                    </button>
                                 ))}
                              </div>
                           </div>
                           
                           {/* Color */}
                           <div>
                              <Label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</Label>
                              <div className="flex flex-col gap-2 pb-2">
                                <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                                   {MONO_COLORS.map(color => (
                                      <button
                                         key={color}
                                         onClick={() => updateElement(selectedElementId, { fontColor: color })}
                                         className={`w-10 h-10 rounded-full border border-gray-200 flex-shrink-0 ${elements.find(e => e.id === selectedElementId)?.fontColor === color ? 'ring-2 ring-[#ff6000] ring-offset-2' : ''}`}
                                         style={{ backgroundColor: color }}
                                      />
                                   ))}
                                </div>
                                <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                                   {PRIMARY_COLORS.map(color => (
                                      <button
                                         key={color}
                                         onClick={() => updateElement(selectedElementId, { fontColor: color })}
                                         className={`w-10 h-10 rounded-full border border-gray-200 flex-shrink-0 ${elements.find(e => e.id === selectedElementId)?.fontColor === color ? 'ring-2 ring-[#ff6000] ring-offset-2' : ''}`}
                                         style={{ backgroundColor: color }}
                                      />
                                   ))}
                                </div>
                              </div>
                           </div>

                           {/* Size & Style */}
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <Label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</Label>
                                 <div className="flex items-center border border-gray-200 rounded-lg h-10">
                                    <button 
                                      onClick={() => updateElement(selectedElementId, { fontSize: Math.max(1, (elements.find(e => e.id === selectedElementId)?.fontSize || 32) - 2) })} 
                                      className="px-3 h-full hover:bg-gray-50 border-r border-gray-100 text-gray-600"
                                    >-</button>
                                    <span className="flex-1 text-center text-sm font-medium">
                                       {elements.find(e => e.id === selectedElementId)?.fontSize || 32}
                                    </span>
                                    <button 
                                      onClick={() => updateElement(selectedElementId, { fontSize: (elements.find(e => e.id === selectedElementId)?.fontSize || 32) + 2 })} 
                                      className="px-3 h-full hover:bg-gray-50 border-l border-gray-100 text-gray-600"
                                    >+</button>
                                 </div>
                              </div>
                              <div>
                                 <Label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Style</Label>
                                 <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 h-10">
                                    <button 
                                      onClick={() => updateElement(selectedElementId, { fontWeight: elements.find(e => e.id === selectedElementId)?.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                      className={`flex-1 h-full rounded flex items-center justify-center ${elements.find(e => e.id === selectedElementId)?.fontWeight === 'bold' ? 'bg-gray-100' : ''}`}
                                    ><Bold size={16} /></button>
                                    <button 
                                      onClick={() => updateElement(selectedElementId, { fontStyle: elements.find(e => e.id === selectedElementId)?.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                      className={`flex-1 h-full rounded flex items-center justify-center ${elements.find(e => e.id === selectedElementId)?.fontStyle === 'italic' ? 'bg-gray-100' : ''}`}
                                    ><Italic size={16} /></button>
                                    <button 
                                      onClick={() => updateElement(selectedElementId, { textDecoration: elements.find(e => e.id === selectedElementId)?.textDecoration === 'underline' ? 'none' : 'underline' })}
                                      className={`flex-1 h-full rounded flex items-center justify-center ${elements.find(e => e.id === selectedElementId)?.textDecoration === 'underline' ? 'bg-gray-100' : ''}`}
                                    ><Underline size={16} /></button>
                                 </div>
                              </div>
                           </div>
                           
                           <Button onClick={() => { addText(); setActivePanel(null); }} variant="outline" className="w-full mt-4">
                              새 텍스트 추가
                           </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                           <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-[#ff6000]">
                             <Type size={32} />
                           </div>
                           <div className="space-y-2">
                             <h3 className="font-semibold text-lg">텍스트 추가</h3>
                             <p className="text-sm text-gray-500">
                               제목이나 본문을 추가하여 포스터를 완성하세요.
                             </p>
                           </div>
                           <Button onClick={() => { addText(); setActivePanel(null); }} className="w-full h-12 text-base shadow-lg" size="lg">
                             텍스트 추가하기
                           </Button>
                        </div>
                      )}
                    </div>
                 )}
                 {activePanel === 'export' && (
                   <div className="space-y-3">
                     <Button onClick={() => exportCanvas('png')} className="w-full" variant="outline">PNG 저장</Button>
                     <Button onClick={() => exportCanvas('jpg')} className="w-full" variant="outline">JPG 저장</Button>
                     <Button onClick={() => exportCanvas('pdf')} className="w-full" variant="outline">PDF 저장</Button>
                   </div>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

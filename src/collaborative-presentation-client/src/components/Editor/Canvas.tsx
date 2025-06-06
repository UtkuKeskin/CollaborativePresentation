import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { useCanvas } from '../../hooks/useCanvas';
import { SlideDto, ElementDto, ElementType } from '../../types';
import TextElement from './Elements/TextElement';

interface CanvasProps {
  slide: SlideDto;
  isEditable?: boolean; // Add this to control edit permissions
}

const Canvas: React.FC<CanvasProps> = ({ slide, isEditable = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 1024, height: 576 });
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { addElement, updateElement, deleteElement } = useCanvas();

  // Calculate responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // 16:9 aspect ratio
      const targetRatio = 16 / 9;
      const containerRatio = containerWidth / containerHeight;

      let newWidth, newHeight, newScale;

      if (containerRatio > targetRatio) {
        // Container is wider than target ratio
        newHeight = containerHeight;
        newWidth = newHeight * targetRatio;
        newScale = newHeight / 576; // Base height is 576
      } else {
        // Container is taller than target ratio
        newWidth = containerWidth;
        newHeight = newWidth / targetRatio;
        newScale = newWidth / 1024; // Base width is 1024
      }

      setDimensions({ width: newWidth, height: newHeight });
      setScale(newScale);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Handle double click to add text
  const handleStageDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only add elements if editable
    if (!isEditable) return;

    // Get click position relative to stage
    const stage = e.target.getStage();
    if (!stage) return;

    // Check if clicked on background or stage
    const clickedOnEmpty = e.target === stage || 
                          (e.target.attrs && e.target.attrs.id === 'background');
    
    if (clickedOnEmpty) {
      setSelectedId(null); // Deselect any selected element

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Convert to relative coordinates (0-1024, 0-576)
      const x = pointerPosition.x / scale;
      const y = pointerPosition.y / scale;

      // Add new text element
      const newElement: Partial<ElementDto> = {
        type: ElementType.Text,
        content: 'Double click to edit',
        positionX: x - 100, // Center the element on click position
        positionY: y - 25,
        width: 200,
        height: 50,
        zIndex: slide.elements.length,
      };

      addElement(slide.id, newElement);
    }
  }, [isEditable, scale, slide.id, slide.elements.length, addElement]);

  // Handle element selection
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Handle element update
  const handleElementChange = useCallback((id: string, attrs: Partial<ElementDto>) => {
    updateElement(slide.id, id, attrs);
  }, [slide.id, updateElement]);

  // Handle element deletion
  const handleElementDelete = useCallback((id: string) => {
    deleteElement(slide.id, id);
    setSelectedId(null);
  }, [slide.id, deleteElement]);

  // Handle click on stage
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Deselect when clicking on empty area
    const clickedOnEmpty = e.target === e.target.getStage() || 
                          (e.target.className === 'Rect' && e.target.attrs.id === 'background');
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && isEditable) {
        const element = slide.elements.find(el => el.id === selectedId);
        if (element) {
          handleElementDelete(selectedId);
        }
      }

      // Deselect on Escape
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, isEditable, slide.elements, handleElementDelete]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-100"
    >
      <div 
        className="bg-white shadow-2xl rounded-lg overflow-hidden"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          scaleX={scale}
          scaleY={scale}
          onDblClick={handleStageDoubleClick}
          onClick={handleStageClick}
        >
          <Layer>
            {/* Background */}
            <Rect
              id="background"
              x={0}
              y={0}
              width={1024}
              height={576}
              fill={slide.backgroundColor || '#FFFFFF'}
            />

            {/* Render elements */}
            {[...slide.elements]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((element) => {
                switch (element.type) {
                  case ElementType.Text:
                    return (
                      <TextElement
                        key={element.id}
                        element={element}
                        isSelected={selectedId === element.id}
                        onSelect={() => handleSelect(element.id)}
                        onChange={(attrs) => handleElementChange(element.id, attrs)}
                        onDelete={() => handleElementDelete(element.id)}
                        scale={scale}
                      />
                    );
                  // TODO: Add other element types here
                  case ElementType.Shape:
                  case ElementType.Image:
                  case ElementType.Line:
                  case ElementType.Arrow:
                    return null; // Placeholder for future element types
                  default:
                    return null;
                }
              })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default Canvas;
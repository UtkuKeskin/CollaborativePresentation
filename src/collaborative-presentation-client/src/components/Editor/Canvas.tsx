import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { useCanvas } from '../../hooks/useCanvas';
import { SlideDto, ElementDto, ElementType, UserRole } from '../../types';
import TextElement from './Elements/TextElement';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface CanvasProps {
  slide: SlideDto;
  isEditable?: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ slide, isEditable = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 1024, height: 576 });
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { addElement, updateElement, deleteElement } = useCanvas();
  
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const canEdit = currentUser?.role === UserRole.Creator || currentUser?.role === UserRole.Editor;

  const slideElementsLength = slide.elements?.length || 0;

  useEffect(() => {
    console.log('🖼️ Canvas received new slide data:', {
      slideId: slide.id,
      elementCount: slideElementsLength,
      elements: slide.elements
    });
  }, [slide.id, slideElementsLength, slide.elements]);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const targetRatio = 16 / 9;
      const containerRatio = containerWidth / containerHeight;

      let newWidth, newHeight, newScale;

      if (containerRatio > targetRatio) {
        newHeight = containerHeight;
        newWidth = newHeight * targetRatio;
        newScale = newHeight / 576;
      } else {
        newWidth = containerWidth;
        newHeight = newWidth / targetRatio;
        newScale = newWidth / 1024;
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

  const handleStageDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isEditable || !canEdit) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const clickedOnEmpty = e.target === stage || 
                          (e.target.attrs && e.target.attrs.id === 'background');
    
    if (clickedOnEmpty) {
      setSelectedId(null);

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      const x = pointerPosition.x / scale;
      const y = pointerPosition.y / scale;

      const newElement: Partial<ElementDto> = {
        type: ElementType.Text,
        content: '**Double click** to edit',
        positionX: x - 100,
        positionY: y - 40,
        width: 200,
        height: 80,
        zIndex: slide.elements.length,
      };

      addElement(slide.id, newElement);
    }
  }, [isEditable, canEdit, scale, slide.id, slide.elements.length, addElement]);

  const handleSelect = useCallback((id: string) => {
    if (canEdit) {
      setSelectedId(id);
    }
  }, [canEdit]);

  const handleElementChange = useCallback((id: string, attrs: Partial<ElementDto>) => {
    if (!canEdit) return;
    updateElement(slide.id, id, attrs);
  }, [slide.id, updateElement, canEdit]);

  const handleElementDelete = useCallback((id: string) => {
    if (!canEdit) return;
    deleteElement(slide.id, id);
    setSelectedId(null);
  }, [slide.id, deleteElement, canEdit]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || 
                          (e.target.className === 'Rect' && e.target.attrs.id === 'background');
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && isEditable && canEdit) {
        const element = slide.elements.find(el => el.id === selectedId);
        if (element) {
          handleElementDelete(selectedId);
        }
      }

      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, isEditable, canEdit, slide.elements, handleElementDelete]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-100"
    >
      <div 
        className="bg-white shadow-2xl rounded-lg overflow-hidden relative"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {/* Viewer info message */}
        {!canEdit && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-gray-800 bg-opacity-75 text-white px-4 py-2 rounded-md text-sm">
            View Only Mode
          </div>
        )}
        
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
                        isEditable={canEdit}
                      />
                    );
                  case ElementType.Shape:
                  case ElementType.Image:
                  case ElementType.Line:
                  case ElementType.Arrow:
                    return null;
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
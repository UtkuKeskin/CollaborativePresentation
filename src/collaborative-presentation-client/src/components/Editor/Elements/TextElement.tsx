import React, { useState, useRef, useEffect } from 'react';
import { Text, Transformer, Group, Rect } from 'react-konva';
import Konva from 'konva';
import { ElementDto } from '../../../types';

interface TextElementProps {
  element: ElementDto;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<ElementDto>) => void;
  onDelete: () => void;
  scale: number;
}

const TextElement: React.FC<TextElementProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  scale,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(element.content);
  const textRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  useEffect(() => {
    setText(element.content);
  }, [element.content]);

  const handleDblClick = () => {
    setIsEditing(true);
    const textNode = textRef.current;
    const groupNode = groupRef.current;
    if (!textNode || !groupNode) return;

    // Hide the text element
    textNode.hide();

    // Create textarea for editing
    const stage = textNode.getStage();
    if (!stage) return;

    const stageContainer = stage.container();
    
    // Get the absolute position considering the stage scale and position
    const textPosition = textNode.getAbsolutePosition();
    
    // Get stage's transform
    const transform = stage.getAbsoluteTransform().copy();
    
    // Apply transform to get the correct position
    transform.invert();
    const position = transform.point(textPosition);
    
    // Get stage container's bounding rect
    const stageBox = stageContainer.getBoundingClientRect();
    
    // Calculate the actual position on screen
    const areaPosition = {
      x: position.x * scale + stageBox.left,
      y: position.y * scale + stageBox.top
    };

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea); // Append to body instead of stage container

    // Set initial value
    textarea.value = text;
    
    // Style the textarea to match the text element exactly
    textarea.style.position = 'fixed'; // Use fixed positioning
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${element.width * scale}px`;
    textarea.style.height = `${element.height * scale}px`;
    textarea.style.fontSize = `${16 * scale}px`;
    textarea.style.border = '2px solid #4299e1';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '4px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'rgba(255, 255, 255, 0.95)';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = '1.5';
    textarea.style.fontFamily = 'Arial, sans-serif';
    textarea.style.color = 'black';
    textarea.style.boxSizing = 'border-box';
    textarea.style.zIndex = '10000';
    textarea.style.transformOrigin = 'left top';

    // Select all text when focused
    textarea.focus();
    textarea.select();

    const removeTextarea = () => {
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
      setIsEditing(false);
      textNode.show();
      stage.batchDraw();
    };

    let isRemoving = false;

    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isRemoving) {
          isRemoving = true;
          const newText = textarea.value.trim();
          if (newText !== text && newText) {
            setText(newText);
            onChange({ content: newText });
          }
          removeTextarea();
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isRemoving) {
          isRemoving = true;
          removeTextarea();
        }
      }
    });

    // Handle clicks outside the textarea
    const handleClickOutside = (e: MouseEvent) => {
      if (!textarea.contains(e.target as Node)) {
        if (!isRemoving) {
          isRemoving = true;
          const newText = textarea.value.trim();
          if (newText !== text && newText) {
            setText(newText);
            onChange({ content: newText });
          }
          removeTextarea();
          document.removeEventListener('mousedown', handleClickOutside);
        }
      }
    };

    // Add slight delay to prevent immediate trigger
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    // Clean up on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
    };
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onChange({
      positionX: node.x(),
      positionY: node.y(),
    });
  };

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and adjust size
    node.scaleX(1);
    node.scaleY(1);

    onChange({
      positionX: node.x(),
      positionY: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
    });
  };

  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && (e.key === 'Delete' || e.key === 'Backspace') && !isEditing) {
        e.preventDefault();
        onDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelected, isEditing, onDelete]);

  return (
    <>
      <Group
        ref={groupRef}
        x={element.positionX}
        y={element.positionY}
        width={element.width}
        height={element.height}
        draggable
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
      >
        {/* Background for better selection */}
        <Rect
          width={element.width}
          height={element.height}
          fill="transparent"
        />
        <Text
          ref={textRef}
          text={text}
          fontSize={16}
          fontFamily="Arial"
          fill="black"
          width={element.width}
          height={element.height}
          align="left"
          verticalAlign="middle"
          wrap="word"
        />
      </Group>
      {isSelected && !isEditing && (
        <Transformer
          ref={transformerRef}
          enabledAnchors={[
            'top-left',
            'top-center',
            'top-right',
            'middle-right',
            'middle-left',
            'bottom-left',
            'bottom-center',
            'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default TextElement;
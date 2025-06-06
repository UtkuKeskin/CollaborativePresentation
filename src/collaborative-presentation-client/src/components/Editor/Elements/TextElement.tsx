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

    textNode.hide();

    const stage = textNode.getStage();
    if (!stage) return;

    const stageContainer = stage.container();
    
    const textPosition = textNode.getAbsolutePosition();
    
    const transform = stage.getAbsoluteTransform().copy();
    
    transform.invert();
    const position = transform.point(textPosition);
    
    const stageBox = stageContainer.getBoundingClientRect();
    
    const areaPosition = {
      x: position.x * scale + stageBox.left,
      y: position.y * scale + stageBox.top
    };

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = text;
    
    textarea.style.position = 'fixed';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${element.width * scale}px`;
    textarea.style.height = `${element.height * scale}px`;
    textarea.style.fontSize = `${16 * scale}px`;
    textarea.style.border = '2px solid #4299e1';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '8px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'auto';
    textarea.style.background = 'rgba(255, 255, 255, 0.95)';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = '1.5';
    textarea.style.fontFamily = 'monospace';
    textarea.style.color = 'black';
    textarea.style.boxSizing = 'border-box';
    textarea.style.zIndex = '10000';
    textarea.style.transformOrigin = 'left top';

    textarea.placeholder = 'Type your text here. Supports markdown:\n**bold**, *italic*, # heading, - list, etc.';

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
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
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

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

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

    node.scaleX(1);
    node.scaleY(1);

    onChange({
      positionX: node.x(),
      positionY: node.y(),
      width: Math.max(50, node.width() * scaleX),
      height: Math.max(30, node.height() * scaleY),
    });
  };

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

  const parseMarkdown = (markdown: string): { text: string; fontStyle?: string; fontWeight?: string; fontSize?: number } => {
    let processedText = markdown;
    let fontWeight = 'normal';
    let fontStyle = 'normal';
    let fontSize = 16;

    if (processedText.startsWith('# ')) {
      processedText = processedText.substring(2);
      fontSize = 24;
      fontWeight = 'bold';
    } else if (processedText.startsWith('## ')) {
      processedText = processedText.substring(3);
      fontSize = 20;
      fontWeight = 'bold';
    } else if (processedText.startsWith('### ')) {
      processedText = processedText.substring(4);
      fontSize = 18;
      fontWeight = 'bold';
    }

    if (processedText.includes('**')) {
      processedText = processedText.replace(/\*\*([^*]+)\*\*/g, '$1');
      fontWeight = 'bold';
    }

    if (processedText.includes('*') || processedText.includes('_')) {
      processedText = processedText.replace(/\*([^*]+)\*/g, '$1').replace(/_([^_]+)_/g, '$1');
      fontStyle = 'italic';
    }

    processedText = processedText
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[-*+]\s+/gm, '• ')
      .replace(/^\d+\.\s+/gm, '');

    return { text: processedText, fontStyle, fontWeight, fontSize };
  };

  const parsedText = parseMarkdown(text);

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
          fill={isSelected ? 'rgba(66, 153, 225, 0.1)' : 'transparent'}
          stroke={isSelected ? '#4299e1' : 'transparent'}
          strokeWidth={1}
          dash={isSelected ? [5, 5] : []}
        />
        
        <Text
          ref={textRef}
          text={parsedText.text}
          fontSize={parsedText.fontSize}
          fontFamily="Arial"
          fontStyle={parsedText.fontStyle}
          fontWeight={parsedText.fontWeight}
          fill="black"
          width={element.width}
          height={element.height}
          padding={8}
          align="left"
          verticalAlign="top"
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
            if (newBox.width < 50 || newBox.height < 30) {
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
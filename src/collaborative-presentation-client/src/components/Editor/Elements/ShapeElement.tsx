import React, { useRef, useEffect } from 'react';
import { Circle, Rect, Arrow, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import { ElementDto, ElementType } from '../../../types';

interface ShapeElementProps {
  element: ElementDto;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<ElementDto>) => void;
  onDelete: () => void;
  scale: number;
  isEditable?: boolean;
}

const ShapeElement: React.FC<ShapeElementProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  scale,
  isEditable = true,
}) => {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const groupRef = useRef<Konva.Group>(null);

  // Parse properties for color and other attributes
  const properties = element.properties ? JSON.parse(element.properties) : {};
  const fill = properties.fill || '#4299e1';
  const stroke = properties.stroke || '#2563eb';
  const strokeWidth = properties.strokeWidth || 2;

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

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
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
    });
  };

  const renderShape = () => {
    switch (element.type) {
      case ElementType.Shape:
        // Default to rectangle if no specific shape is defined
        const shapeType = properties.shapeType || 'rectangle';
        
        if (shapeType === 'circle') {
          const radius = Math.min(element.width, element.height) / 2;
          return (
            <Circle
              ref={shapeRef}
              x={element.width / 2}
              y={element.height / 2}
              radius={radius}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          );
        } else {
          // Rectangle
          return (
            <Rect
              ref={shapeRef}
              x={0}
              y={0}
              width={element.width}
              height={element.height}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              cornerRadius={properties.cornerRadius || 0}
            />
          );
        }

      case ElementType.Arrow:
        // Arrow from top-left to bottom-right
        const points = [
          strokeWidth,
          strokeWidth,
          element.width - strokeWidth,
          element.height - strokeWidth
        ];
        
        return (
          <Arrow
            ref={shapeRef}
            points={points}
            fill={stroke}
            stroke={stroke}
            strokeWidth={strokeWidth}
            pointerLength={20}
            pointerWidth={20}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Group
        ref={groupRef}
        x={element.positionX}
        y={element.positionY}
        width={element.width}
        height={element.height}
        draggable={isEditable}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={onSelect}
        onTap={onSelect}
      >
        {renderShape()}
      </Group>
      
      {isSelected && isEditable && (
        <Transformer
          ref={transformerRef}
          enabledAnchors={
            element.type === ElementType.Arrow
              ? ['top-left', 'bottom-right'] // Only allow resizing from ends for arrows
              : [
                  'top-left',
                  'top-center',
                  'top-right',
                  'middle-right',
                  'middle-left',
                  'bottom-left',
                  'bottom-center',
                  'bottom-right',
                ]
          }
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default ShapeElement;
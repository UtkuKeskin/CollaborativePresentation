import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Type, Square, Circle, ArrowRight, Presentation, Palette, Download } from 'lucide-react';
import { useCanvas } from '../../hooks/useCanvas';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ElementType, UserRole } from '../../types';
import { toastService } from '../../services/toastService';

const Toolbar: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addElement } = useCanvas();
  
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#4299e1');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  const currentSlideId = useSelector((state: RootState) => state.presentation.currentSlideId);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const isConnected = useSelector((state: RootState) => state.user.isConnected);
  
  const canEdit = currentUser?.role === UserRole.Creator || currentUser?.role === UserRole.Editor;

  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
    '#000000', // black
  ];

  const handlePresentClick = () => {
    if (id) {
      navigate(`/presentation/${id}/present`);
    }
  };

  const handleToolClick = async (tool: string) => {
    if (!canEdit || !isConnected || !currentSlideId) return;

    setActiveTool(tool);
    
    const centerX = 512 - 100; // Canvas center minus half of default width
    const centerY = 288 - 50;  // Canvas center minus half of default height
    
    switch (tool) {
      case 'text':
        await addElement(currentSlideId, {
          type: ElementType.Text,
          content: 'New Text',
          positionX: centerX,
          positionY: centerY,
          width: 200,
          height: 100,
        });
        break;
        
      case 'rectangle':
        await addElement(currentSlideId, {
          type: ElementType.Shape,
          content: '',
          positionX: centerX,
          positionY: centerY,
          width: 200,
          height: 100,
          properties: JSON.stringify({
            shapeType: 'rectangle',
            fill: selectedColor,
            stroke: selectedColor,
            strokeWidth: 2,
            cornerRadius: 0,
          }),
        });
        break;
        
      case 'circle':
        await addElement(currentSlideId, {
          type: ElementType.Shape,
          content: '',
          positionX: centerX,
          positionY: centerY,
          width: 150,
          height: 150,
          properties: JSON.stringify({
            shapeType: 'circle',
            fill: selectedColor,
            stroke: selectedColor,
            strokeWidth: 2,
          }),
        });
        break;
        
      case 'arrow':
        await addElement(currentSlideId, {
          type: ElementType.Arrow,
          content: '',
          positionX: centerX,
          positionY: centerY,
          width: 200,
          height: 50,
          properties: JSON.stringify({
            stroke: selectedColor,
            strokeWidth: 3,
          }),
        });
        break;
    }
    
    setTimeout(() => setActiveTool(null), 100);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setShowColorPicker(false);
  };

  const handleExportPdf = async () => {
    if (!id) return;
    
    try {
      toastService.info('Generating PDF...');
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5167';
      const response = await fetch(`${apiUrl}/api/export/presentation/${id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presentation_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toastService.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toastService.error('Failed to export PDF');
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center space-x-2">
        {/* Text Tool */}
        <button 
          onClick={() => handleToolClick('text')}
          disabled={!canEdit || !isConnected}
          className={`p-2 rounded-md transition-colors ${
            activeTool === 'text' 
              ? 'bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-100'
          } ${(!canEdit || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Add Text (T)"
        >
          <Type className="w-5 h-5" />
        </button>
        
        {/* Rectangle Tool */}
        <button 
          onClick={() => handleToolClick('rectangle')}
          disabled={!canEdit || !isConnected}
          className={`p-2 rounded-md transition-colors ${
            activeTool === 'rectangle' 
              ? 'bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-100'
          } ${(!canEdit || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Add Rectangle (R)"
        >
          <Square className="w-5 h-5" />
        </button>
        
        {/* Circle Tool */}
        <button 
          onClick={() => handleToolClick('circle')}
          disabled={!canEdit || !isConnected}
          className={`p-2 rounded-md transition-colors ${
            activeTool === 'circle' 
              ? 'bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-100'
          } ${(!canEdit || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Add Circle (C)"
        >
          <Circle className="w-5 h-5" />
        </button>
        
        {/* Arrow Tool */}
        <button 
          onClick={() => handleToolClick('arrow')}
          disabled={!canEdit || !isConnected}
          className={`p-2 rounded-md transition-colors ${
            activeTool === 'arrow' 
              ? 'bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-100'
          } ${(!canEdit || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Add Arrow (A)"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        {/* Color Picker */}
        <div className="relative">
          <button 
            onClick={() => setShowColorPicker(!showColorPicker)}
            disabled={!canEdit || !isConnected}
            className={`p-2 rounded-md transition-colors hover:bg-gray-100 flex items-center gap-2 ${
              (!canEdit || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Select Color"
          >
            <Palette className="w-5 h-5" />
            <div 
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: selectedColor }}
            />
          </button>
          
          {showColorPicker && canEdit && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="grid grid-cols-3 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded hover:scale-110 transition-transform ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {!canEdit && (
          <div className="text-sm text-gray-500 ml-4">
            View Only Mode
          </div>
        )}
        
        {!isConnected && (
          <div className="text-sm text-red-500 ml-4">
            Disconnected
          </div>
        )}
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Export PDF Button */}
        <button 
          onClick={handleExportPdf}
          className="p-2 hover:bg-gray-100 rounded-md flex items-center gap-2 text-sm font-medium" 
          title="Export to PDF"
        >
          <Download className="w-5 h-5" />
          <span>PDF</span>
        </button>
        
        {/* Present Button */}
        <button 
          onClick={handlePresentClick}
          className="p-2 hover:bg-gray-100 rounded-md flex items-center gap-2 text-sm font-medium" 
          title="Start Presentation (F5)"
        >
          <Presentation className="w-5 h-5" />
          <span>Present</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
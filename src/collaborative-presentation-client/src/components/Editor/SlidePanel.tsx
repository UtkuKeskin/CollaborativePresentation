import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setCurrentSlide } from '../../store/presentationSlice';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { UserRole } from '../../types';
import { useSignalR } from '../../hooks/useSignalR';

const SlidePanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { addSlide, deleteSlide } = useSignalR();
  
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const currentSlideId = useSelector((state: RootState) => state.presentation.currentSlideId);
  const currentPresentation = useSelector((state: RootState) => state.presentation.currentPresentation);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const isConnected = useSelector((state: RootState) => state.user.isConnected);
  
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [deletingSlideId, setDeletingSlideId] = useState<string | null>(null);
  const [hoveredSlideId, setHoveredSlideId] = useState<string | null>(null);

  const sortedSlides = [...slides].sort((a, b) => a.order - b.order);
  const canEdit = currentUser?.role === UserRole.Creator || currentUser?.role === UserRole.Editor;
  const canManageSlides = currentUser?.role === UserRole.Creator;

  const handleSlideClick = (slideId: string) => {
    if (slideId !== currentSlideId) {
      dispatch(setCurrentSlide(slideId));
    }
  };

  const handleAddSlide = async () => {
    if (!currentPresentation || !canManageSlides || !isConnected || isAddingSlide) return;

    setIsAddingSlide(true);
    try {
      await addSlide(currentPresentation.id);
    } catch (error) {
      console.error('Failed to add slide:', error);
    } finally {
      setIsAddingSlide(false);
    }
  };

  const handleDeleteSlide = async (e: React.MouseEvent, slideId: string) => {
    e.stopPropagation();
    
    if (!canManageSlides || !isConnected || slides.length <= 1) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this slide?');
    if (!confirmDelete) return;

    setDeletingSlideId(slideId);
    try {
      await deleteSlide(slideId);
    } catch (error) {
      console.error('Failed to delete slide:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete slide');
    } finally {
      setDeletingSlideId(null);
    }
  };

  const getSlidePreviewStyle = (slide: any) => {
    return {
      backgroundColor: slide.backgroundColor || '#FFFFFF',
      backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Slides ({sortedSlides.length})
          </h3>
          {canManageSlides && isConnected && (
            <button
              onClick={handleAddSlide}
              disabled={isAddingSlide}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add new slide"
            >
              {isAddingSlide ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {!isConnected && (
          <p className="text-xs text-red-500 mt-1">Disconnected</p>
        )}
      </div>

      {/* Slides List - slide-panel-scroll classı eklendi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 slide-panel-scroll">
        {sortedSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`relative group cursor-pointer transition-all duration-200 ${
              currentSlideId === slide.id
                ? 'ring-2 ring-blue-500 shadow-lg transform scale-105'
                : 'hover:shadow-md hover:ring-2 hover:ring-gray-300'
            }`}
            onClick={() => handleSlideClick(slide.id)}
            onMouseEnter={() => setHoveredSlideId(slide.id)}
            onMouseLeave={() => setHoveredSlideId(null)}
          >
            {/* Slide Number */}
            <div className="absolute -top-2 -left-2 z-10 bg-gray-800 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
              {index + 1}
            </div>

            {/* Slide Preview */}
            <div 
              className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200"
              style={getSlidePreviewStyle(slide)}
            >
              <div className="w-full h-full bg-white bg-opacity-0 hover:bg-opacity-10 transition-all p-2">
                {/* Element previews */}
                <div className="relative w-full h-full">
                  {slide.elements.slice(0, 3).map((element, idx) => (
                    <div
                      key={element.id}
                      className="absolute bg-gray-200 bg-opacity-50 rounded text-xs p-1 overflow-hidden"
                      style={{
                        left: `${(element.positionX / 1024) * 100}%`,
                        top: `${(element.positionY / 576) * 100}%`,
                        width: `${(element.width / 1024) * 100}%`,
                        height: `${(element.height / 576) * 100}%`,
                        fontSize: '0.5rem',
                        opacity: 1 - idx * 0.2,
                      }}
                    >
                      <div className="truncate">{element.content.substring(0, 20)}</div>
                    </div>
                  ))}
                  {slide.elements.length > 3 && (
                    <div className="absolute bottom-1 right-1 text-xs bg-gray-700 bg-opacity-70 text-white px-1 rounded">
                      +{slide.elements.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hover Actions */}
            {canManageSlides && hoveredSlideId === slide.id && slides.length > 1 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleDeleteSlide(e, slide.id)}
                  disabled={deletingSlideId === slide.id || !isConnected}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete slide"
                >
                  {deletingSlideId === slide.id ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}

            {/* Current Slide Indicator */}
            {currentSlideId === slide.id && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500">
          {canEdit ? (
            canManageSlides ? (
              <p>You can add, delete, and reorder slides</p>
            ) : (
              <p>You can edit slide content</p>
            )
          ) : (
            <p>View only mode</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlidePanel;
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setCurrentSlide } from '../../store/presentationSlice';
import { ArrowLeft, ArrowRight, X, Maximize2, Minimize2 } from 'lucide-react';
import Canvas from '../Editor/Canvas';

const Presenter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const presentation = useSelector((state: RootState) => state.presentation.currentPresentation);
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const currentSlideId = useSelector((state: RootState) => state.presentation.currentSlideId);
  
  const sortedSlides = [...slides].sort((a, b) => a.order - b.order);
  const currentSlideIndex = sortedSlides.findIndex(s => s.id === currentSlideId);
  const currentSlide = sortedSlides[currentSlideIndex];

  // Fullscreen API
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error attempting to exit fullscreen:', err);
      }
    }
  }, []);

  // Navigation functions
  const goToPreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      const previousSlide = sortedSlides[currentSlideIndex - 1];
      dispatch(setCurrentSlide(previousSlide.id));
    }
  }, [currentSlideIndex, sortedSlides, dispatch]);

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < sortedSlides.length - 1) {
      const nextSlide = sortedSlides[currentSlideIndex + 1];
      dispatch(setCurrentSlide(nextSlide.id));
    }
  }, [currentSlideIndex, sortedSlides, dispatch]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < sortedSlides.length) {
      dispatch(setCurrentSlide(sortedSlides[index].id));
    }
  }, [sortedSlides, dispatch]);

  const exitPresentation = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    navigate(`/presentation/${id}`);
  }, [navigate, id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default browser shortcuts
      if (['ArrowLeft', 'ArrowRight', 'Space', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          goToPreviousSlide();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ': // Space key
          goToNextSlide();
          break;
        case 'Home':
          goToSlide(0);
          break;
        case 'End':
          goToSlide(sortedSlides.length - 1);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          exitPresentation();
          break;
        case 'h':
        case 'H':
          setShowControls(prev => !prev);
          break;
        default:
          // Number keys 1-9 for direct slide navigation
          const num = parseInt(e.key);
          if (!isNaN(num) && num > 0 && num <= sortedSlides.length) {
            goToSlide(num - 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousSlide, goToNextSlide, goToSlide, toggleFullscreen, exitPresentation, sortedSlides.length]);

  // Auto-hide controls
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Initial hide after 3 seconds
    hideTimer = setTimeout(() => setShowControls(false), 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimer);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!presentation || !currentSlide) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Presentation not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* Main Canvas */}
      <div className="h-full flex items-center justify-center">
        <div className="w-full h-full max-w-[1920px] max-h-[1080px]">
          <Canvas slide={currentSlide} isEditable={false} />
        </div>
      </div>

      {/* Controls Overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-auto">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h1 className="text-xl font-semibold">{presentation.title}</h1>
              <p className="text-sm opacity-75">
                Slide {currentSlideIndex + 1} of {sortedSlides.length}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              
              <button
                onClick={exitPresentation}
                className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                title="Exit presentation (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto">
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={goToPreviousSlide}
              disabled={currentSlideIndex === 0}
              className={`p-3 rounded-full transition-all ${
                currentSlideIndex === 0
                  ? 'text-white/30 cursor-not-allowed'
                  : 'text-white hover:bg-white/20'
              }`}
              title="Previous slide (←)"
            >
              <ArrowLeft size={24} />
            </button>

            {/* Slide Indicators */}
            <div className="flex items-center gap-2">
              {sortedSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(index)}
                  className={`transition-all ${
                    index === currentSlideIndex
                      ? 'w-8 h-2 bg-white rounded-full'
                      : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/75'
                  }`}
                  title={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNextSlide}
              disabled={currentSlideIndex === sortedSlides.length - 1}
              className={`p-3 rounded-full transition-all ${
                currentSlideIndex === sortedSlides.length - 1
                  ? 'text-white/30 cursor-not-allowed'
                  : 'text-white hover:bg-white/20'
              }`}
              title="Next slide (→)"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        {showControls && (
          <div className="absolute bottom-20 right-4 text-white/60 text-xs pointer-events-auto">
            <p>← → Navigate • Space Next • F Fullscreen • Esc Exit • H Hide controls</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Presenter;
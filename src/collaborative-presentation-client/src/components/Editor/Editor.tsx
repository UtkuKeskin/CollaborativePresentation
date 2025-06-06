import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import Canvas from './Canvas';
import SlidePanel from './SlidePanel';
import UsersPanel from './UsersPanel';
import Toolbar from './Toolbar';
import { RootState, AppDispatch } from '../../store';
import { setPresentation, setSlides, setLoading, setError } from '../../store/presentationSlice';
import { presentationApi, slideApi } from '../../services/api';

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isInitializing, setIsInitializing] = useState(true);

  const presentation = useSelector((state: RootState) => state.presentation.currentPresentation);
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const currentSlideId = useSelector((state: RootState) => state.presentation.currentSlideId);
  const isLoading = useSelector((state: RootState) => state.presentation.isLoading);
  const error = useSelector((state: RootState) => state.presentation.error);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    loadPresentation();
  }, [id]);

  const loadPresentation = async () => {
    if (!id) return;

    try {
      dispatch(setLoading(true));
      
      // Load presentation details
      const presentationData = await presentationApi.getById(id);
      dispatch(setPresentation(presentationData));

      // Load slides
      const slidesData = await slideApi.getByPresentationId(id);
      dispatch(setSlides(slidesData));

      setIsInitializing(false);
    } catch (err) {
      console.error('Error loading presentation:', err);
      dispatch(setError('Failed to load presentation'));
      setIsInitializing(false);
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (isInitializing || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!presentation || !currentSlideId) {
    return null;
  }

  const currentSlide = slides.find(s => s.id === currentSlideId);
  if (!currentSlide) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slides Panel */}
        <SlidePanel />

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Canvas slide={currentSlide} />
        </div>

        {/* Users Panel */}
        <UsersPanel />
      </div>
    </div>
  );
};

export default Editor;
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
import { useSignalR } from '../../hooks/useSignalR';
import { signalRService } from '../../services/signalRService';

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  const { joinPresentation, leavePresentation } = useSignalR();

  const presentation = useSelector((state: RootState) => state.presentation.currentPresentation);
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const currentSlideId = useSelector((state: RootState) => state.presentation.currentSlideId);
  const isLoading = useSelector((state: RootState) => state.presentation.isLoading);
  const error = useSelector((state: RootState) => state.presentation.error);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const isConnected = useSelector((state: RootState) => state.user.isConnected);

  useEffect(() => {
    console.log('📊 Slides updated:', {
      slideCount: slides.length,
      slides: slides.map(s => ({
        id: s.id,
        elementCount: s.elements?.length || 0,
        elements: s.elements
      }))
    });
  }, [slides]);

  const currentSlide = slides.find(s => s.id === currentSlideId);
  
  useEffect(() => {
    console.log('📝 Editor - Current slide state:', {
      hasSlide: !!currentSlide,
      slideId: currentSlide?.id,
      elementCount: currentSlide?.elements?.length || 0,
      elements: currentSlide?.elements
    });
  }, [currentSlide?.elements?.length]);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const INIT_TIMEOUT = 15000;
    let timeoutId: NodeJS.Timeout;

    const initializePresentation = async () => {
      try {
        dispatch(setLoading(true));
        
        timeoutId = setTimeout(() => {
          dispatch(setError('Connection timeout. Please refresh the page.'));
          setIsInitializing(false);
          navigate('/');
        }, INIT_TIMEOUT);
        
        const presentationData = await presentationApi.getById(id);
        dispatch(setPresentation(presentationData));

        const slidesData = await slideApi.getByPresentationId(id);
        dispatch(setSlides(slidesData));

        console.log('Waiting for SignalR connection...');
        let connectionAttempts = 0;
        const maxAttempts = 20;
        
        while (!signalRService.isConnected() && connectionAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          connectionAttempts++;
          
          if (connectionAttempts === 5 && !signalRService.isConnected()) {
            console.log('Attempting to start SignalR connection...');
            try {
              await signalRService.start();
            } catch (error) {
              console.error('Failed to start SignalR:', error);
            }
          }
        }

        if (!signalRService.isConnected()) {
          console.error('SignalR connection failed after multiple attempts');
          dispatch(setError('Connection failed. Please check your internet connection and refresh the page.'));
          setIsInitializing(false);
          return;
        }

        console.log('SignalR connected successfully');

        const storedNickname = localStorage.getItem(`presentation_${id}_nickname`);
        if (storedNickname) {
          try {
            console.log('Auto-joining with stored nickname:', storedNickname);
            await joinPresentation(id, storedNickname);
            
            setIsReady(true);
            console.log('Presentation is ready for interaction');
            
          } catch (error: any) {
            console.error('Failed to auto-join presentation:', error);
            
            if (error.message?.includes('nickname')) {
              localStorage.removeItem(`presentation_${id}_nickname`);
            }
            
            navigate('/');
            return;
          }
        } else {
          console.log('No stored nickname found, redirecting to home');
          navigate('/');
          return;
        }

        setIsInitializing(false);
        clearTimeout(timeoutId);
        
      } catch (err) {
        console.error('Error loading presentation:', err);
        dispatch(setError('Failed to load presentation'));
        setIsInitializing(false);
        clearTimeout(timeoutId);
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializePresentation();

    return () => {
      console.log('Editor cleanup: leaving presentation');
      setIsReady(false);
      if (timeoutId) clearTimeout(timeoutId);
      leavePresentation();
    };
  }, [id, navigate, dispatch, joinPresentation, leavePresentation]);

  useEffect(() => {
    const checkConnection = setInterval(() => {
      if (!signalRService.isConnected() && currentUser) {
        console.log('Connection lost, attempting to reconnect...');
        setIsReady(false);
        signalRService.start().then(() => {
          if (id && currentUser) {
            console.log('Reconnected, rejoining presentation...');
            joinPresentation(id, currentUser.nickname).then(() => {
              setIsReady(true);
            });
          }
        });
      }
    }, 5000);

    return () => clearInterval(checkConnection);
  }, [id, currentUser, joinPresentation]);

  if (!isReady || isInitializing || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">
          {!isConnected ? 'Connecting to server...' : 'Preparing presentation...'}
        </p>
        {!isConnected && (
          <p className="text-sm text-gray-500 mt-2">
            This may take a few seconds...
          </p>
        )}
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

  if (!presentation || !currentSlideId || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading presentation data...</p>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">Slide not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {!isConnected && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-md text-sm z-50">
          Disconnected - Reconnecting...
        </div>
      )}
      
      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <SlidePanel />

        <div className="flex-1 flex items-center justify-center p-4">
          <Canvas slide={currentSlide} isEditable={isReady && isConnected} />
        </div>

        <UsersPanel />
      </div>
    </div>
  );
};

export default Editor;
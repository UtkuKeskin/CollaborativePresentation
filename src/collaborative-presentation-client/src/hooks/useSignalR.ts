import { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signalRService } from '../services/signalRService';
import { RootState, AppDispatch } from '../store';
import { setConnectionStatus } from '../store/userSlice';

interface UseSignalRReturn {
  isConnected: boolean;
  connectionState: string | null;
  joinPresentation: (presentationId: string, nickname: string) => Promise<any>;
  leavePresentation: () => Promise<void>;
  updateElement: (slideId: string, elementId: string, data: any) => Promise<void>;
  deleteElement: (elementId: string) => Promise<void>;
  changeUserRole: (userId: string, newRole: string) => Promise<void>;
  addSlide: (presentationId: string) => Promise<void>;
  deleteSlide: (slideId: string) => Promise<void>;
}

export const useSignalR = (): UseSignalRReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const isConnected = useSelector((state: RootState) => state.user.isConnected);
  const [connectionState, setConnectionState] = useState<string | null>(null);

  useEffect(() => {
    
    const initConnection = async () => {
      try {
        await signalRService.start();
      } catch (error) {
        console.error('Failed to start SignalR connection:', error);
        dispatch(setConnectionStatus(false));
      }
    };

    initConnection();

    const updateState = setInterval(() => {
      const state = signalRService.getConnectionState();
      setConnectionState(state);
    }, 1000);

    return () => {
      clearInterval(updateState);
    };
  }, [dispatch]);

  const joinPresentation = useCallback(async (presentationId: string, nickname: string) => {
    return await signalRService.joinPresentation(presentationId, nickname);
  }, []);

  const leavePresentation = useCallback(async () => {
    await signalRService.leavePresentation();
  }, []);

  const updateElement = useCallback(async (slideId: string, elementId: string, data: any) => {
    await signalRService.updateElement(slideId, elementId, data);
  }, []);

  const deleteElement = useCallback(async (elementId: string) => {
    await signalRService.deleteElement(elementId);
  }, []);

  const changeUserRole = useCallback(async (userId: string, newRole: string) => {
    await signalRService.changeUserRole(userId, newRole);
  }, []);

  const addSlide = useCallback(async (presentationId: string) => {
    await signalRService.addSlide(presentationId);
  }, []);

  const deleteSlide = useCallback(async (slideId: string) => {
    await signalRService.deleteSlide(slideId);
  }, []);

  return {
    isConnected,
    connectionState,
    joinPresentation,
    leavePresentation,
    updateElement,
    deleteElement,
    changeUserRole,
    addSlide,
    deleteSlide,
  };
};
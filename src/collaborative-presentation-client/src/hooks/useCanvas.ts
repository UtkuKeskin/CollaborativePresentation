import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { AppDispatch, RootState } from '../store';
import { updateElement as updateElementAction, removeElement } from '../store/presentationSlice';
import { ElementDto, ElementType } from '../types';
import { signalRService } from '../services/signalRService';

export const useCanvas = () => {
  const dispatch = useDispatch<AppDispatch>();
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const isConnected = useSelector((state: RootState) => state.user.isConnected);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  const addElement = async (slideId: string, elementData: Partial<ElementDto>) => {
    if (!isConnected || !currentUser) {
      console.warn('Cannot add element: User not ready or disconnected', {
        isConnected,
        hasUser: !!currentUser
      });
      return;
    }

    const newElementData = {
      type: elementData.type!,
      content: elementData.content || '',
      positionX: elementData.positionX || 0,
      positionY: elementData.positionY || 0,
      width: elementData.width || 200,
      height: elementData.height || 100,
      zIndex: elementData.zIndex || 0,
      properties: elementData.properties || undefined,
    };
    
    try {
      console.log('📤 Sending element to SignalR...');
      await signalRService.updateElement(slideId, '', newElementData);
      console.log('✅ Element sent successfully!');
    } catch (error) {
      console.error('❌ Failed to send element to server:', error);
      
      const fallbackElement: ElementDto = {
        id: uuidv4(),
        slideId: slideId,
        type: elementData.type || ElementType.Text,
        content: elementData.content || '',
        positionX: elementData.positionX || 0,
        positionY: elementData.positionY || 0,
        width: elementData.width || 200,
        height: elementData.height || 100,
        zIndex: elementData.zIndex || 0,
        properties: elementData.properties,
        updatedAt: new Date().toISOString(),
      };
      dispatch(updateElementAction({ slideId, element: fallbackElement }));
    }
  };

  const updateElement = async (slideId: string, elementId: string, updates: Partial<ElementDto>) => {
    if (!isConnected || !currentUser) {
      console.warn('Cannot update element: User not ready or disconnected');
      return;
    }

    const slide = slides.find(s => s.id === slideId);
    const currentElement = slide?.elements.find(e => e.id === elementId);
    
    if (!currentElement) {
      console.error('Element not found:', elementId);
      return;
    }

    const updatedElement: ElementDto = {
      ...currentElement,
      ...updates,
      id: elementId,
      slideId,
      updatedAt: new Date().toISOString(),
    };

    dispatch(updateElementAction({ slideId, element: updatedElement }));
    
    try {
      await signalRService.updateElement(slideId, elementId, {
        type: updatedElement.type,
        content: updatedElement.content,
        positionX: updatedElement.positionX,
        positionY: updatedElement.positionY,
        width: updatedElement.width,
        height: updatedElement.height,
        zIndex: updatedElement.zIndex,
        properties: updatedElement.properties || undefined,
      });
    } catch (error) {
      console.error('Failed to update element on server:', error);
      dispatch(updateElementAction({ slideId, element: currentElement }));
    }
  };

  const deleteElement = async (slideId: string, elementId: string) => {
    if (!isConnected || !currentUser) {
      console.warn('Cannot delete element: User not ready or disconnected');
      return;
    }

    const slide = slides.find(s => s.id === slideId);
    const elementToDelete = slide?.elements.find(e => e.id === elementId);
    
    if (!elementToDelete) {
      console.error('Element to delete not found:', elementId);
      return;
    }

    dispatch(removeElement({ slideId, elementId }));
    
    try {
      await signalRService.deleteElement(elementId);
    } catch (error) {
      console.error('Failed to delete element on server:', error);
      dispatch(updateElementAction({ slideId, element: elementToDelete }));
    }
  };

  return {
    addElement,
    updateElement,
    deleteElement,
  };
};
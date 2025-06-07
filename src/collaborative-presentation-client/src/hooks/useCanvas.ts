import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { AppDispatch, RootState } from '../store';
import { updateElement as updateElementAction, removeElement } from '../store/presentationSlice';
import { ElementDto } from '../types';
import { signalRService } from '../services/signalRService';

export const useCanvas = () => {
  const dispatch = useDispatch<AppDispatch>();
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const isConnected = useSelector((state: RootState) => state.user.isConnected);

  const addElement = async (slideId: string, elementData: Partial<ElementDto>) => {
    const newElement: ElementDto = {
      id: uuidv4(),
      slideId,
      type: elementData.type!,
      content: elementData.content || '',
      positionX: elementData.positionX || 0,
      positionY: elementData.positionY || 0,
      width: elementData.width || 200,
      height: elementData.height || 100,
      zIndex: elementData.zIndex || 0,
      properties: elementData.properties,
      updatedAt: new Date().toISOString(),
    };

    dispatch(updateElementAction({ slideId, element: newElement }));
    
    if (isConnected) {
      try {
        await signalRService.updateElement(slideId, '', {
          type: newElement.type,
          content: newElement.content,
          positionX: newElement.positionX,
          positionY: newElement.positionY,
          width: newElement.width,
          height: newElement.height,
          zIndex: newElement.zIndex,
          properties: newElement.properties,
        });
      } catch (error) {
        console.error('Failed to send element to server:', error);
      }
    }
  };

  const updateElement = async (slideId: string, elementId: string, updates: Partial<ElementDto>) => {
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
    
    if (isConnected) {
      try {
        await signalRService.updateElement(slideId, elementId, {
          type: updatedElement.type,
          content: updatedElement.content,
          positionX: updatedElement.positionX,
          positionY: updatedElement.positionY,
          width: updatedElement.width,
          height: updatedElement.height,
          zIndex: updatedElement.zIndex,
          properties: updatedElement.properties,
        });
      } catch (error) {
        console.error('Failed to update element on server:', error);
      }
    }
  };

  const deleteElement = async (slideId: string, elementId: string) => {
    dispatch(removeElement({ slideId, elementId }));
    
    if (isConnected) {
      try {
        await signalRService.deleteElement(elementId);
      } catch (error) {
        console.error('Failed to delete element on server:', error);
      }
    }
  };

  return {
    addElement,
    updateElement,
    deleteElement,
  };
};
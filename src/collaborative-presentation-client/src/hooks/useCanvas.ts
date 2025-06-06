import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { AppDispatch, RootState } from '../store';
import { updateElement as updateElementAction, removeElement } from '../store/presentationSlice';
import { ElementDto } from '../types';

export const useCanvas = () => {
  const dispatch = useDispatch<AppDispatch>();
  const slides = useSelector((state: RootState) => state.presentation.slides);

  const addElement = (slideId: string, elementData: Partial<ElementDto>) => {
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
    
    // TODO: Send to server via SignalR
    console.log('Adding element:', newElement);
  };

  const updateElement = (slideId: string, elementId: string, updates: Partial<ElementDto>) => {
    // Find the current element
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
    
    console.log('Updating element:', updatedElement);
  };

  const deleteElement = (slideId: string, elementId: string) => {
    dispatch(removeElement({ slideId, elementId }));
    
    console.log('Deleting element:', elementId);
  };

  return {
    addElement,
    updateElement,
    deleteElement,
  };
};
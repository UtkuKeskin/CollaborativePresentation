import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PresentationDto, SlideDto, ElementDto } from '../types';

interface PresentationState {
  currentPresentation: PresentationDto | null;
  slides: SlideDto[];
  currentSlideId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PresentationState = {
  currentPresentation: null,
  slides: [],
  currentSlideId: null,
  isLoading: false,
  error: null,
};

const presentationSlice = createSlice({
  name: 'presentation',
  initialState,
  reducers: {
    setPresentation: (state, action: PayloadAction<PresentationDto>) => {
      state.currentPresentation = action.payload;
    },
    
    setSlides: (state, action: PayloadAction<SlideDto[]>) => {
      action.payload.forEach(newSlide => {
        const existingSlideIndex = state.slides.findIndex(s => s.id === newSlide.id);
        
        if (existingSlideIndex !== -1) {
          // Mevcut slide varsa
          const existingSlide = state.slides[existingSlideIndex];
          
          state.slides[existingSlideIndex] = {
            ...newSlide,
            elements: (newSlide.elements && newSlide.elements.length > 0)
              ? newSlide.elements 
              : existingSlide.elements,
          };
        } else {
          state.slides.push({
            ...newSlide,
            elements: newSlide.elements || []
          });
        }
      });
      
      const newSlideIds = action.payload.map(s => s.id);
      state.slides = state.slides.filter(s => newSlideIds.includes(s.id));
      
      if (!state.currentSlideId && action.payload.length > 0) {
        state.currentSlideId = action.payload[0].id;
      }
    },
    
    setCurrentSlide: (state, action: PayloadAction<string>) => {
      state.currentSlideId = action.payload;
    },
    
    addSlide: (state, action: PayloadAction<SlideDto>) => {
      state.slides.push(action.payload);
    },
    
    removeSlide: (state, action: PayloadAction<string>) => {
      state.slides = state.slides.filter(slide => slide.id !== action.payload);
      if (state.currentSlideId === action.payload && state.slides.length > 0) {
        state.currentSlideId = state.slides[0].id;
      }
    },
    
    updateElement: (state, action: PayloadAction<{ slideId: string; element: ElementDto }>) => {
      const slide = state.slides.find(s => s.id === action.payload.slideId);
      if (slide) {
        const existingIndex = slide.elements.findIndex(e => e.id === action.payload.element.id);
        if (existingIndex >= 0) {
          slide.elements[existingIndex] = action.payload.element;
        } else {
          slide.elements.push(action.payload.element);
        }
      }
    },
    
    removeElement: (state, action: PayloadAction<{ slideId: string; elementId: string }>) => {
      const slide = state.slides.find(s => s.id === action.payload.slideId);
      if (slide) {
        slide.elements = slide.elements.filter(e => e.id !== action.payload.elementId);
      }
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    resetPresentation: (state) => {
      return initialState;
    },
  },
});

export const {
  setPresentation,
  setSlides,
  setCurrentSlide,
  addSlide,
  removeSlide,
  updateElement,
  removeElement,
  setLoading,
  setError,
  resetPresentation,
} = presentationSlice.actions;

export default presentationSlice.reducer;
import axios from 'axios';
import { 
  PresentationListDto, 
  PresentationDto, 
  CreatePresentationDto, 
  JoinPresentationDto,
  ConnectionInfoDto,
  SlideDto 
} from '../types';

const API_URL = 'http://localhost:5167';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
);

export const presentationApi = {

  getAll: async (): Promise<PresentationListDto[]> => {
    const response = await api.get<PresentationListDto[]>('/presentations');
    return response.data;
  },

  getById: async (id: string): Promise<PresentationDto> => {
    const response = await api.get<PresentationDto>(`/presentations/${id}`);
    return response.data;
  },

  create: async (data: CreatePresentationDto): Promise<PresentationDto> => {
    const response = await api.post<PresentationDto>('/presentations', data);
    return response.data;
  },

  join: async (id: string, data: JoinPresentationDto): Promise<ConnectionInfoDto> => {
    const response = await api.post<ConnectionInfoDto>(`/presentations/${id}/join`, data);
    return response.data;
  },
};

export const slideApi = {

  getByPresentationId: async (presentationId: string): Promise<SlideDto[]> => {
    const response = await api.get<SlideDto[]>(`/slides/presentation/${presentationId}`);
    return response.data;
  },
};

export default api;
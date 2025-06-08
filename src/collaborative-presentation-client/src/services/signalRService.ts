import * as signalR from '@microsoft/signalr';
import { store } from '../store';
import { 
  setConnectionStatus, 
  setCurrentUser, 
  setConnectedUsers,
  addConnectedUser,
  removeConnectedUser,
  updateUserRole
} from '../store/userSlice';
import { 
  updateElement, 
  removeElement, 
  addSlide, 
  removeSlide 
} from '../store/presentationSlice';
import { ElementDto, ActiveUserDto, SlideDto } from '../types';
import { toastService } from './toastService';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect = false;

  constructor() {
    this.createConnection();
  }

  private createConnection() {
    const signalRUrl = process.env.REACT_APP_SIGNALR_URL || 'http://localhost:5167/presentationHub';
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(signalRUrl)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.elapsedMilliseconds < 60000) {
            return 3000;
          } else {
            return 10000;
          }
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    this.connection.onreconnecting(() => {
      console.log('SignalR: Reconnecting...');
      store.dispatch(setConnectionStatus(false));
    });

    this.connection.onreconnected(() => {
      console.log('SignalR: Reconnected');
      store.dispatch(setConnectionStatus(true));
      toastService.success('Connection restored');
    });

    this.connection.onclose(() => {
      console.log('SignalR: Connection closed');
      store.dispatch(setConnectionStatus(false));
      toastService.error('Connection lost. Attempting to reconnect...');
      
      if (!this.isIntentionalDisconnect) {
        this.startReconnectTimer();
      }
    });

    this.connection.on('UserLeft', (user: ActiveUserDto) => {
      console.log('User left:', user);
      store.dispatch(removeConnectedUser(user.id));
    });

    this.connection.on('UserDisconnected', (user: ActiveUserDto) => {
      console.log('User disconnected:', user);
      store.dispatch(removeConnectedUser(user.id));
    });

    this.connection.on('UsersUpdated', (users: ActiveUserDto[]) => {
      console.log('🔄 UsersUpdated event received:', {
        timestamp: new Date().toISOString(),
        userCount: users.length,
        users: users.map(u => ({ id: u.id, nickname: u.nickname, role: u.role, isConnected: u.isConnected }))
      });
      
      store.dispatch(setConnectedUsers(users));
      
      const state = store.getState();
      const currentUserId = state.user.currentUser?.id;
      
      if (currentUserId) {
        const updatedCurrentUser = users.find(u => u.id === currentUserId);
        if (updatedCurrentUser) {
          console.log('📝 Updating current user role:', {
            oldRole: state.user.currentUser?.role,
            newRole: updatedCurrentUser.role
          });
          store.dispatch(setCurrentUser(updatedCurrentUser));
        }
      }
    });
      
    this.connection.on('UserJoined', (user: ActiveUserDto) => {
      console.log('➕ UserJoined event received:', {
        timestamp: new Date().toISOString(),
        user: { id: user.id, nickname: user.nickname }
      });
      store.dispatch(addConnectedUser(user));
    });

    this.connection.on('ElementUpdated', (data: { element: ElementDto; updatedBy: string; slideId: string }) => {
      console.log('🔴 ElementUpdated event received:', {
        elementId: data.element.id,
        slideId: data.slideId,
        updatedBy: data.updatedBy,
        element: data.element
      });
    
      const clonedElement = JSON.parse(JSON.stringify(data.element));
    
      console.log('🟡 Dispatching updateElement with cloned element...');
      store.dispatch(updateElement({ slideId: data.slideId, element: clonedElement }));
    
      const state = store.getState();
      const slide = state.presentation.slides.find(s => s.id === data.slideId);
      console.log('🟢 Store state after dispatch:', {
        slideFound: !!slide,
        elementCount: slide?.elements?.length || 0,
        elements: slide?.elements
      });
    });

    this.connection.on('ElementDeleted', (elementId: string) => {
      console.log('Element deleted:', elementId);
      const state = store.getState();
      const slide = state.presentation.slides.find(s => 
        s.elements.some(e => e.id === elementId)
      );
      if (slide) {
        store.dispatch(removeElement({ slideId: slide.id, elementId }));
      }
    });

    this.connection.on('SlideAdded', (slide: SlideDto) => {
      console.log('Slide added:', slide);
      store.dispatch(addSlide(slide));
    });

    this.connection.on('SlideDeleted', (slideId: string) => {
      console.log('Slide deleted:', slideId);
      store.dispatch(removeSlide(slideId));
    });
  }

  private startReconnectTimer() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }

    this.reconnectTimer = setInterval(async () => {
      if (this.connection?.state === signalR.HubConnectionState.Disconnected) {
        console.log('SignalR: Attempting manual reconnect...');
        try {
          await this.start();
        } catch (error) {
          console.error('SignalR: Manual reconnect failed:', error);
        }
      }
    }, 5000);
  }

  async start(): Promise<void> {
    if (!this.connection) {
      this.createConnection();
    }

    if (this.connection!.state === signalR.HubConnectionState.Disconnected) {
      try {
        await this.connection!.start();
        console.log('SignalR: Connected');
        store.dispatch(setConnectionStatus(true));
        this.isIntentionalDisconnect = false;
        
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      } catch (error) {
        console.error('SignalR: Failed to connect:', error);
        throw error;
      }
    }
  }

  async stop(): Promise<void> {
    this.isIntentionalDisconnect = true;
    
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      try {
        await this.connection.stop();
        console.log('SignalR: Disconnected');
      } catch (error) {
        console.error('SignalR: Failed to disconnect:', error);
      }
    }
  }

  async joinPresentation(presentationId: string, nickname: string): Promise<any> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established');
    }
  
    try {
      const response = await this.connection.invoke('JoinPresentation', presentationId, { nickname });
      if (response.success) {
        store.dispatch(setCurrentUser(response.data.user));
        
        if (response.data.users) {
          store.dispatch(setConnectedUsers(response.data.users));
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to join presentation');
      }
    } catch (error) {
      console.error('SignalR: Failed to join presentation:', error);
      throw error;
    }
  }

  async leavePresentation(): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('LeavePresentation');
    } catch (error) {
      console.error('SignalR: Failed to leave presentation:', error);
    }
  }

  async updateElement(slideId: string, elementId: string, data: any): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.warn('SignalR: Cannot update element - not connected');
      return;
    }
  
    try {
      const updateDto = {
        elementId: elementId || '00000000-0000-0000-0000-000000000000',
        slideId: slideId,
        updatedBy: '',
        data: {
          type: data.type,
          content: data.content,
          positionX: data.positionX,
          positionY: data.positionY,
          width: data.width,
          height: data.height,
          zIndex: data.zIndex,
          properties: data.properties
        }
      };
  
      console.log('SignalR: Sending UpdateElement with DTO:', updateDto);
  
      const response = await this.connection.invoke('UpdateElement', updateDto);
      
      if (!response.success) {
        console.error('SignalR: Failed to update element:', response.message);
        throw new Error(response.message || 'Failed to update element');
      }
  
      console.log('SignalR: Element updated successfully:', response.data);
    } catch (error) {
      console.error('SignalR: Failed to update element:', error);
      throw error;
    }
  }

  async deleteElement(elementId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.warn('SignalR: Cannot delete element - not connected');
      return;
    }

    try {
      const response = await this.connection.invoke('DeleteElement', elementId);
      
      if (!response.success) {
        console.error('SignalR: Failed to delete element:', response.message);
      }
    } catch (error) {
      console.error('SignalR: Failed to delete element:', error);
    }
  }

  async changeUserRole(userId: string, newRole: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established');
    }
  
    try {
      const response = await this.connection.invoke('ChangeUserRole', { 
        userId, 
        newRole: parseInt(newRole)
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to change user role');
      }
    } catch (error) {
      console.error('SignalR: Failed to change user role:', error);
      throw error;
    }
  }

  async addSlide(presentationId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established');
    }

    try {
      const response = await this.connection.invoke('AddSlide', presentationId);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to add slide');
      }
    } catch (error) {
      console.error('SignalR: Failed to add slide:', error);
      throw error;
    }
  }

  async deleteSlide(slideId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established');
    }

    try {
      const response = await this.connection.invoke('DeleteSlide', slideId);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete slide');
      }
    } catch (error) {
      console.error('SignalR: Failed to delete slide:', error);
      throw error;
    }
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state || null;
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();

if (typeof window !== 'undefined') {
  (window as any).signalRService = signalRService;
}
// Enums
export enum UserRole {
  Viewer = 0,
  Editor = 1,
  Creator = 2
}

export enum ElementType {
  Text = 0,
  Shape = 1,
  Image = 2,
  Line = 3,
  Arrow = 4
}
  
  // DTOs
  export interface PresentationDto {
    id: string;
    title: string;
    creatorNickname: string;
    createdAt: string;
    updatedAt: string;
    slideCount: number;
    activeUserCount: number;
    isActive: boolean;
  }
  
  export interface PresentationListDto {
    id: string;
    title: string;
    creatorNickname: string;
    createdAt: string;
    activeUserCount: number;
  }
  
  export interface CreatePresentationDto {
    title: string;
    creatorNickname: string;
  }
  
  export interface JoinPresentationDto {
    nickname: string;
  }
  
  export interface SlideDto {
    id: string;
    presentationId: string;
    order: number;
    backgroundColor?: string;
    backgroundImage?: string;
    createdAt: string;
    updatedAt: string;
    elements: ElementDto[];
  }
  
  export interface ElementDto {
    id: string;
    slideId: string;
    type: ElementType;
    content: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    zIndex: number;
    properties?: string;
    updatedAt: string;
  }
  
  export interface ActiveUserDto {
    id: string;
    nickname: string;
    role: UserRole;
    joinedAt: string;
    isConnected: boolean;
  }
  
  export interface ConnectionInfoDto {
    connectionId: string;
    presentationId: string;
    user: ActiveUserDto;
  }

  export interface ChangeUserRoleDto {
    userId: string;
    newRole: UserRole;
  }
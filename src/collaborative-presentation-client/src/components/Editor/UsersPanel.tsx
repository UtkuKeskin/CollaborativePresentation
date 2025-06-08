import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Users, Crown, Edit, Eye, MoreVertical, X, Check } from 'lucide-react';
import { UserRole } from '../../types';
import { useSignalR } from '../../hooks/useSignalR';
import { toastService } from '../../services/toastService';

const UsersPanel: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const connectedUsers = useSelector((state: RootState) => state.user.connectedUsers);
  const isConnected = useSelector((state: RootState) => state.user.isConnected);
  
  const { changeUserRole } = useSignalR();
  
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.Creator:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case UserRole.Editor:
        return <Edit className="w-4 h-4 text-blue-500" />;
      case UserRole.Viewer:
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.Creator:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case UserRole.Editor:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case UserRole.Viewer:
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.Creator:
        return 'Creator';
      case UserRole.Editor:
        return 'Editor';
      case UserRole.Viewer:
        return 'Viewer';
      default:
        return 'Unknown';
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (changingRole) return;
    
    setChangingRole(userId);
    try {
      await changeUserRole(userId, newRole.toString());
      setShowRoleMenu(null);
      toastService.success(`User role changed to ${getRoleName(newRole)}`);
    } catch (error) {
      console.error('Failed to change user role:', error);
      toastService.error('Failed to change user role. You must be the creator.');
    } finally {
      setChangingRole(null);
    }
  };

  const canChangeRole = currentUser?.role === UserRole.Creator;

  // Sort users: Creator first, then by join time
  const sortedUsers = [...connectedUsers].sort((a, b) => {
    if (a.role === UserRole.Creator && b.role !== UserRole.Creator) return -1;
    if (a.role !== UserRole.Creator && b.role === UserRole.Creator) return 1;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  if (!isConnected) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Users
        </h3>
        <div className="text-sm text-gray-500 text-center py-4">
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="mt-3">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center justify-between">
          <span className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Users ({sortedUsers.length})
          </span>
          <span className="text-xs font-normal text-gray-500">
            {sortedUsers.filter(u => u.isConnected).length} online
          </span>
        </h3>
      </div>

      {/* Users List - users-panel-scroll class'ı eklendi */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 users-panel-scroll">
        {sortedUsers.map((user) => (
          <div
            key={user.id}
            className={`relative p-3 rounded-lg border transition-all ${
              user.id === currentUser?.id
                ? 'border-blue-400 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {/* User Info */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {/* Online Status */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  user.isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                
                {/* Nickname */}
                <span className="text-sm font-medium text-gray-900 truncate">
                  {user.nickname}
                  {user.id === currentUser?.id && ' (You)'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1">
                {getRoleIcon(user.role)}
                
                {/* Role Change Menu for Creator */}
                {canChangeRole && user.id !== currentUser?.id && user.role !== UserRole.Creator && (
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleMenu(showRoleMenu === user.id ? null : user.id)}
                      disabled={changingRole === user.id}
                      className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                    >
                      {changingRole === user.id ? (
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {showRoleMenu === user.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          {[UserRole.Editor, UserRole.Viewer].map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(user.id, role)}
                              disabled={user.role === role}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                                user.role === role ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <span className="flex items-center">
                                {getRoleIcon(role)}
                                <span className="ml-2">{getRoleName(role)}</span>
                              </span>
                              {user.role === role && <Check className="w-3 h-3 text-green-600" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleColor(user.role)}`}>
                {getRoleName(user.role)}
              </span>
              
              {/* Join Time */}
              <span className="text-xs text-gray-500">
                Joined {new Date(user.joinedAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}

        {sortedUsers.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-8">
            No users connected
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center">
            <Crown className="w-3 h-3 text-yellow-500 mr-1" />
            <span>Creator - Full control</span>
          </div>
          <div className="flex items-center">
            <Edit className="w-3 h-3 text-blue-500 mr-1" />
            <span>Editor - Can edit content</span>
          </div>
          <div className="flex items-center">
            <Eye className="w-3 h-3 text-gray-500 mr-1" />
            <span>Viewer - Read only</span>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showRoleMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowRoleMenu(null)} 
        />
      )}
    </div>
  );
};

export default UsersPanel;
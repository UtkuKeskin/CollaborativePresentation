import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { Users, Crown, Edit, Eye, MoreVertical } from 'lucide-react';
import { UserRole } from '../../types';

const UsersPanel: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const connectedUsers = useSelector((state: RootState) => state.user.connectedUsers);
  const isConnected = useSelector((state: RootState) => state.user.isConnected);

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
        return 'bg-yellow-100 text-yellow-800';
      case UserRole.Editor:
        return 'bg-blue-100 text-blue-800';
      case UserRole.Viewer:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  React.useEffect(() => {
    console.log('👥 UsersPanel rendered:', {
      currentUser,
      connectedUsersCount: connectedUsers.length,
      connectedUsers,
      isConnected
    });
  }, [currentUser, connectedUsers, isConnected]);

  if (!isConnected) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Users
        </h3>
        <div className="text-sm text-gray-500 text-center py-4">
          Connecting...
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center justify-between">
        <span className="flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Users ({connectedUsers.length})
        </span>
      </h3>

      <div className="space-y-2">
        {connectedUsers.map((user) => (
          <div
            key={user.id}
            className={`p-2 rounded-lg border ${
              user.id === currentUser?.id
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {user.nickname}
                  {user.id === currentUser?.id && ' (You)'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {getRoleIcon(user.role)}
                {currentUser?.role === UserRole.Creator && user.id !== currentUser?.id && (
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
        ))}
      </div>

      {connectedUsers.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          No users connected
        </div>
      )}
    </div>
  );
};

export default UsersPanel;
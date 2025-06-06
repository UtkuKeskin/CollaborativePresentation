import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Presentation, Users, LogOut, Home } from 'lucide-react';
import { RootState, AppDispatch } from '../../store';
import { resetPresentation } from '../../store/presentationSlice';
import { resetUser } from '../../store/userSlice';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const currentPresentation = useSelector((state: RootState) => state.presentation.currentPresentation);
  const connectedUsers = useSelector((state: RootState) => state.user.connectedUsers);

  const isInPresentation = location.pathname.includes('/presentation/');
  const isInPresentMode = location.pathname.includes('/present');

  const handleLeavePresentation = () => {
    // TODO: Disconnect from SignalR
    dispatch(resetPresentation());
    dispatch(resetUser());
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 text-gray-900 hover:text-gray-700">
              <Presentation className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-semibold">CollabPresent</span>
            </Link>
            
            {currentPresentation && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-lg font-medium text-gray-700">
                  {currentPresentation.title}
                </span>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isInPresentation && !isInPresentMode && currentUser && (
              <>
                {/* User info */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Logged as:</span>
                  <span className="font-medium text-gray-900">{currentUser.nickname}</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {currentUser.role}
                  </span>
                </div>

                {/* Connected users count */}
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{connectedUsers.length} users</span>
                </div>

                {/* Leave button */}
                <button
                  onClick={handleLeavePresentation}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Leave</span>
                </button>
              </>
            )}

            {!isInPresentation && (
              <Link
                to="/"
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
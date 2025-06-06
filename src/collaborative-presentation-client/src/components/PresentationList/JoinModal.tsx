import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { presentationApi } from '../../services/api';

interface JoinModalProps {
  isOpen: boolean;
  presentationId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const JoinModal: React.FC<JoinModalProps> = ({ isOpen, presentationId, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('Nickname is required');
      return;
    }

    if (nickname.length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }

    if (nickname.length > 50) {
      setError('Nickname must be less than 50 characters');
      return;
    }

    if (!presentationId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await presentationApi.join(presentationId, { nickname: nickname.trim() });
      onSuccess();
      navigate(`/presentation/${presentationId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join presentation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNickname('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !presentationId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Join Presentation</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="join-nickname" className="block text-sm font-medium text-gray-700 mb-1">
              Your Nickname
            </label>
            <input
              id="join-nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError(null);
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your nickname"
              disabled={isSubmitting}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              This is how other participants will see you in the presentation.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinModal;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { presentationApi } from '../../services/api';
import { CreatePresentationDto } from '../../types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreatePresentationDto>({
    title: '',
    creatorNickname: '',
  });
  const [errors, setErrors] = useState<Partial<CreatePresentationDto>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreatePresentationDto> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.creatorNickname.trim()) {
      newErrors.creatorNickname = 'Nickname is required';
    } else if (formData.creatorNickname.length < 2) {
      newErrors.creatorNickname = 'Nickname must be at least 2 characters';
    } else if (formData.creatorNickname.length > 50) {
      newErrors.creatorNickname = 'Nickname must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const presentation = await presentationApi.create(formData);
      onSuccess();
      
      await presentationApi.join(presentation.id, {
        nickname: formData.creatorNickname,
      });
      
      navigate(`/presentation/${presentation.id}`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to create presentation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ title: '', creatorNickname: '' });
      setErrors({});
      setApiError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New Presentation</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {apiError}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Presentation Title
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter presentation title"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              Your Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={formData.creatorNickname}
              onChange={(e) => setFormData({ ...formData, creatorNickname: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.creatorNickname ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your nickname"
              disabled={isSubmitting}
            />
            {errors.creatorNickname && (
              <p className="mt-1 text-sm text-red-600">{errors.creatorNickname}</p>
            )}
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
              {isSubmitting ? 'Creating...' : 'Create & Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateModal;
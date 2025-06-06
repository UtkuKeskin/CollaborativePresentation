import React, { useState, useEffect } from 'react';
import PresentationTable from './PresentationTable';
import CreateModal from './CreateModal';
import JoinModal from './JoinModal';
import { presentationApi } from '../../services/api';
import { PresentationListDto } from '../../types';
import { Plus, Loader2 } from 'lucide-react';

const PresentationList: React.FC = () => {
  const [presentations, setPresentations] = useState<PresentationListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedPresentationId, setSelectedPresentationId] = useState<string | null>(null);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      const data = await presentationApi.getAll();
      setPresentations(data);
      setError(null);
    } catch (err) {
      setError('Failed to load presentations. Please try again.');
      console.error('Error loading presentations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = (presentationId: string) => {
    setSelectedPresentationId(presentationId);
    setIsJoinModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    loadPresentations();
  };

  const handleJoinSuccess = () => {
    setIsJoinModalOpen(false);
    setSelectedPresentationId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadPresentations}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Presentations</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-5 h-5" />
            <span>Create New</span>
          </button>
        </div>

        <PresentationTable
          presentations={presentations}
          onJoinClick={handleJoinClick}
        />
      </div>

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <JoinModal
        isOpen={isJoinModalOpen}
        presentationId={selectedPresentationId}
        onClose={() => {
          setIsJoinModalOpen(false);
          setSelectedPresentationId(null);
        }}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
};

export default PresentationList;
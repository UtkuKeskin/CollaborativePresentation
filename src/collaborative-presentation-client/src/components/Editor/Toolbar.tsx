import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Type, Square, Circle, Image, Presentation } from 'lucide-react';

const Toolbar: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handlePresentClick = () => {
    if (id) {
      navigate(`/presentation/${id}/present`);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center space-x-2">
        <button className="p-2 hover:bg-gray-100 rounded-md" title="Text">
          <Type className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-md" title="Rectangle">
          <Square className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-md" title="Circle">
          <Circle className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-md" title="Image">
          <Image className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <button 
          onClick={handlePresentClick}
          className="p-2 hover:bg-gray-100 rounded-md flex items-center gap-2 text-sm font-medium" 
          title="Start Presentation (F5)"
        >
          <Presentation className="w-5 h-5" />
          <span>Present</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
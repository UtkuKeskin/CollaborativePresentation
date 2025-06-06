import React from 'react';
import { Type, Square, Circle, Image, Presentation } from 'lucide-react';

const Toolbar: React.FC = () => {
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
        <button className="p-2 hover:bg-gray-100 rounded-md" title="Present">
          <Presentation className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
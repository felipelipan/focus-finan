import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};

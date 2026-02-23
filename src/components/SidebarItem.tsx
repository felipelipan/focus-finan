import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};

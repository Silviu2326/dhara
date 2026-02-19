import React from 'react';
import { Edit2 } from 'lucide-react';

const SectionEditButton = ({
  isEditing,
  sectionName,
  onToggleEdit,
  className = "",
  size = "sm"
}) => {
  if (isEditing) return null;

  return (
    <button
      onClick={() => onToggleEdit(sectionName)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-${size} text-sage hover:text-sage/80
                 hover:bg-sage/10 rounded-lg transition-colors ${className}`}
      title={`Editar ${sectionName}`}
    >
      <Edit2 className={`h-${size === 'sm' ? '4' : '5'} w-${size === 'sm' ? '4' : '5'}`} />
      Editar
    </button>
  );
};

export { SectionEditButton };
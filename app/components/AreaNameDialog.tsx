'use client';

import { useState } from 'react';
import { UI_STRINGS, TOOLTIPS, VALIDATION_MESSAGES, ICONS } from '@/app/lib/constants';

interface AreaNameDialogProps {
  isOpen: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
  defaultName?: string;
}

export default function AreaNameDialog({ isOpen, onSave, onCancel, defaultName = '' }: AreaNameDialogProps) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError(VALIDATION_MESSAGES.AREA_NAME_REQUIRED);
      return;
    }
    
    if (trimmedName.length > 100) {
      setError(VALIDATION_MESSAGES.AREA_NAME_TOO_LONG);
      return;
    }
    
    onSave(trimmedName);
    setName('');
    setError('');
  };

  const handleCancel = () => {
    setName('');
    setError('');
    onCancel();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <span className="text-xl mr-2">{ICONS.EDIT}</span>
          <h3 className="text-lg font-semibold">{UI_STRINGS.CUSTOM_AREAS.ENTER_AREA_NAME}</h3>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder={UI_STRINGS.CUSTOM_AREAS.AREA_NAME_PLACEHOLDER}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyPress}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            autoFocus
            maxLength={100}
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {name.length}/100 characters
          </p>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title={TOOLTIPS.BUTTONS.CANCEL}
          >
            {UI_STRINGS.BUTTONS.CANCEL}
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={TOOLTIPS.BUTTONS.SAVE}
          >
            {UI_STRINGS.BUTTONS.SAVE}
          </button>
        </div>
      </div>
    </div>
  );
}
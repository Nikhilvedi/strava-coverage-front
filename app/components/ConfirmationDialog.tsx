'use client';

import { UI_STRINGS, TOOLTIPS, ICONS } from '@/app/lib/constants';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = UI_STRINGS.BUTTONS.CONFIRM,
  cancelText = UI_STRINGS.BUTTONS.CANCEL,
  isDestructive = false
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onKeyDown={handleKeyPress}>
        <div className="flex items-center mb-4">
          <span className="text-xl mr-2">
            {isDestructive ? ICONS.WARNING : ICONS.INFO}
          </span>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600">{message}</p>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title={TOOLTIPS.BUTTONS.CANCEL}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            title={TOOLTIPS.BUTTONS.CONFIRM}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
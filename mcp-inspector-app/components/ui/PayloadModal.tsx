'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { JSONPayloadView } from '../lanes/JSONPayloadView';

/**
 * PayloadModal Component
 *
 * Full-screen modal for viewing JSON payloads with more space.
 * Provides a better viewing experience than inline expansion in narrow columns.
 *
 * Features:
 * - Full-screen overlay with centered dialog
 * - 80% viewport width (max 1200px)
 * - Click overlay or close button to dismiss
 * - ESC key to close
 * - Horizontal scroll for long lines
 */

interface PayloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: object;
  title: string;
}

export function PayloadModal({ isOpen, onClose, payload, title }: PayloadModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      {/* Modal Dialog */}
      <div
        className="bg-white rounded-lg shadow-2xl w-[80%] max-w-[1200px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 font-mono">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none px-2"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <JSONPayloadView payload={payload} />
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Press ESC or click outside to close
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * XState-Powered Modal Component
 *
 * This modal component uses XState for state management, providing
 * smooth animations, proper state transitions, and robust error handling.
 * It can be used as a drop-in replacement for the basic Modal component.
 */

import React from 'react';
import { useMachine } from '@xstate/react';
import { modalMachine } from '../../machines/modal.machine';

interface ModalXStateProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  isSubmitting?: boolean;
  error?: string;
  onClearError?: () => void;
}

export const ModalXState: React.FC<ModalXStateProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  isSubmitting = false,
  error,
  onClearError,
}) => {
  const [modalState, modalSend] = useMachine(modalMachine);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Sync external modal state with internal XState
  React.useEffect(() => {
    if (isOpen && !modalState.context.isVisible) {
      modalSend({ type: 'OPEN' });
    } else if (!isOpen && modalState.context.isVisible) {
      modalSend({ type: 'CLOSE' });
    }
  }, [isOpen, modalState.context.isVisible, modalSend]);

  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape || !modalState.context.isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        modalSend({ type: 'CLOSE' });
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modalState.context.isVisible, closeOnEscape, isSubmitting, modalSend, onClose]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget && !isSubmitting) {
      modalSend({ type: 'CLOSE' });
      onClose();
    }
  };

  // Handle close button click
  const handleCloseClick = () => {
    if (!isSubmitting) {
      modalSend({ type: 'CLOSE' });
      onClose();
    }
  };

  // Don't render if not visible
  if (!modalState.context.isVisible) return null;

  // Determine modal state classes for animations
  const isOpening = modalState.matches('opening');
  const isClosing = modalState.matches('closing');
  const isSubmittingState = modalState.matches('submitting') || isSubmitting;

  const overlayClasses = `
    fixed inset-0 z-50 overflow-y-auto transition-opacity duration-200
    ${isOpening ? 'opacity-0' : 'opacity-100'}
    ${isClosing ? 'opacity-0' : 'opacity-100'}
  `;

  const modalClasses = `
    inline-block w-full ${sizeClasses[size]} transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all duration-200 sm:my-8 sm:p-6 sm:align-middle
    ${isOpening ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
    ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
    ${isSubmittingState ? 'pointer-events-none' : ''}
  `;

  return (
    <div className={overlayClasses}>
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity duration-200 ${
            isOpening || isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleOverlayClick}
        />

        {/* Modal panel */}
        <div className={modalClasses}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              {isSubmittingState && (
                <div className="ml-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Processing...</span>
                </div>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={handleCloseClick}
                disabled={isSubmittingState}
                className={`rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSubmittingState ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Global Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex justify-between items-start">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                {onClearError && (
                  <button
                    type="button"
                    onClick={onClearError}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className={isSubmittingState ? 'opacity-70' : ''}>{children}</div>
        </div>
      </div>
    </div>
  );
};

// Export as default for backward compatibility
export default ModalXState;
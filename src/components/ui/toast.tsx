'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);
  if (!context) return null;
  
  const { toasts, removeToast } = context;

  return (
    <div className="fixed top-4 inset-x-4 sm:top-4 sm:right-4 sm:left-auto z-50 space-y-2 max-w-sm sm:max-w-sm mx-auto sm:mx-0">
      {toasts.map(toast => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onClose={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'error': return 'border-red-200 bg-red-50 text-red-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
        border rounded-lg p-3 sm:p-4 shadow-lg backdrop-blur-sm mx-2 sm:mx-0
        ${getColorClasses()}
      `}
    >
      <div className="flex items-start space-x-2 sm:space-x-3">
        <span className="text-base sm:text-lg flex-shrink-0">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{toast.title}</h4>
          {toast.description && (
            <p className="text-xs sm:text-sm opacity-90 mt-1">{toast.description}</p>
          )}
        </div>
        <button 
          onClick={handleClose}
          className="flex-shrink-0 text-lg sm:text-xl hover:opacity-70 transition-opacity p-1"
        >
          ×
        </button>
      </div>
      
      {toast.action && (
        <div className="mt-2 sm:mt-3">
          <button
            onClick={toast.action.onClick}
            className="text-xs sm:text-sm font-medium underline hover:no-underline transition-all"
          >
            {toast.action.label}
          </button>
        </div>
      )}
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

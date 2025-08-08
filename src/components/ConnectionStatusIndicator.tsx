/**
 * @fileoverview Connection Status Indicator Component
 * 
 * This component shows the current connection status, offline mode,
 * and sync status for responses and gradebook integration.
 */

import React, { useState, useEffect } from 'react';
import { EnhancedResponseHandler } from '@/lib/services/enhanced-response-handler';

interface ConnectionStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

interface ConnectionStatus {
  isOnline: boolean;
  pendingResponses: number;
  pendingBatches: number;
  lastSyncAttempt?: number;
  syncInProgress: boolean;
}

export function ConnectionStatusIndicator({
  className = '',
  showDetails = false
}: ConnectionStatusIndicatorProps) {
  
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    pendingResponses: 0,
    pendingBatches: 0,
    syncInProgress: false
  });

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const offlineStats = EnhancedResponseHandler.getOfflineStats();
      setStatus({
        isOnline: navigator.onLine,
        pendingResponses: offlineStats.pendingResponses,
        pendingBatches: offlineStats.pendingBatches,
        lastSyncAttempt: offlineStats.lastSyncAttempt,
        syncInProgress: offlineStats.syncInProgress
      });
    };

    // Update status immediately
    updateStatus();

    // Set up event listeners
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update status periodically
    const interval = setInterval(updateStatus, 5000); // Every 5 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const getStatusInfo = () => {
    if (status.isOnline) {
      if (status.syncInProgress) {
        return {
          icon: '🔄',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          message: 'Syncing responses...',
          status: 'syncing'
        };
      } else if (status.pendingResponses > 0) {
        return {
          icon: '⏳',
          color: 'text-orange-600 bg-orange-50 border-orange-200',
          message: `${status.pendingResponses} responses pending sync`,
          status: 'pending'
        };
      } else {
        return {
          icon: '🟢',
          color: 'text-green-600 bg-green-50 border-green-200',
          message: 'Connected and synced',
          status: 'connected'
        };
      }
    } else {
      return {
        icon: '📱',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        message: 'Offline mode - responses saved locally',
        status: 'offline'
      };
    }
  };

  const handleManualSync = async () => {
    if (!status.isOnline || status.syncInProgress) return;

    try {
      await EnhancedResponseHandler.syncOfflineResponses();
      
      // Update status after sync
      const offlineStats = EnhancedResponseHandler.getOfflineStats();
      setStatus(prev => ({
        ...prev,
        pendingResponses: offlineStats.pendingResponses,
        pendingBatches: offlineStats.pendingBatches,
        lastSyncAttempt: offlineStats.lastSyncAttempt,
        syncInProgress: offlineStats.syncInProgress
      }));

    } catch (error) {
      console.error('❌ Manual sync failed:', error);
    }
  };

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return 'Over a day ago';
  };

  const statusInfo = getStatusInfo();

  if (!showDetails) {
    // Compact indicator
    return (
      <div 
        className={`
          relative inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm
          ${statusInfo.color} ${className}
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-lg">{statusInfo.icon}</span>
        <span className="font-medium">{statusInfo.status}</span>
        
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50">
            {statusInfo.message}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    );
  }

  // Detailed status panel
  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-lg">{statusInfo.icon}</span>
          Connection Status
        </h3>
        
        {status.isOnline && status.pendingResponses > 0 && !status.syncInProgress && (
          <button
            onClick={handleManualSync}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sync Now
          </button>
        )}
      </div>

      <div className={`p-3 rounded-lg border ${statusInfo.color} mb-3`}>
        <div className="font-medium mb-1">{statusInfo.message}</div>
        
        {status.isOnline ? (
          <div className="text-sm opacity-80">
            All responses are automatically saved to the gradebook
          </div>
        ) : (
          <div className="text-sm opacity-80">
            Your progress is saved locally and will sync when connection returns
          </div>
        )}
      </div>

      {/* Detailed statistics */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Connection:</span>
          <span className={status.isOnline ? 'text-green-600' : 'text-gray-600'}>
            {status.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {status.pendingResponses > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Pending responses:</span>
            <span className="text-orange-600">{status.pendingResponses}</span>
          </div>
        )}
        
        {status.pendingBatches > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Pending batches:</span>
            <span className="text-orange-600">{status.pendingBatches}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600">Last sync:</span>
          <span className="text-gray-800">{formatLastSync(status.lastSyncAttempt)}</span>
        </div>
        
        {status.syncInProgress && (
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="text-blue-600 flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Syncing...
            </span>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        {status.isOnline ? (
          'Your responses are automatically saved and synchronized with the gradebook.'
        ) : (
          'Don\'t worry! Your progress is safely stored locally and will be synchronized automatically when your connection returns.'
        )}
      </div>
    </div>
  );
}

/**
 * Compact status badge for navigation bars
 */
export function ConnectionStatusBadge({ className = '' }: { className?: string }) {
  return (
    <ConnectionStatusIndicator 
      className={className}
      showDetails={false}
    />
  );
}

/**
 * Full status panel for settings or debug views
 */
export function ConnectionStatusPanel({ className = '' }: { className?: string }) {
  return (
    <ConnectionStatusIndicator 
      className={className}
      showDetails={true}
    />
  );
}

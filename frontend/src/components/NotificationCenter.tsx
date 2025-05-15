'use client';

import { useState, useEffect } from 'react';
import { Issue } from '../types/Issue';

interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  issue?: Issue;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Simulate receiving notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'error',
        message: 'New critical error detected in src/components/CodeEditor.tsx',
        timestamp: new Date(),
        issue: {
          file: 'src/components/CodeEditor.tsx',
          line: 42,
          column: 10,
          severity: 'error',
          message: 'Unexpected token',
          ruleId: 'no-unexpected-token'
        }
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'info':
        return '🔵';
      default:
        return '⚪';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification Badge */}
      {notifications.length > 0 && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
        >
          {notifications.length}
        </button>
      )}

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div>
                      <p className="font-medium">{notification.message}</p>
                      {notification.issue && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {notification.issue.file}:{notification.issue.line}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

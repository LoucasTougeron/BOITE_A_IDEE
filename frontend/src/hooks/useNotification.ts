import { useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'trophy' | 'level';
  title: string;
  description?: string;
  duration?: number;
}

// Simple notification manager - will integrate with a context/provider
const notificationStack: Notification[] = [];
const listeners: Set<(n: Notification[]) => void> = new Set();

export const addNotification = (notification: Omit<Notification, 'id'>) => {
  const id = Math.random().toString(36).substr(2, 9);
  const fullNotification = { ...notification, id, duration: notification.duration ?? 4000 };
  notificationStack.push(fullNotification);
  listeners.forEach((l) => l([...notificationStack]));

  if (fullNotification.duration > 0) {
    setTimeout(() => {
      const index = notificationStack.findIndex((n) => n.id === id);
      if (index > -1) {
        notificationStack.splice(index, 1);
        listeners.forEach((l) => l([...notificationStack]));
      }
    }, fullNotification.duration);
  }
};

export const useNotification = () => {
  const notify = useCallback((notification: Omit<Notification, 'id'>) => {
    addNotification(notification);
  }, []);

  return { notify };
};

export const subscribeToNotifications = (listener: (n: Notification[]) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

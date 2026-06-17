import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Trophy, Star } from 'lucide-react';
import type { Notification } from '../hooks/useNotification';
import { subscribeToNotifications } from '../hooks/useNotification';

export default function ToastNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    return subscribeToNotifications(setNotifications);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`glass-card p-4 border rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-right-4 duration-300 ${
            notif.type === 'success' ? 'border-emerald-500/30 bg-emerald-50/80' :
            notif.type === 'error' ? 'border-red-500/30 bg-red-50/80' :
            notif.type === 'trophy' ? 'border-yellow-500/30 bg-yellow-50/80' :
            notif.type === 'level' ? 'border-purple-500/30 bg-purple-50/80' :
            'border-blue-500/30 bg-blue-50/80'
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {notif.type === 'success' && <CheckCircle size={18} className="text-emerald-600" />}
              {notif.type === 'error' && <AlertCircle size={18} className="text-red-600" />}
              {notif.type === 'trophy' && <Trophy size={18} className="text-yellow-600" />}
              {notif.type === 'level' && <Star size={18} className="text-purple-600" />}
              {notif.type === 'info' && <Info size={18} className="text-blue-600" />}
              <p className={`font-semibold text-sm ${
                notif.type === 'success' ? 'text-emerald-700' :
                notif.type === 'error' ? 'text-red-700' :
                notif.type === 'trophy' ? 'text-yellow-700' :
                notif.type === 'level' ? 'text-purple-700' :
                'text-blue-700'
              }`}>
                {notif.title}
              </p>
            </div>
            {notif.description && (
              <p className={`text-xs mt-1 ${
                notif.type === 'success' ? 'text-emerald-600' :
                notif.type === 'error' ? 'text-red-600' :
                notif.type === 'trophy' ? 'text-yellow-600' :
                notif.type === 'level' ? 'text-purple-600' :
                'text-blue-600'
              }`}>
                {notif.description}
              </p>
            )}
          </div>
          <button
            onClick={() => subscribeToNotifications(() => {})}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

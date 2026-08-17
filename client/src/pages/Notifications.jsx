import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import NotificationItem from '../components/notifications/NotificationItem';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import * as notificationService from '../services/notification.service';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider flex items-center space-x-3">
            <Bell className="w-6 h-6 text-frost-50" />
            <span>NOTIFICATIONS</span>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-frost-50 text-[#05070D] text-xs font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-secondary text-xs uppercase tracking-wider font-semibold">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAll}
            isLoading={markingAll}
            className="flex items-center space-x-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>MARK ALL READ</span>
          </Button>
        )}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-frost-800/40 rounded-xl animate-pulse border border-frost-50/5" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          iconName="Bell"
          title="NO NOTIFICATIONS"
          message="You're all caught up! Notifications will appear here when you receive a challenge or match update."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

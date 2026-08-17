import React from 'react';
import { Swords, CheckCircle2, ShieldAlert, Award, Bell } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const NotificationItem = ({ notification, onMarkRead }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'CHALLENGE_RECEIVED':
      case 'CHALLENGE_ACCEPTED':
      case 'CHALLENGE_REJECTED':
        return <Swords className="w-4 h-4 text-frost-50" />;
      case 'PAYMENT_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'MATCH_COMPLETED':
        return <Award className="w-4 h-4 text-yellow-400" />;
      default:
        return <Bell className="w-4 h-4 text-[#8A9AAD]" />;
    }
  };

  return (
    <div
      onClick={() => !notification.isRead && onMarkRead(notification._id)}
      className={`p-4 rounded-xl border transition-all duration-300 flex items-start space-x-4 cursor-pointer ${
        notification.isRead
          ? 'bg-frost-800/10 border-frost-50/5 opacity-60 hover:opacity-80'
          : 'bg-frost-800/40 border-frost-50/10 hover:bg-frost-50/5 shadow-[0_0_15px_rgba(139,223,255,0.02)]'
      }`}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${
        notification.isRead ? 'border-frost-50/5 bg-frost-900' : 'border-frost-50/15 bg-frost-800'
      }`}>
        {getIcon()}
      </div>

      {/* Message */}
      <div className="flex-1">
        <p className={`text-sm leading-relaxed ${
          notification.isRead ? 'text-[#8A9AAD]' : 'text-[#F4FBFF] font-medium'
        }`}>
          {notification.message}
        </p>
        <span className="text-[10px] text-secondary/50 block mt-1.5 uppercase font-semibold tracking-wider">
          {formatDate(notification.createdAt)}
        </span>
      </div>

      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="w-2.5 h-2.5 rounded-full bg-frost-50 drop-shadow-[0_0_8px_rgba(139,223,255,0.6)] flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
};

export default NotificationItem;

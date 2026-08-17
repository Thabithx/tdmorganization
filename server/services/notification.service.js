const Notification = require('../models/Notification');

const createNotification = async ({ userId, type, message, relatedEntity = '', relatedId = null }) => {
  return Notification.create({ userId, type, message, relatedEntity, relatedId });
};

const getUserNotifications = async (userId, limit = 30) => {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
};

const markAllAsRead = async (userId) => {
  return Notification.updateMany({ userId, isRead: false }, { isRead: true });
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, isRead: false });
};

module.exports = { createNotification, getUserNotifications, markAsRead, markAllAsRead, getUnreadCount };

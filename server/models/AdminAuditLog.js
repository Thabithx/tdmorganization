const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetEntity: { type: String, default: '' },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  reason: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetId: 1 });
adminAuditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);

require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const User = require('./models/User');

const initializeAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('Admin credentials not fully set in environment variables. Skipping initialization.');
    return;
  }

  try {
    let admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      admin = await User.create({
        username: 'frost_admin',
        email: adminEmail,
        passwordHash: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      });
      console.log(`Admin user created automatically from env: ${adminEmail}`);
    } else {
      let updated = false;
      if (admin.email !== adminEmail.toLowerCase()) {
        admin.email = adminEmail;
        updated = true;
      }
      const isPasswordSame = await admin.comparePassword(adminPassword);
      if (!isPasswordSame) {
        admin.passwordHash = adminPassword; // pre-save hook will hash it
        updated = true;
      }
      if (updated) {
        await admin.save();
        console.log(`Admin credentials updated automatically from env: ${adminEmail}`);
      }
    }
  } catch (err) {
    console.error('Error during admin initialization:', err.message);
  }
};

// Start listening immediately so Render port check passes quickly
server.listen(PORT, '0.0.0.0', () => {
  console.log(`FROST Server running on 0.0.0.0:${PORT}`);
});

// Auto-expiration job for challenges (72 hours deadline)
const expireChallengesJob = async () => {
  try {
    const Challenge = require('./models/Challenge');
    const Notification = require('./models/Notification');
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const expiredChallenges = await Challenge.find({
      status: 'PENDING',
      createdAt: { $lt: seventyTwoHoursAgo }
    }).populate('challengerId defenderId');

    for (const challenge of expiredChallenges) {
      challenge.status = 'EXPIRED';
      await challenge.save();

      if (challenge.challengerId && challenge.challengerId.userId) {
        await Notification.create({
          userId: challenge.challengerId.userId,
          type: 'CHALLENGE_EXPIRED',
          message: `Your challenge to ${challenge.defenderId?.ign || 'defender'} has expired without response.`,
          relatedEntity: 'Challenge',
          relatedId: challenge._id
        });
      }
      if (challenge.defenderId && challenge.defenderId.userId) {
        await Notification.create({
          userId: challenge.defenderId.userId,
          type: 'CHALLENGE_EXPIRED',
          message: `The challenge from ${challenge.challengerId?.ign || 'challenger'} has expired. This counts as a decline.`,
          relatedEntity: 'Challenge',
          relatedId: challenge._id
        });
      }
    }
  } catch (err) {
    console.error('Error running expireChallengesJob:', err.message);
  }
};

// Connect DB asynchronously
connectDB().then(async () => {
  console.log('Database connected successfully.');
  await initializeAdmin();
  expireChallengesJob();
  setInterval(expireChallengesJob, 5 * 60 * 1000);
}).catch(err => {
  console.error('Failed to connect to DB on startup:', err.message);
});

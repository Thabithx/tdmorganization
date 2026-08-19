/**
 * emailWhatsappRequest.js
 * Emails all registered (non-admin) players asking them to send their WhatsApp number.
 *
 * SETUP BEFORE RUNNING:
 *   1. Set GMAIL_USER and GMAIL_APP_PASS below (or in .env)
 *   2. Run: node scripts/emailWhatsappRequest.js
 *
 * To get a Gmail App Password:
 *   → myaccount.google.com → Security → 2-Step Verification → App Passwords
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const GMAIL_USER     = process.env.GMAIL_USER;      // e.g. yourname@gmail.com
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS;  // 16-char App Password
const YOUR_WHATSAPP  = process.env.YOUR_WHATSAPP || '+94XXXXXXXXX'; // your number
// ───────────────────────────────────────────────────────────────────────────

async function run() {
  if (!GMAIL_USER || !GMAIL_APP_PASS) {
    console.error('❌  Set GMAIL_USER and GMAIL_APP_PASS in your .env file first.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB');

  const players = await User.find({ role: 'PLAYER' }).select('email username');
  console.log(`📋  Found ${players.length} player(s) to email\n`);

  if (players.length === 0) {
    console.log('No players found. Exiting.');
    await mongoose.disconnect();
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASS },
  });

  let sent = 0, failed = 0;

  for (const player of players) {
    const mailOptions = {
      from: `FROST Organization <${GMAIL_USER}>`,
      to: player.email,
      subject: '❄️ FROST — Please Send Us Your WhatsApp Number',
      html: `
        <div style="font-family: Arial, sans-serif; background: #040810; color: #F4FBFF; padding: 32px; border-radius: 12px; max-width: 560px; margin: auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #8BE3FF; font-size: 28px; letter-spacing: 6px; margin: 0;">❄️ FROST</h1>
            <p style="color: #4A5D6E; font-size: 11px; letter-spacing: 3px; margin: 4px 0 0;">COMPETITIVE NETWORK</p>
          </div>

          <p style="color: #F4FBFF; font-size: 15px;">Hey <strong>${player.username || 'Player'}</strong>,</p>

          <p style="color: #8A9AAD; font-size: 14px; line-height: 1.7;">
            You're registered on the <strong style="color:#8BE3FF;">FROST Organization</strong> platform. 
            We've recently updated our system and now require a <strong style="color:#F4FBFF;">WhatsApp number</strong> 
            from every member so we can coordinate matches, announce results, and keep you updated.
          </p>

          <div style="background: #0B101A; border: 1px solid #1A2A3A; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="color: #4A5D6E; font-size: 12px; letter-spacing: 2px; margin: 0 0 8px; text-transform: uppercase;">Send your WhatsApp number to</p>
            <a href="https://wa.me/${YOUR_WHATSAPP.replace(/\D/g, '')}" 
               style="color: #8BE3FF; font-size: 20px; font-weight: bold; text-decoration: none;">
              ${YOUR_WHATSAPP}
            </a>
            <p style="color: #4A5D6E; font-size: 12px; margin: 8px 0 0;">Message us on WhatsApp with your IGN</p>
          </div>

          <p style="color: #8A9AAD; font-size: 13px; line-height: 1.7;">
            Simply send us a WhatsApp message with:<br/>
            <strong style="color:#F4FBFF;">Your IGN + WhatsApp Number</strong>
          </p>

          <p style="color: #8A9AAD; font-size: 13px; line-height: 1.7;">
            Stay tuned — the FROST TDM ranking and challenge system is coming soon. 
            Your journey starts here. ❄️
          </p>

          <hr style="border: none; border-top: 1px solid #1A2A3A; margin: 24px 0;" />
          <p style="color: #2A3D4E; font-size: 11px; text-align: center; letter-spacing: 2px; text-transform: uppercase;">
            © FROST COMPETITIVE NETWORK
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`  ✅  Sent to ${player.email}`);
      sent++;
    } catch (err) {
      console.log(`  ❌  Failed for ${player.email}: ${err.message}`);
      failed++;
    }

    // Small delay to avoid Gmail rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n🎉  Done! Sent: ${sent}  |  Failed: ${failed}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

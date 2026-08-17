import React from 'react';
import { ShieldAlert, Camera, Smartphone, Monitor, Swords, Ban, Trophy, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import Card from '../components/ui/Card';

const Section = ({ icon: Icon, title, color = 'frost-50', children }) => (
  <Card variant="elevated" className="overflow-hidden border-frost-50/10">
    <div className={`px-6 py-4 border-b border-frost-50/10 flex items-center space-x-3 bg-frost-800/40`}>
      <div className={`w-8 h-8 rounded-lg bg-frost-700/60 flex items-center justify-center`}>
        <Icon className={`w-4 h-4 text-${color}`} />
      </div>
      <h2 className={`font-heading font-bold uppercase tracking-widest text-${color} text-sm`}>{title}</h2>
    </div>
    <div className="px-6 py-5 space-y-3">{children}</div>
  </Card>
);

const Rule = ({ icon: Icon, text, type = 'default' }) => {
  const colors = {
    required: 'text-amber-300',
    banned: 'text-red-400',
    good: 'text-emerald-400',
    default: 'text-secondary',
    warning: 'text-orange-400',
  };
  const icons = {
    required: CheckCircle,
    banned: XCircle,
    good: CheckCircle,
    default: Info,
    warning: AlertTriangle,
  };
  const IconComp = Icon || icons[type];
  return (
    <div className="flex items-start space-x-3 py-1.5">
      <IconComp className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors[type]}`} />
      <p className="text-sm text-[#F4FBFF]/80 leading-relaxed">{text}</p>
    </div>
  );
};

const ChallengeRules = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-frost-700/40 border border-frost-50/10">
          <Swords className="w-4 h-4 text-frost-50" />
          <span className="text-frost-50 text-xs font-heading uppercase tracking-widest font-bold">FROST TDM Network</span>
        </div>
        <h1 className="text-4xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider leading-tight">
          Challenge Rules &<br />
          <span className="text-frost-50">Match Protocol</span>
        </h1>
        <p className="text-secondary text-sm max-w-xl mx-auto leading-relaxed">
          All challenges conducted through FROST must follow these rules. Violating any of these rules may result in penalties, match disqualification, or a permanent ban.
        </p>
      </div>

      {/* Pre-Match Evidence Requirements */}
      <Section icon={Camera} title="Pre-Match Evidence Requirements" color="frost-50">
        <p className="text-secondary text-xs uppercase tracking-widest font-semibold mb-3">Both players must provide the following BEFORE the match begins:</p>
        <Rule type="required" text="Screenshot of your in-game controls layout. Your control setup must be clearly visible." />
        <Rule type="required" text="Show all currently open apps on your device before entering the match room. This ensures no third-party tools, macros, or assist apps are running." />
        <Rule type="required" text="Open PUBG Mobile directly from the Google Play Store or Apple App Store and show the app page (to confirm the official, unmodified version is installed)." />
        <Rule type="required" text="Screen recording of the entire match must be submitted to the FROST admin after the match. Recordings will be shared with both players." />
      </Section>

      {/* Gameplay Rules */}
      <Section icon={Swords} title="Gameplay Rules" color="amber-400">
        <Rule type="warning" text="No tap-fire (automatic fire using tap): Using tap-fire is a minus point and will be noted by the admin in the match record." />
        <Rule type="banned" text="No grenades allowed during the match. Any grenade usage is grounds for admin intervention." />
        <Rule type="banned" text="No sliding allowed. Players must engage standing or crouched. Slide abuse is a foul." />
        <Rule type="banned" text="Camping / staying in a single position for too long without changing positions is a violation. Admin will make a final decision if reported. Keep it dynamic." />
        <Rule type="good" text="Respect your opponent. Play fair, play aggressive, and play to win." />
        <Rule type="good" text="Follow all official TDM community rules and code of conduct at all times." />
        <Rule type="good" text="Have a good game — FROST is about proving skill, not exploiting loopholes." />
      </Section>

      {/* Screen Recording */}
      <Section icon={Monitor} title="Screen Recording Protocol" color="emerald-400">
        <Rule type="required" text="Both the challenger and the opponent must record their full match screen from start to finish." />
        <Rule type="required" text="Recordings must be submitted to the FROST admin immediately after the match ends." />
        <Rule type="default" text="FROST admin will review the recordings before confirming the match result. Results will not be finalized without verified recordings." />
        <Rule type="default" text="Recordings are shared with both players for transparency. All data is stored securely." />
        <Rule type="good" text="Tip: Use your device's built-in screen recorder. Make sure audio is on for verification." />
      </Section>

      {/* Device Verification */}
      <Section icon={Smartphone} title="Device & App Verification" color="sky-400">
        <Rule type="required" text="Before entering the room, show all background apps open on your device. Close any suspicious third-party apps." />
        <Rule type="required" text="Show that PUBG Mobile is opened directly from the official app store listing, confirming it's the unmodified official version." />
        <Rule type="warning" text="Any unknown or suspicious apps visible during device verification will be flagged and reviewed by admin." />
        <Rule type="default" text="Device screenshots/recordings of the verification step must be submitted along with your match recording." />
      </Section>

      {/* Violations & Bans */}
      <Section icon={Ban} title="Violations & Penalties" color="red-400">
        <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 mb-4">
          <p className="text-red-300 text-xs font-heading font-bold uppercase tracking-widest text-center">⚠️ ZERO TOLERANCE POLICY ⚠️</p>
        </div>
        <Rule type="banned" text="Discovering any form of cheating, hacking, modded APKs, aim assist tools, or malicious activities will result in an IMMEDIATE LIFETIME BAN from FROST." />
        <Rule type="banned" text="Providing false or fabricated evidence (screenshots, recordings) will result in a permanent ban." />
        <Rule type="banned" text="Match manipulation, collusion with your opponent, or throwing a match is a bannable offense." />
        <Rule type="banned" text="Harassment of other players, admins, or staff will not be tolerated and may result in suspension." />
        <Rule type="warning" text="Admin decisions on match results are final. Appeals may be submitted within 24 hours with supporting evidence." />
        <Rule type="warning" text="Repeated minor violations (tap-fire, camping) will accumulate and may escalate to suspension." />
      </Section>

      {/* Fair Play */}
      <Section icon={Trophy} title="FROST Code of Fair Play" color="amber-300">
        <Rule type="good" text="Come to every challenge prepared — warm up, check your controls, and be ready to fight." />
        <Rule type="good" text="Win with dignity. Lose with respect. Every match is an opportunity to improve." />
        <Rule type="good" text="The FROST leaderboard is earned through skill and integrity. Protect that integrity." />
        <Rule type="good" text="If you witness rule violations by your opponent, report them to admin immediately with evidence." />
        <Rule type="default" text="FROST admins manually manage and verify every match. If you have concerns, contact admin through the platform." />
      </Section>

      {/* Admin Contact */}
      <Card variant="default" className="p-5 border-frost-50/10 bg-gradient-to-r from-frost-700/20 to-transparent text-center space-y-2">
        <ShieldAlert className="w-6 h-6 text-frost-50 mx-auto" />
        <h3 className="font-heading font-bold text-[#F4FBFF] uppercase tracking-wide text-sm">Questions or Reports?</h3>
        <p className="text-secondary text-xs leading-relaxed">
          Contact the FROST administrator through the challenge dashboard or reach out directly.<br />
          Admin manages all match verifications, results, and disputes.
        </p>
      </Card>

    </div>
  );
};

export default ChallengeRules;

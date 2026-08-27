import React from 'react';
import { ShieldAlert, Camera, Smartphone, Monitor, Swords, Ban, Trophy, AlertTriangle, CheckCircle, XCircle, Info, Mic, Server } from 'lucide-react';
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
          All challenges conducted through FROST must strictly adhere to these regulations. Failure to follow recording format or in-game rules will lead to immediate disqualification.
        </p>
      </div>

      {/* Recording & App Verification Protocol */}
      <Section icon={Camera} title="Recording & Verification Protocol" color="frost-50">
        <p className="text-secondary text-xs uppercase tracking-widest font-semibold mb-3">Recording format is mandatory for both players:</p>
        <Rule type="required" text="Players must submit a full Screen Recording (SR). Handcam is NOT required." />
        <Rule type="required" text="Right after the match ID and Password are given, you must start the Screen Recording immediately." />
        <Rule type="required" text="During the verification stage of your recording, you must show the battery usage apps list and show the VPN connection status/settings." />
        <Rule type="required" text="Before joining the room, you must open your mobile settings, navigate to 'Apps', and scroll through to show all apps installed in your device." />
        <Rule type="banned" text="Any suspicious or illegal apps found installed on the device will lead to instant disqualification." />
        <Rule type="required" text="After showing installed apps, you must open PUBG Mobile directly via the official App Store (App Store or Play Store), then enter the room." />
        <Rule type="warning" text="Important: Not accurately following these recording and startup verification formats will lead to direct disqualification." />
      </Section>

      {/* Gameplay Rules */}
      <Section icon={Swords} title="1v1 Gameplay Rules" color="amber-400">
        <p className="text-secondary text-xs uppercase tracking-widest font-semibold mb-3">Official TDM 1v1 Battle Rules:</p>
        <Rule type="banned" text="Strictly NO grenades or stun grenades allowed during the match." />
        <Rule type="banned" text="Slide must be turned OFF (Slide off only)." />
        <Rule type="warning" text="Only M416 weapon is allowed. Fisting is allowed but not recommended." />
        <Rule type="warning" text="Hold-in Time (Camping): Staying in one place for more than 25 seconds is strictly prohibited." />
        <Rule type="banned" text="No tap-fire (automatic firing using tap triggers or macros) and no info-sharing/unauthorized assists. Violating this will lead to a penalty of minus kills (- kills)." />
        <Rule type="good" text="Always have respect for your opponent and have a good game." />
      </Section>

      {/* Communication Rules */}
      <Section icon={Mic} title="Communication" color="sky-400">
        <Rule type="required" text="Open Mic Rule: If your opponent requests you to open your mic and talk during the match, you must comply and talk." />
      </Section>

      {/* Room Server Creation Rules */}
      <Section icon={Server} title="Server & Room Creation (Ping Fairness)" color="emerald-400">
        <p className="text-secondary text-xs uppercase tracking-widest font-semibold mb-3">To ensure a fair play experience for cross-regional matches, rooms will be created as follows (BO3):</p>
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-frost-800/40 border border-frost-50/5 space-y-2">
            <h4 className="text-sm font-heading font-bold text-frost-50 uppercase">Asia vs Europe</h4>
            <p className="text-xs text-secondary">Room 1: Asia Server · Room 2: Europe Server · Room 3: Asia Server</p>
          </div>
          <div className="p-4 rounded-xl bg-frost-800/40 border border-frost-50/5 space-y-2">
            <h4 className="text-sm font-heading font-bold text-frost-50 uppercase">Asia vs North America</h4>
            <p className="text-xs text-secondary">Room 1: Asia Server · Room 2: North America Server · Room 3: Europe Server</p>
          </div>
          <div className="p-4 rounded-xl bg-frost-800/40 border border-frost-50/5 space-y-2">
            <h4 className="text-sm font-heading font-bold text-frost-50 uppercase">North America vs Europe</h4>
            <p className="text-xs text-secondary">Room 1: Europe Server · Room 2: North America Server · Room 3: Middle East Server</p>
          </div>
        </div>
      </Section>

      {/* Violations & Penalties */}
      <Section icon={Ban} title="Violations & Penalties" color="red-400">
        <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 mb-4">
          <p className="text-red-300 text-xs font-heading font-bold uppercase tracking-widest text-center">⚠️ ZERO TOLERANCE POLICY ⚠️</p>
        </div>
        <Rule type="banned" text="Any form of cheating, hacking, mods, third-party assist tools, or falsified recording submissions will result in an IMMEDIATE LIFETIME BAN from FROST." />
        <Rule type="warning" text="Admin decisions on match results, disputes, and disqualifications are absolute and final." />
      </Section>

      {/* Fair Play */}
      <Section icon={Trophy} title="FROST Code of Fair Play" color="amber-300">
        <Rule type="good" text="Win with dignity. Lose with respect. Every match is an opportunity to improve." />
        <Rule type="good" text="The FROST leaderboard is earned through skill and integrity. Protect that integrity." />
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

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Building2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid-bg">
      <Navbar variant="home" />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-10 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block font-mono text-[10px] text-muted-foreground tracking-[3px] uppercase mb-6 border border-border px-4 py-1.5 rounded-full">
            Strategic Intelligence Platform
          </span>
          <h1 className="text-6xl md:text-7xl font-extrabold leading-[0.95] tracking-tight mb-5">
            Know what's<br /><span className="text-muted-foreground">coming.</span>
          </h1>
          <p className="font-mono text-sm text-muted-foreground mb-16 max-w-md mx-auto leading-relaxed">
            Detect, assess and respond to threats and opportunities before they hit your organization.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[680px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <HomeCard
            icon={<Shield className="w-5 h-5" />}
            label="Platform Admin"
            title="SaaS Administration"
            desc="Create and manage organizations across the platform."
            onClick={() => navigate('/login/platform')}
          />
          <HomeCard
            icon={<Building2 className="w-5 h-5" />}
            label="Company Admin"
            title="Company View"
            desc="Manage your teams and radar elements."
            onClick={() => navigate('/login/company')}
          />
        </motion.div>
      </div>
    </div>
  );
}

interface HomeCardProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  desc: string;
  onClick: () => void;
}

function HomeCard({ icon, label, title, desc, onClick }: HomeCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="group relative bg-card border border-border rounded-2xl px-7 py-8 text-left cursor-pointer transition-colors hover:border-foreground/20"
    >
      <div className="w-10 h-10 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground mb-5">
        {icon}
      </div>
      <div className="font-mono text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">
        {label}
      </div>
      <div className="text-xl font-bold mb-2">{title}</div>
      <div className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-5">{desc}</div>
      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-foreground group-hover:gap-2.5 transition-all">
        Enter <ArrowRight className="w-3 h-3" />
      </div>
    </motion.div>
  );
}

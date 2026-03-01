import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Building2, Radar } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid-bg">
      <Navbar variant="home" />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-10 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 text-primary text-[12px] font-semibold px-4 py-1.5 rounded-full mb-8">
            <Radar className="w-3.5 h-3.5" />
            Strategic Intelligence Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
            Know what's<br /><span className="text-primary">coming.</span>
          </h1>
          <p className="text-base text-muted-foreground mb-0 max-w-lg mx-auto leading-relaxed">
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
            label="Organization Admin"
            title="Organization View"
            desc="Manage your teams and radar elements."
            onClick={() => navigate('/login/organization')}
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
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative bg-card border border-border rounded-xl px-6 py-7 text-left cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-5">
        {icon}
      </div>
      <div className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className="text-lg font-bold mb-1.5">{title}</div>
      <div className="text-[13px] text-muted-foreground leading-relaxed mb-5">{desc}</div>
      <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary group-hover:gap-2.5 transition-all">
        Get Started <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </motion.div>
  );
}

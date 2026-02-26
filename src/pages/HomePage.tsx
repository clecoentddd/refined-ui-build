import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
        >
          <span className="inline-block font-mono text-[11px] text-primary tracking-[3px] uppercase mb-5 bg-primary/8 border border-primary/20 px-3.5 py-1.5 rounded-full">
            Strategic Intelligence Platform
          </span>
          <h1 className="text-6xl md:text-7xl font-extrabold leading-none tracking-tight mb-4">
            Know what's<br /><span className="text-primary">coming</span>
          </h1>
          <p className="font-mono text-sm text-muted-foreground mb-14 max-w-md mx-auto">
            Detect, assess and respond to threats and opportunities before they hit your organization.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-[700px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <HomeCard
            icon="🏛️"
            label="Platform Admin"
            title="SaaS Administration"
            desc="Create and manage organizations across the platform. Provision company accounts and admins."
            cta="Enter as platform admin →"
            variant="primary"
            onClick={() => navigate('/login/platform')}
          />
          <HomeCard
            icon="🏢"
            label="Company Admin"
            title="Company View"
            desc="Manage your teams and radar elements. Track strategic signals across your organization."
            cta="Enter your company →"
            variant="success"
            onClick={() => navigate('/login/company')}
          />
        </motion.div>
      </div>
    </div>
  );
}

interface HomeCardProps {
  icon: string;
  label: string;
  title: string;
  desc: string;
  cta: string;
  variant: 'primary' | 'success';
  onClick: () => void;
}

function HomeCard({ icon, label, title, desc, cta, variant, onClick }: HomeCardProps) {
  const isPrimary = variant === 'primary';
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}
      onClick={onClick}
      className={`relative overflow-hidden bg-card border border-border rounded-2xl px-8 py-9 text-left cursor-pointer shadow-sm transition-colors ${
        isPrimary ? 'hover:border-primary/30' : 'hover:border-success/30'
      }`}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <div className={`font-mono text-[10px] tracking-[2px] uppercase mb-2 ${isPrimary ? 'text-primary' : 'text-success'}`}>
        {label}
      </div>
      <div className="text-xl font-bold mb-2">{title}</div>
      <div className="font-mono text-[11px] text-muted-foreground leading-relaxed">{desc}</div>
      <div className={`inline-flex items-center gap-1.5 mt-5 font-mono text-[11px] font-bold ${isPrimary ? 'text-primary' : 'text-success'}`}>
        {cta}
      </div>
    </motion.div>
  );
}

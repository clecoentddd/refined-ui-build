import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { toast } from 'sonner';
import { LogOut, Radar } from 'lucide-react';

interface NavbarProps {
  variant?: 'home' | 'platform' | 'company';
}

export default function Navbar({ variant = 'home' }: NavbarProps) {
  const navigate = useNavigate();
  const { saas, company, resetSaas, resetCompany } = useAppState();

  const signOut = () => {
    if (variant === 'platform') { resetSaas(); }
    else { resetCompany(); }
    navigate('/');
    toast.success('Signed out');
  };

  return (
    <nav className="flex items-center justify-between px-8 py-3.5 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-2.5 cursor-pointer font-extrabold text-lg tracking-tight" onClick={() => navigate('/')}>
        <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center">
          <Radar className="w-4 h-4" />
        </div>
        <span>STRADAR</span>
      </div>

      <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
        {variant === 'home' && (
          <span className="bg-surface2 border border-border px-3 py-1 rounded-full text-[10px] tracking-widest">
            Strategic Radar
          </span>
        )}
        {variant === 'platform' && (
          <>
            <span className="bg-foreground/5 border border-foreground/10 text-foreground px-3 py-1 rounded-full text-[10px] tracking-widest font-medium">
              PLATFORM
            </span>
            {saas.email && <span className="text-foreground text-[11px]">{saas.email}</span>}
            <button onClick={signOut} className="inline-flex items-center gap-1.5 border border-border bg-card text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all">
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </>
        )}
        {variant === 'company' && (
          <>
            <span className="bg-foreground/5 border border-foreground/10 text-foreground px-3 py-1 rounded-full text-[10px] tracking-widest font-medium">
              {company.orgName || 'COMPANY'}
            </span>
            {company.email && <span className="text-foreground text-[11px]">{company.email}</span>}
            <button onClick={signOut} className="inline-flex items-center gap-1.5 border border-border bg-card text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all">
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

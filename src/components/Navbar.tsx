import { useNavigate, useLocation } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { toast } from 'sonner';

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
    <nav className="flex items-center justify-between px-10 py-4 border-b border-border bg-card/92 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2.5 cursor-pointer font-extrabold text-xl tracking-tight" onClick={() => navigate('/')}>
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-sm font-extrabold shadow-md">
          S
        </div>
        STRADAR
      </div>

      <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
        {variant === 'home' && (
          <span className="bg-surface2 border border-border-strong px-3 py-1 rounded-full text-[10px] tracking-widest">
            Strategic Radar
          </span>
        )}
        {variant === 'platform' && (
          <>
            <span className="bg-primary/10 border border-primary/30 text-primary px-3 py-1 rounded-full text-[10px] tracking-widest font-medium">
              PLATFORM ADMIN
            </span>
            {saas.email && <span className="text-foreground">{saas.email}</span>}
            <button onClick={signOut} className="border border-border-strong bg-card text-muted-foreground hover:text-foreground hover:border-primary px-4 py-1.5 rounded-lg text-xs font-semibold transition-all">
              Sign Out
            </button>
          </>
        )}
        {variant === 'company' && (
          <>
            <span className="bg-success/10 border border-success/30 text-success px-3 py-1 rounded-full text-[10px] tracking-widest font-medium">
              {company.orgName || 'COMPANY'}
            </span>
            {company.email && <span className="text-foreground">{company.email}</span>}
            <button onClick={signOut} className="border border-border-strong bg-card text-muted-foreground hover:text-foreground hover:border-primary px-4 py-1.5 rounded-lg text-xs font-semibold transition-all">
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

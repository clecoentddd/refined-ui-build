import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { toast } from 'sonner';
import { LogOut, Radar } from 'lucide-react';

interface NavbarProps {
  variant?: 'home' | 'platform' | 'organization';
}

export default function Navbar({ variant = 'home' }: NavbarProps) {
  const navigate = useNavigate();
  const { saas, organization, resetSaas, resetOrganization } = useAppState();

  const signOut = () => {
    if (variant === 'platform') { resetSaas(); }
    else { resetOrganization(); }
    navigate('/');
    toast.success('Signed out');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-2.5 cursor-pointer font-bold text-base tracking-tight" onClick={() => navigate('/')}>
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
          <Radar className="w-4 h-4" />
        </div>
        <span>STRADAR</span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {variant === 'home' && (
          <span className="text-muted-foreground text-[12px]">
            Strategic Radar Platform
          </span>
        )}
        {variant === 'platform' && (
          <>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-[11px] font-semibold tracking-wide">
              PLATFORM
            </span>
            {saas.email && <span className="text-muted-foreground text-[12px]">{saas.email}</span>}
            <button onClick={signOut} className="inline-flex items-center gap-1.5 border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </>
        )}
        {variant === 'organization' && (
          <>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-[11px] font-semibold tracking-wide">
              {organization.orgName || 'ORGANIZATION'}
            </span>
            {organization.email && <span className="text-muted-foreground text-[12px]">{organization.email}</span>}
            <button onClick={signOut} className="inline-flex items-center gap-1.5 border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

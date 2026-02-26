import React, { createContext, useContext, useState, useCallback } from 'react';

export interface SaasSession {
  sid: string | null;
  adminId: string | null;
  email: string | null;
}

export interface CompanySession {
  sid: string | null;
  email: string | null;
  orgId: string | null;
  orgName: string | null;
  role: string | null;
  adminId: string | null;
}

export interface Organization {
  organizationId: string;
  organizationName: string;
  adminAccountId: string;
}

export interface Team {
  teamId: string;
  organizationId: string;
  name: string;
  purpose?: string;
  context?: string;
  level?: number;
}

export interface RadarElement {
  radarElementId: string;
  radarId?: string;
  teamId?: string;
  title: string;
  type: 'THREAT' | 'OPPORTUNITY';
  category: string;
  distance: string;
  impact: string;
  risk: string;
  assess?: string;
  detect?: string;
  respond?: string;
}

interface AppState {
  saas: SaasSession;
  company: CompanySession;
  orgs: Organization[];
  teams: Team[];
  radarIds: Record<string, string>;
  setSaas: (s: SaasSession) => void;
  setCompany: (c: CompanySession) => void;
  setOrgs: (o: Organization[]) => void;
  setTeams: (t: Team[]) => void;
  setRadarId: (teamId: string, radarId: string) => void;
  setRadarIds: (ids: Record<string, string>) => void;
  resetSaas: () => void;
  resetCompany: () => void;
}

const defaultSaas: SaasSession = { sid: null, adminId: null, email: null };
const defaultCompany: CompanySession = { sid: null, email: null, orgId: null, orgName: null, role: null, adminId: null };

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [saas, setSaas] = useState<SaasSession>(defaultSaas);
  const [company, setCompany] = useState<CompanySession>(defaultCompany);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [radarIds, setRadarIdsState] = useState<Record<string, string>>({});

  const setRadarId = useCallback((teamId: string, radarId: string) => {
    setRadarIdsState(prev => ({ ...prev, [teamId]: radarId }));
  }, []);

  const setRadarIds = useCallback((ids: Record<string, string>) => {
    setRadarIdsState(prev => ({ ...prev, ...ids }));
  }, []);

  const resetSaas = useCallback(() => { setSaas(defaultSaas); setOrgs([]); }, []);
  const resetCompany = useCallback(() => { setCompany(defaultCompany); setTeams([]); }, []);

  return (
    <AppContext.Provider value={{ saas, company, orgs, teams, radarIds, setSaas, setCompany, setOrgs, setTeams, setRadarId, setRadarIds, resetSaas, resetCompany }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

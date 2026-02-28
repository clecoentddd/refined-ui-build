import React, { createContext, useContext, useState, useCallback } from 'react';

export interface SaasSession {
  sid: string | null;
  adminId: string | null;
  email: string | null;
}

export interface OrganizationSession {
  sid: string | null;
  email: string | null;
  orgId: string | null;
  orgName: string | null;
  role: string | null;
  adminId: string | null;
  username: string | null;
  teamId: string | null;
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
  environmentalChangeId: string;
  teamId?: string;
  organizationId?: string;
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
  organization: OrganizationSession;
  orgs: Organization[];
  teams: Team[];
  setSaas: (s: SaasSession) => void;
  setOrganization: (c: OrganizationSession) => void;
  setOrgs: (o: Organization[]) => void;
  setTeams: (t: Team[]) => void;
  resetSaas: () => void;
  resetOrganization: () => void;
}

const defaultSaas: SaasSession = { sid: null, adminId: null, email: null };
const defaultOrganization: OrganizationSession = { sid: null, email: null, orgId: null, orgName: null, role: null, adminId: null, username: null, teamId: null };

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [saas, setSaas] = useState<SaasSession>(defaultSaas);
  const [organization, setOrganization] = useState<OrganizationSession>(defaultOrganization);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);


  const resetSaas = useCallback(() => { setSaas(defaultSaas); setOrgs([]); }, []);
  const resetOrganization = useCallback(() => { setOrganization(defaultOrganization); setTeams([]); }, []);

  return (
    <AppContext.Provider value={{ saas, organization, orgs, teams, setSaas, setOrganization, setOrgs, setTeams, resetSaas, resetOrganization }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

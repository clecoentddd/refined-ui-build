const BASE = 'http://localhost:8080';
export const GENESIS_ADMIN_ID = '00000000-0000-0000-0000-000000000001';

function hdrs(sid?: string, orgId?: string) {
  const token = localStorage.getItem('auth_token');
  const h: any = {
    'Content-Type': 'application/json',
    'X-Session-Id': sid || crypto.randomUUID(),
    'X-Correlation-Id': crypto.randomUUID(),
  };
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (orgId) h['organizationId'] = orgId;
  return h;
}

async function api(url: string, opts: RequestInit & { method?: string } = {}) {
  const method = opts.method || 'GET';
  console.log(`[STRADAR] ▶ ${method} ${BASE + url}`);
  const r = await fetch(BASE + url, opts);
  const t = await r.text();
  let parsed: any;
  try { parsed = t ? JSON.parse(t) : {}; } catch { parsed = t; }
  if (!r.ok) {
    console.error(`[STRADAR] ✗ ${method} ${url} → HTTP ${r.status}`, parsed);
    const errMsg = typeof parsed === 'string'
      ? parsed
      : (parsed?.message || parsed?.error || `HTTP ${r.status}`);
    throw new Error(errMsg);
  }
  console.log(`[STRADAR] ✓ ${method} ${url} → HTTP ${r.status}`, parsed);
  return parsed;
}

export const useAdminApi = {
  async signInAdmin(username: string, sid: string) {
    const payload = { username };
    return api('/signinsuperadmin', {
      method: 'POST',
      headers: hdrs(sid),
      body: JSON.stringify(payload)
    });
  },
  async getSuperAdminAccount(sid: string) {
    return api('/superadminaccount', {
      headers: hdrs(sid)
    });
  },
  defineOrganization(payload: { organizationId: string, personId: string, username: string, organizationName: string }, sid: string, userId: string) {
    return api('/defineorganization', {
      method: 'POST',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },

  getOrganizationList() { return api('/organizationlist'); },



  signInToOrganization(
    usernameOrEmail: string,
    password: string,
    sid: string
  ) {
    localStorage.removeItem('auth_token');
    return api('/signintoorganizationpersonaccount', {
      method: 'POST',
      headers: {
        ...hdrs(sid),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usernameOrEmail, password })
    });
  },

  getPersonAccount(personId: string) {
    return api(`/account/${personId}`, {
      headers: hdrs()
    });
  },

  createTeam(payload: any, sid: string, userId: string) {
    return api('/createteam', {
      method: 'POST',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },
  getTeamListByOrg(organizationId: string, userId?: string) {
    return api('/teamlist', {
      headers: hdrs(undefined, organizationId),
    });
  },
  updateTeam(teamId: string, payload: { teamId: string; organizationId: string; name: string; purpose: string; context: string; level: number }, sid: string, userId: string) {
    return api(`/updateteam/${teamId}`, {
      method: 'POST',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },
  deleteTeam(teamId: string, payload: { teamId: string; organizationId: string }, sid: string, userId: string) {
    return api(`/deleteteam/${teamId}`, {
      method: 'POST',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },

  // Environmental Changes API
  getEnvironmentalChangesForTeam(teamId: string, organizationId: string, userId?: string) {
    return api(`/environmentalchanges/team/${teamId}`, {
      headers: hdrs(undefined, organizationId),
    });
  },
  getEnvironmentalChangeDetails(environmentalChangeId: string, organizationId: string, userId?: string) {
    return api(`/environmentalchanges/${environmentalChangeId}`, {
      headers: hdrs(undefined, organizationId),
    });
  },
  detectEnvironmentalChange(payload: any, sid: string, userId: string) {
    return api('/detectenvironmentalchange', {
      method: 'POST',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },
  updateEnvironmentalChange(id: string, payload: any, sid: string, userId: string) {
    return api(`/updateenvironmentalchange/${id}`, {
      method: 'POST',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },
  deleteEnvironmentalChange(id: string, payload: any, sid: string, userId: string) {
    return api(`/deleteenvironmentalchange/${id}`, {
      method: 'POST',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },

  // Strategy API
  createStrategy(payload: { teamId: string; organizationId: string; title: string; timeframe: string; status: string }, userId: string, sid: string) {
    return api('/api/v1/strategies', {
      method: 'POST',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },
  getStrategiesByTeam(organizationId: string, userId?: string, _teamId?: string) {
    return api(`/strategies/team/${_teamId}`, {
      headers: hdrs(undefined, organizationId),
    });
  },
  updateStrategy(strategyId: string, payload: { teamId: string; organizationId: string; title: string; timeframe: string; status: string }, userId: string, sid: string) {
    return api(`/api/v1/strategies/${strategyId}`, {
      method: 'PUT',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },

  // Initiative API
  createInitiative(initiativeId: string, payload: { initiativeId: string; initiativeName: string; organizationId: string; strategyId: string; teamId: string }, userId: string, sid: string) {
    return api(`/createinitiative/${initiativeId}`, {
      method: 'POST',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },
  changeInitiative(
    initiativeId: string,
    payload: { initiativeId: string; initiativeName: string; organizationId: string; status: string },
    userId: string,
    sid: string
  ) {
    return api(`/changeinitiative/${initiativeId}`, {
      method: 'POST',
      headers: hdrs(sid, payload.organizationId),
      body: JSON.stringify(payload)
    });
  },
  getInitiativesByStrategy(strategyId: string, teamId: string, organizationId: string, userId?: string) {
    return api(`/initiativelist/by-strategy?strategyId=${strategyId}&teamId=${teamId}`, {
      method: 'GET',
      headers: hdrs(undefined, organizationId)
    });
  },
  getInitiativesByOrganization(organizationId: string, userId: string) {
    // Use a slash instead of a query param if that's how the backend is mapped
    return api(`/initiativelist/by-organization?organizationId=${organizationId}`, {
      method: 'GET',
      headers: hdrs(undefined, organizationId)
    });

  },
  /** GET /initiativelist/{id} → { data: InitiativesReadModelEntity } */
  getInitiativeById(initiativeId: string, organizationId: string, userId?: string) {
    return api(`/initiativelist/${initiativeId}`, {
      method: 'GET',
      headers: hdrs(undefined, organizationId)
    });
  },
  /** GET /env-links/{initiativeId} — returns [{id, name}] */
  getEnvLinks(initiativeId: string, organizationId: string, userId?: string) {
    return api(`/env-links/${initiativeId}`, {
      method: 'GET',
      headers: hdrs(undefined, organizationId),
    });
  },
  /** POST /env-links/{initiativeId} — replaces the full linked list */
  updateEnvLinks(initiativeId: string, links: { id: string; name: string }[], organizationId: string, userId?: string) {
    return api(`/env-links/${initiativeId}`, {
      method: 'POST',
      headers: hdrs(undefined, organizationId),
      body: JSON.stringify(links),
    });
  },
  /** GET /initiative-links/{initiativeId} — returns [{id, name}] */
  getInitiativeLinks(initiativeId: string, organizationId: string, userId?: string) {
    return api(`/initiative-links/${initiativeId}`, {
      method: 'GET',
      headers: hdrs(undefined, organizationId),
    });
  },
  /** POST /initiative-links/{initiativeId} — replaces the full linked list */
  updateInitiativeLinks(initiativeId: string, links: { id: string; name: string }[], organizationId: string, userId?: string) {
    return api(`/initiative-links/${initiativeId}`, {
      method: 'POST',
      headers: hdrs(undefined, organizationId),
      body: JSON.stringify(links),
    });
  },
  /** POST /changeinitiativeitem/{initiativeId} */
  changeInitiativeItem(
    initiativeId: string,
    payload: { initiativeId: string; step: string; itemId: string; content: string; status: string },
    userId: string,
    sid: string,
    organizationId: string
  ) {
    // CRITICAL: Prevent sending "undefined" string to backend
    if (!organizationId) {
      throw new Error(`[STRADAR] Missing organizationId for initiative ${initiativeId}. Check your UI component state.`);
    }

    return api(`/changeinitiativeitem/${initiativeId}`, {
      method: 'POST',
      headers: hdrs(sid, organizationId),
      body: JSON.stringify(payload)
    });
  },

  // Legacy/Compatibility (Can be removed later if not used)
  getRadarList() { return api('/radarlist'); },
  createRadar(environmentalChangeId: string, teamId: string, orgId: string, sid: string, userId?: string) {
    return api('/createradar', {
      method: 'POST',
      headers: hdrs(sid, orgId),
      body: JSON.stringify({ environmentalChangeId, teamId, organizationId: orgId })
    });
  },
};

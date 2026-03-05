const BASE = 'http://localhost:8080';
export const GENESIS_ADMIN_ID = '00000000-0000-0000-0000-000000000001';

function hdrs(sid?: string) {
  return {
    'Content-Type': 'application/json',
    'X-Session-Id': sid || crypto.randomUUID(),
    'X-Correlation-Id': crypto.randomUUID(),
  };
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
    throw new Error(parsed || 'HTTP ' + r.status);
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
      headers: { ...hdrs(sid), 'x-user-id': userId },
      body: JSON.stringify(payload)
    });
  },

  getOrganizationList() { return api('/organizationlist'); },
  signInToOrganization(personId: string, sid: string) {
    return api('/signintoorganizationpersonaccount', { method: 'POST', headers: hdrs(sid), body: JSON.stringify({ personId }) });
  },
  getPersonAccount(personId: string) {
    return api(`/account/${personId}`);
  },

  createTeam(payload: any, sid: string) {
    return api('/createteam', { method: 'POST', headers: hdrs(sid), body: JSON.stringify(payload) });
  },
  getTeamList() { return api('/teamlist'); },
  getTeamListByOrg(organizationId: string) { return api(`/teamlist/${organizationId}`); },
  updateTeam(teamId: string, payload: { teamId: string; organizationId: string; name: string; purpose: string; context: string; level: number }, sid: string) {
    return api(`/updateteam/${teamId}`, { method: 'POST', headers: hdrs(sid), body: JSON.stringify(payload) });
  },
  deleteTeam(teamId: string, payload: { teamId: string; organizationId: string }, sid: string) {
    return api(`/deleteteam/${teamId}`, { method: 'POST', headers: hdrs(sid), body: JSON.stringify(payload) });
  },

  // Environmental Changes API
  getEnvironmentalChangesForTeam(teamId: string) {
    return api(`/environmentalchanges/team/${teamId}`);
  },
  getEnvironmentalChangeDetails(environmentalChangeId: string) {
    return api(`/environmentalchanges/${environmentalChangeId}`);
  },
  detectEnvironmentalChange(payload: any, sid: string) {
    return api('/detectenvironmentalchange', { method: 'POST', headers: hdrs(sid), body: JSON.stringify(payload) });
  },
  updateEnvironmentalChange(id: string, payload: any, sid: string) {
    return api(`/updateenvironmentalchange/${id}`, { method: 'POST', headers: hdrs(sid), body: JSON.stringify(payload) });
  },
  deleteEnvironmentalChange(id: string, payload: any, sid: string) {
    return api(`/deleteenvironmentalchange/${id}`, { method: 'POST', headers: hdrs(sid), body: JSON.stringify(payload) });
  },

  // Strategy API
  createStrategyDraft(payload: { teamId: string; organizationId: string; title: string; timeframe: string }, userId: string, sid: string) {
    return api('/api/v1/strategies/draft', {
      method: 'POST',
      headers: { ...hdrs(sid), 'x-user-id': userId },
      body: JSON.stringify(payload)
    });
  },
  getStrategiesByTeam(organizationId: string, teamId: string) {
    return api(`/strategies?organizationId=${organizationId}&teamId=${teamId}`);
  },

  // Initiative API
  createInitiative(initiativeId: string, payload: { initiativeId: string; initiativeName: string; organizationId: string; strategyId: string; teamId: string }, userId: string, sid: string) {
    return api(`/createinitiative/${initiativeId}`, {
      method: 'POST',
      headers: { ...hdrs(sid), 'x-user-id': userId },
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
      headers: { ...hdrs(sid), 'x-user-id': userId },
      body: JSON.stringify(payload)
    });
  },
  getInitiativesByStrategy(strategyId: string, teamId: string, organizationId: string) {
    // 1. Remove organizationId from the URL string
    // 2. Add it to the headers object
    return api(`/initiativelist/by-strategy?strategyId=${strategyId}&teamId=${teamId}`, {
      method: 'GET',
      headers: {
        ...hdrs(), // Assuming hdrs() returns content-type, etc.
        'organizationId': organizationId
      }
    });
  },
  /** GET /initiativelist/{id} → { data: InitiativesReadModelEntity } */
  getInitiativeById(initiativeId: string, organizationId: string) {
    return api(`/initiativelist/${initiativeId}`, {
      method: 'GET',
      headers: {
        ...hdrs(),
        'organizationId': organizationId
      }
    });
  },
  /** GET /env-links/{initiativeId} — returns [{id, name}] */
  getEnvLinks(initiativeId: string, organizationId: string) {
    return api(`/env-links/${initiativeId}`, {
      method: 'GET',
      headers: { ...hdrs(), 'organizationId': organizationId },
    });
  },
  /** POST /env-links/{initiativeId} — replaces the full linked list */
  updateEnvLinks(initiativeId: string, links: { id: string; name: string }[], organizationId: string) {
    return api(`/env-links/${initiativeId}`, {
      method: 'POST',
      headers: { ...hdrs(), 'organizationId': organizationId },
      body: JSON.stringify(links),
    });
  },
  /** GET /initiative-links/{initiativeId} — returns [{id, name}] */
  getInitiativeLinks(initiativeId: string, organizationId: string) {
    return api(`/initiative-links/${initiativeId}`, {
      method: 'GET',
      headers: { ...hdrs(), 'organizationId': organizationId },
    });
  },
  /** POST /initiative-links/{initiativeId} — replaces the full linked list */
  updateInitiativeLinks(initiativeId: string, links: { id: string; name: string }[], organizationId: string) {
    return api(`/initiative-links/${initiativeId}`, {
      method: 'POST',
      headers: { ...hdrs(), 'organizationId': organizationId },
      body: JSON.stringify(links),
    });
  },
  /** POST /changeinitiativeitem/{initiativeId} */
  /** POST /changeinitiativeitem/{initiativeId} */
  changeInitiativeItem(
    initiativeId: string,
    payload: { initiativeId: string; step: string; itemId: string; content: string; status: string },
    userId: string,
    sid: string,
    organizationId: string // <--- This is the 5th argument
  ) {
    // CRITICAL: Prevent sending "undefined" string to backend
    if (!organizationId) {
      throw new Error(`[STRADAR] Missing organizationId for initiative ${initiativeId}. Check your UI component state.`);
    }

    return api(`/changeinitiativeitem/${initiativeId}`, {
      method: 'POST',
      headers: {
        ...hdrs(sid),
        'x-user-id': userId,
        'organizationId': organizationId // This sends the header Spring is looking for
      },
      body: JSON.stringify(payload)
    });
  },

  // Legacy/Compatibility (Can be removed later if not used)
  getRadarList() { return api('/radarlist'); },
  createRadar(environmentalChangeId: string, teamId: string, orgId: string, sid: string) {
    return api('/createradar', { method: 'POST', headers: hdrs(sid), body: JSON.stringify({ environmentalChangeId, teamId, organizationId: orgId }) });
  },
};

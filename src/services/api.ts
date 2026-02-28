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
      headers: { ...hdrs(sid), 'X-User-Id': userId },
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

  // Legacy/Compatibility (Can be removed later if not used)
  getRadarList() { return api('/radarlist'); },
  createRadar(environmentalChangeId: string, teamId: string, orgId: string, sid: string) {
    return api('/createradar', { method: 'POST', headers: hdrs(sid), body: JSON.stringify({ environmentalChangeId, teamId, organizationId: orgId }) });
  },
};

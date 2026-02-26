const BASE = 'http://localhost:8080';

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
  async signInAdmin(email: string) {
    const sid = crypto.randomUUID();
    const d = await api('/signinadmin', { method: 'POST', headers: hdrs(sid), body: JSON.stringify({ email }) });
    return { ...d, sessionId: sid };
  },
  defineOrganization(name: string, adminAccountId: string, sid: string) {
    return api('/defineorganization', { method: 'POST', headers: hdrs(sid), body: JSON.stringify({ organizationName: name, adminAccountId }) });
  },
  getOrganizationList() { return api('/organizationlist'); },
  signInToOrganization(email: string, organizationId: string, organizationName: string, role: string, adminAccountId: string, sid: string) {
    return api('/signintoorganizationadminaccount', { method: 'POST', headers: hdrs(sid), body: JSON.stringify({ email, organizationId, organizationName, role, adminAccountId }) });
  },
  createTeam(payload: any, sid: string) {
    return api('/createteam', { method: 'POST', headers: hdrs(sid), body: JSON.stringify(payload) });
  },
  getTeamList() { return api('/teamlist'); },
  detectRadarElement(payload: any, sid: string) {
    return api('/detectradarelement', { method: 'POST', headers: hdrs(sid), body: JSON.stringify(payload) });
  },
  updateRadarElement(id: string, payload: any, sid: string) {
    return api(`/updateradarelement/${id}`, { method: 'POST', headers: hdrs(sid), body: JSON.stringify(payload) });
  },
  deleteRadarElement(id: string, payload: any, sid: string) {
    return api(`/deleteradarelement/${id}`, { method: 'POST', headers: hdrs(sid), body: JSON.stringify(payload) });
  },
  getRadarList() { return api('/radarlist'); },
  getRadarView(radarId: string) { return api(`/radarview/${radarId}`); },
  createRadar(radarId: string, teamId: string, orgId: string, sid: string) {
    return api('/createradar', { method: 'POST', headers: hdrs(sid), body: JSON.stringify({ radarId, teamId, organizationId: orgId }) });
  },
};

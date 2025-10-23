type HttpMethod = 'POST';

export type CaliperClientConfig = {
  baseUrl: string; // e.g., https://caliper.alpha-1edtech.com
  tokenUrl?: string; // OAuth2 token endpoint (client credentials)
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  apiKey?: string; // alternative auth if provided
  version?: '1.2' | string; // defaults to 1.2
  sensor: string; // IRI for the Caliper Sensor (e.g., https://teachtales.app/sensors/primary)
};

export type CaliperEvent = Record<string, any> & { id: string; type: string; eventTime: string };

export type CaliperEnvelope = {
  dataVersion: string; // "http://purl.imsglobal.org/ctx/caliper/v1p2"
  sendTime: string; // ISO8601 UTC
  sensor: string; // IRI identifying the Caliper Sensor
  data: CaliperEvent[]; // array of events (AssessmentEvent, AssessmentItemEvent, etc.)
};

export class CaliperClient {
  private readonly cfg: CaliperClientConfig;
  private cachedToken?: { accessToken: string; expiresAt: number };

  constructor(cfg: CaliperClientConfig) {
    this.cfg = cfg;
  }

  // Deterministic ID to support idempotency on retries
  static deterministicId(seed: string): string {
    // Simple stable hash; in production prefer crypto.subtle.digest
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0; // 32-bit
    }
    return `urn:uuid:${Math.abs(hash).toString(16)}-${seed.length}`;
  }

  async sendEvents(events: CaliperEvent[]): Promise<void> {
    const url = this.url('/caliper/event');
    const envelope: CaliperEnvelope = {
      dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      sendTime: new Date().toISOString(),
      sensor: this.cfg.sensor,
      data: Array.isArray(events) ? events : [events]
    };
    const body = JSON.stringify(envelope);
    const headers = await this.buildAuthHeaders();
    headers['Content-Type'] = 'application/json';

    await this.request('POST', url, { headers, body });
  }

  async validateEvents(events: CaliperEvent[]): Promise<void> {
    const url = this.url('/caliper/event/validate');
    const envelope: CaliperEnvelope = {
      dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      sendTime: new Date().toISOString(),
      sensor: this.cfg.sensor,
      data: Array.isArray(events) ? events : [events]
    };
    const body = JSON.stringify(envelope);
    const headers = await this.buildAuthHeaders();
    headers['Content-Type'] = 'application/json';
    await this.request('POST', url, { headers, body });
  }

  private url(path: string): string {
    return `${this.cfg.baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private async request(method: HttpMethod, url: string, init: { headers?: Record<string, string>; body?: string }): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    let delay = 1000;

    while (true) {
      try {
        const res = await fetch(url, { method, headers: init.headers, body: init.body });
        if (!res.ok && res.status >= 500) throw new Error(`Server error ${res.status}`);
        if (!res.ok) throw new Error(`Request failed ${res.status}`);
        return;
      } catch (err) {
        attempt++;
        if (attempt > maxRetries) throw err;
        await new Promise(r => setTimeout(r, delay));
        delay = Math.min(delay * 2, 15000);
      }
    }
  }

  private async buildAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    if (this.cfg.apiKey) {
      headers['Authorization'] = `Bearer ${this.cfg.apiKey}`;
      return headers;
    }
    if (this.cfg.tokenUrl && this.cfg.clientId && this.cfg.clientSecret) {
      const token = await this.getAccessToken();
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
    return headers;
  }

  private async getAccessToken(): Promise<string> {
    // server-side only recommended; ensure secrets are not exposed client-side
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt - 5000 > now) {
      return this.cachedToken.accessToken;
    }

    if (!this.cfg.tokenUrl || !this.cfg.clientId || !this.cfg.clientSecret) {
      throw new Error('Caliper OAuth2 configuration incomplete');
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
    });
    if (this.cfg.scope) body.set('scope', this.cfg.scope);

    const res = await fetch(this.cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`Failed to obtain Caliper token: ${res.status}`);
    const json = await res.json() as { access_token: string; expires_in?: number };
    const expiresAt = Date.now() + ((json.expires_in ?? 3600) * 1000);
    this.cachedToken = { accessToken: json.access_token, expiresAt };
    return json.access_token;
  }
}



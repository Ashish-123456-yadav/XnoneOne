import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

type Session = {
  user: { id: string; username: string; displayName: string; role: string };
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
};

type Dashboard = {
  users: number;
  creators: number;
  posts: number;
  reportsOpen: number;
  uploadsProcessing: number;
  revenueUsd: number;
  retention: Array<{ label: string; value: number }>;
};

type Report = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { username: string; displayName: string };
  post: { title: string } | null;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

async function api<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Request failed with ${response.status}`);
  }

  return payload.data as T;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('admin@novasocial.ai');
  const [password, setPassword] = useState('NovaPass123!');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const load = async () => {
      try {
        const [dashboardData, reportData] = await Promise.all([
          api<Dashboard>('/admin/dashboard', session.tokens.accessToken),
          api<Report[]>('/admin/reports', session.tokens.accessToken),
        ]);
        setDashboard(dashboardData);
        setReports(reportData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load admin data');
      }
    };

    load();
  }, [session]);

  const metrics = useMemo(
    () => [
      { label: 'Users', value: dashboard?.users.toLocaleString() ?? '0', tone: 'blue' },
      { label: 'Creators', value: dashboard?.creators.toLocaleString() ?? '0', tone: 'green' },
      { label: 'Open Reports', value: dashboard?.reportsOpen.toString() ?? '0', tone: 'amber' },
      { label: 'Revenue', value: dashboard ? `$${dashboard.revenueUsd.toLocaleString()}` : '$0', tone: 'ink' },
    ],
    [dashboard],
  );

  const login = async () => {
    try {
      const nextSession = await api<Session>('/auth/login', undefined, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(nextSession);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const resolveReport = async (reportId: string) => {
    if (!session) return;

    await api(`/admin/reports/${reportId}`, session.tokens.accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved', resolutionNote: 'Reviewed from admin dashboard.' }),
    });
    setReports((current) => current.map((report) => (report.id === reportId ? { ...report, status: 'resolved' } : report)));
  };

  if (!session) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="brand-mark">N</div>
          <h1>NovaSocial Admin</h1>
          <p>Secure operations console for moderation, analytics, creators, uploads, and revenue workflows.</p>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <strong className="error">{error}</strong>}
          <button onClick={login}>Login</button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">N</div>
          <div>
            <strong>NovaSocial</strong>
            <span>AI Operations</span>
          </div>
        </div>
        <nav>
          {['Overview', 'Moderation', 'Creators', 'Uploads', 'Revenue', 'Security'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>
        <button className="ghost-button" onClick={() => setSession(null)}>
          Sign out
        </button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p>Admin dashboard</p>
            <h1>Platform command center</h1>
          </div>
          <span>{session.user.displayName}</span>
        </header>

        {error && <strong className="error">{error}</strong>}

        <section className="metric-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className={`metric-card ${metric.tone}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="two-column">
          <article className="panel" id="moderation">
            <div className="panel-header">
              <div>
                <p>Moderation</p>
                <h2>Reports queue</h2>
              </div>
              <span>{reports.filter((report) => report.status === 'open').length} open</span>
            </div>
            <div className="table">
              {reports.map((report) => (
                <div className="table-row" key={report.id}>
                  <div>
                    <strong>{report.post?.title ?? 'Comment report'}</strong>
                    <span>{report.reason}</span>
                    <small>Reported by @{report.reporter.username}</small>
                  </div>
                  <div className="row-actions">
                    <em>{report.status}</em>
                    <button onClick={() => resolveReport(report.id)}>Resolve</button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel" id="uploads">
            <div className="panel-header">
              <div>
                <p>Video</p>
                <h2>Processing health</h2>
              </div>
              <span>{dashboard?.uploadsProcessing ?? 0} active</span>
            </div>
            <div className="status-list">
              {['R2 signed uploads', 'FFmpeg HLS queue', 'Thumbnail generation', 'Moderation scan'].map((item, index) => (
                <div key={item}>
                  <strong>{item}</strong>
                  <span>{index === 1 && dashboard?.uploadsProcessing ? 'Busy' : 'Healthy'}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="two-column">
          <article className="panel" id="revenue">
            <div className="panel-header">
              <div>
                <p>Monetization</p>
                <h2>Payments</h2>
              </div>
              <span>Stripe + Razorpay</span>
            </div>
            <div className="status-list">
              <div>
                <strong>Creator payouts</strong>
                <span>Scheduled</span>
              </div>
              <div>
                <strong>Subscriptions</strong>
                <span>Active</span>
              </div>
              <div>
                <strong>Webhook safety</strong>
                <span>Signature enforced</span>
              </div>
            </div>
          </article>

          <article className="panel" id="security">
            <div className="panel-header">
              <div>
                <p>Retention</p>
                <h2>Cohort snapshot</h2>
              </div>
              <span>Live</span>
            </div>
            <div className="retention-bars">
              {dashboard?.retention.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <div>
                    <b style={{ width: `${item.value}%` }} />
                  </div>
                  <strong>{item.value}%</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);

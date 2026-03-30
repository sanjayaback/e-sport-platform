'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/components/AuthProvider';
import { ITournament, AnalyticsData } from '@/types';
import {
  Trophy, Plus, Users, BarChart2, CheckCircle, XCircle, Gamepad2,
  Crown, Loader2, Play, Eye, X, Image as ImageIcon,
  ChevronDown, DollarSign, Upload,
} from 'lucide-react';
import Link from 'next/link';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function resizeImage(base64Str: string, maxWidth = 300, maxHeight = 300): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxWidth)  { h *= maxWidth / w;  w = maxWidth; } }
      else        { if (h > maxHeight) { w *= maxHeight / h; h = maxHeight; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
}

const CHART_OPTS_DOUGHNUT = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { font: { family: "'DM Sans', sans-serif", size: 11 }, color: '#8B919A', boxWidth: 10, padding: 14 },
    },
  },
};

const CHART_OPTS_BAR = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: '#E4E7EC' }, ticks: { font: { family: "'DM Sans', sans-serif", size: 11 }, color: '#8B919A' } },
    y: { grid: { color: '#E4E7EC' }, ticks: { font: { family: "'DM Sans', sans-serif", size: 11 }, color: '#8B919A' } },
  },
};

// ─── FINANCIAL MODAL ──────────────────────────────────────────────────────────

function FinancialModal({
  type, onClose, onRefresh,
}: { type: 'deposit' | 'withdraw'; onClose: () => void; onRefresh: () => void }) {
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount');
    setError(''); setLoading(true);
    try {
      await axios.post('/api/payments', { type, amount: Number(amount) });
      onRefresh(); onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Transaction failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="hd-modal-backdrop">
      <div className="card-clean hd-modal-box animate-in">
        <div className="hd-modal-header">
          <h3 className="hd-modal-title" style={{ textTransform: 'capitalize' }}>{type}</h3>
          <button onClick={onClose} className="hd-modal-close"><X size={16} /></button>
        </div>

        {error && <div className="hd-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="hd-form">
          <div className="hd-field">
            <label className="hd-label">Amount ($)</label>
            <div className="hd-input-wrap">
              <DollarSign size={15} className="hd-input-icon" />
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" step="0.01" required
                className="input-clean hd-input-padded"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary hd-submit-btn">
            {loading ? 'Processing…' : `${type === 'deposit' ? 'Deposit' : 'Withdraw'} Funds`}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── CREATE TOURNAMENT MODAL ──────────────────────────────────────────────────

function CreateTournamentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', gameName: 'PUBG', entryFee: '0',
    maxPlayers: '16', prizePool: '100', hostQRCodeURL: '',
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [preview, setPreview] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const optimized = await resizeImage(reader.result as string, 300, 300);
      setForm(f => ({ ...f, hostQRCodeURL: optimized }));
      setPreview(optimized); setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await axios.post('/api/tournaments', {
        ...form,
        entryFee:    Number(form.entryFee),
        maxPlayers:  Number(form.maxPlayers),
        prizePool:   Number(form.prizePool),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      onCreated(); onClose();
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to create'); }
    finally { setLoading(false); }
  }

  return (
    <div className="hd-modal-backdrop">
      <div className="card-clean hd-modal-box hd-modal-wide animate-in">
        <div className="hd-modal-header">
          <h2 className="hd-modal-title">Create Tournament</h2>
          <button onClick={onClose} className="hd-modal-close"><X size={16} /></button>
        </div>

        {error && <div className="hd-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="hd-form">
          <div className="hd-create-grid">

            {/* Left column */}
            <div className="hd-form-col">
              <div className="hd-field">
                <label className="hd-label">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required className="input-clean" placeholder="Tournament name" />
              </div>
              <div className="hd-field">
                <label className="hd-label">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input-clean hd-textarea" placeholder="Rules and details…" />
              </div>
              <div className="hd-two-col">
                <div className="hd-field">
                  <label className="hd-label">Game</label>
                  <select value={form.gameName} onChange={e => setForm(f => ({ ...f, gameName: e.target.value }))} className="input-clean">
                    <option value="PUBG">PUBG</option>
                    <option value="Free Fire">Free Fire</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="hd-field">
                  <label className="hd-label">Max Players</label>
                  <input type="number" min="2" max="100" value={form.maxPlayers}
                    onChange={e => setForm(f => ({ ...f, maxPlayers: e.target.value }))} required className="input-clean" />
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="hd-form-col">
              <div className="hd-field">
                <label className="hd-label">Payment QR Code</label>
                <div className="hd-upload-wrap">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hd-upload-input" />
                  <div className={`hd-upload-zone ${preview ? 'hd-upload-zone-filled' : ''}`}>
                    {preview ? (
                      <div className="hd-upload-preview">
                        <img src={preview} alt="QR" className="hd-upload-img" />
                        <span className="hd-upload-done"><CheckCircle size={12} /> Uploaded</span>
                      </div>
                    ) : (
                      <div className="hd-upload-placeholder">
                        <Upload size={20} className="hd-upload-icon" />
                        <p className="hd-upload-text">Upload QR code</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="hd-two-col">
                <div className="hd-field">
                  <label className="hd-label">Entry Fee ($)</label>
                  <input type="number" min="0" step="0.01" value={form.entryFee}
                    onChange={e => setForm(f => ({ ...f, entryFee: e.target.value }))} required className="input-clean" />
                </div>
                <div className="hd-field">
                  <label className="hd-label">Prize Pool ($)</label>
                  <input type="number" min="0" step="0.01" value={form.prizePool}
                    onChange={e => setForm(f => ({ ...f, prizePool: e.target.value }))} required className="input-clean" />
                </div>
              </div>
              <div className="hd-field">
                <label className="hd-label">Scheduled At</label>
                <input type="datetime-local" value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required className="input-clean" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="hd-modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary hd-footer-cancel">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary hd-footer-submit">
              {loading ? 'Creating…' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TOURNAMENT ROW ───────────────────────────────────────────────────────────

function TournamentRow({ t, onRefresh }: { t: ITournament; onRefresh: () => void }) {
  const [expanded, setExpanded]         = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [winnerId, setWinnerId]         = useState('');
  const [msg, setMsg]                   = useState('');

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    try { await axios.patch(`/api/tournaments/${t._id}`, { status }); onRefresh(); }
    catch { /* ignore */ } finally { setUpdatingStatus(false); }
  }

  async function selectWinner() {
    if (!winnerId) return;
    try { await axios.patch(`/api/tournaments/${t._id}`, { winnerId }); setMsg('Winner selected!'); onRefresh(); }
    catch (err: any) { setMsg(err.response?.data?.error || 'Failed'); }
  }

  async function approvePlayer(playerId: string, approved: boolean) {
    try { await axios.patch(`/api/tournaments/approve/${t._id}`, { playerId, approved }); onRefresh(); }
    catch { /* ignore */ }
  }

  return (
    <div className="card-clean hd-row-card">

      {/* ── Collapsed header ─────────────────────────────────────────────── */}
      <div className="hd-row-header" onClick={() => setExpanded(v => !v)}>
        <div className={`hd-row-icon hd-row-icon-${t.status}`}>
          <Gamepad2 size={20} />
        </div>

        <div className="hd-row-meta">
          <div className="hd-row-title-row">
            <span className="hd-row-title">{t.title}</span>
            <span className={
              t.status === 'live'     ? 'badge-live'     :
              t.status === 'upcoming' ? 'badge-upcoming' : 'badge-finished'
            }>{t.status}</span>
          </div>
          <div className="hd-row-sub">
            <span><Users size={12} /> {t.players.length}/{t.maxPlayers}</span>
            <span>Prize: ${t.prizePool.toLocaleString()}</span>
            <span>{t.gameName}</span>
          </div>
        </div>

        <div className="hd-row-actions" onClick={e => e.stopPropagation()}>
          <Link href={`/tournaments/${t._id}`} className="ad-icon-btn" title="View tournament">
            <Eye size={14} />
          </Link>
        </div>
        <ChevronDown size={16} className={`hd-row-chevron ${expanded ? 'hd-row-chevron-open' : ''}`} />
      </div>

      {/* ── Expanded detail ───────────────────────────────────────────────── */}
      {expanded && (
        <div className="hd-row-expanded animate-in">
          <div className="hd-expanded-grid">

            {/* Controls */}
            <div>
              <div className="hd-expanded-label">Controls</div>
              <div className="card-surface hd-controls-box">
                {t.status === 'upcoming' && (
                  <button onClick={() => updateStatus('live')} disabled={updatingStatus} className="btn-primary hd-control-btn">
                    <Play size={14} className="hd-play-icon" /> Start Tournament
                  </button>
                )}
                {t.status === 'live' && !t.winnerId && (
                  <div className="hd-field">
                    <label className="hd-label">Select Winner</label>
                    <div className="hd-winner-row">
                      <select value={winnerId} onChange={e => setWinnerId(e.target.value)} className="input-clean hd-winner-select">
                        <option value="">Choose player</option>
                        {t.players.map(p => {
                          const pu = p.playerId as any;
                          return (
                            <option key={pu?._id || String(p.playerId)} value={pu?._id || String(p.playerId)}>
                              {pu?.username || p.gameID}
                            </option>
                          );
                        })}
                      </select>
                      <button onClick={selectWinner} className="hd-crown-btn" title="Set winner">
                        <Crown size={15} />
                      </button>
                    </div>
                  </div>
                )}
                {t.status === 'finished' && (
                  <p className="hd-finished-note">This tournament has ended.</p>
                )}
                {msg && <div className="hd-msg-success">{msg}</div>}
              </div>
            </div>

            {/* Players */}
            <div>
              <div className="hd-expanded-label">Players ({t.players.length})</div>
              <div className="hd-players-list">
                {t.players.length === 0 ? (
                  <div className="hd-players-empty">No players yet</div>
                ) : t.players.map((p, i) => {
                  const pu  = p.playerId as any;
                  const pid = pu?._id || String(p.playerId);
                  return (
                    <div key={i} className="hd-player-row">
                      <div className="hd-player-num">{i + 1}</div>
                      <div className="hd-player-info">
                        <div className="hd-player-name">{pu?.username || 'Player'}</div>
                        <div className="hd-player-id">ID: {p.gameID}</div>
                      </div>
                      <div className="hd-player-actions">
                        {p.screenshotURL && (
                          <a href={p.screenshotURL} target="_blank" rel="noreferrer" className="hd-screenshot-btn" title="View screenshot">
                            <ImageIcon size={13} />
                          </a>
                        )}
                        {p.paid ? (
                          <span className="hd-paid-badge"><CheckCircle size={11} /> Paid</span>
                        ) : (
                          <div className="hd-approve-row">
                            <button onClick={() => approvePlayer(pid, true)} className="hd-approve-btn">Approve</button>
                            <button onClick={() => approvePlayer(pid, false)} className="hd-reject-btn">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOST DASHBOARD ───────────────────────────────────────────────────────────

type Tab = 'tournaments' | 'analytics';

export default function HostDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tournaments,   setTournaments]   = useState<ITournament[]>([]);
  const [analytics,     setAnalytics]     = useState<AnalyticsData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [activeTab,     setActiveTab]     = useState<Tab>('tournaments');
  const [subscribing,   setSubscribing]   = useState(false);
  const [subError,      setSubError]      = useState('');
  const [financeModal,  setFinanceModal]  = useState<'deposit' | 'withdraw' | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'host' && user.role !== 'admin'))) router.push('/');
  }, [user, authLoading, router]);

  async function handleSubscribe() {
    setSubscribing(true); setSubError('');
    try {
      await axios.post('/api/host/subscribe');
      window.location.reload();
    } catch (err: any) {
      setSubError(err.response?.data?.error || 'Failed to subscribe');
    } finally { setSubscribing(false); }
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        axios.get('/api/tournaments?limit=50'),
        axios.get('/api/analytics'),
      ]);
      const all: ITournament[] = tRes.data.data.tournaments;
      const mine = user?.role === 'admin'
        ? all
        : all.filter(t => {
            const hid = (t.hostId as any)?._id || t.hostId;
            return String(hid) === user?._id;
          });
      setTournaments(mine);
      setAnalytics(aRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  if (authLoading || !user) return (
    <div className="ad-loading-guard"><div className="kp-spinner" /></div>
  );

  // Derived
  const activeCount  = tournaments.filter(t => t.status !== 'finished').length;
  const totalPrize   = tournaments.reduce((s, t) => s + t.prizePool, 0);
  const totalPlayers = tournaments.reduce((s, t) => s + t.players.length, 0);

  const TABS: Tab[] = ['tournaments', 'analytics'];

  const doughnutColors = {
    bg:     ['rgba(26,28,30,0.06)', 'rgba(26,28,30,0.12)', 'rgba(26,28,30,0.2)', 'rgba(26,28,30,0.28)'],
    border: ['#1A1C1E', '#4B5058', '#8B919A', '#CDD2D9'],
  };

  const gameChartData = {
    labels: analytics?.perGameStats.map(g => g.game) || [],
    datasets: [{
      data:            analytics?.perGameStats.map(g => g.count) || [],
      backgroundColor: doughnutColors.bg,
      borderColor:     doughnutColors.border,
      borderWidth: 1.5,
    }],
  };

  const revenueChartData = {
    labels: analytics?.monthlyRevenue.map(m => m.month) || [],
    datasets: [{
      label:           'Revenue ($)',
      data:            analytics?.monthlyRevenue.map(m => m.revenue) || [],
      backgroundColor: 'rgba(26,28,30,0.06)',
      borderColor:     '#1A1C1E',
      borderWidth: 1.5,
    }],
  };

  const statCards = [
    { label: 'Tournaments',   value: tournaments.length,            icon: Trophy    },
    { label: 'Active',        value: activeCount,                   icon: Play      },
    { label: 'Total Players', value: totalPlayers,                  icon: Users     },
    { label: 'Prize Pool',    value: `$${totalPrize.toLocaleString()}`, icon: DollarSign },
  ];

  const isSubscribed = user.isSubscribed || user.role === 'admin';

  return (
    <div className="ad-page">
      {showCreate && (
        <CreateTournamentModal onClose={() => setShowCreate(false)} onCreated={fetchData} />
      )}
      {financeModal && (
        <FinancialModal type={financeModal} onClose={() => setFinanceModal(null)} onRefresh={fetchData} />
      )}

      <div className="kp-wrap ad-inner">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="ad-page-header animate-in-d0">
          <div>
            <div className="ad-page-eyebrow">Host Dashboard</div>
            <h1 className="ad-page-title">
              {user.username}&apos;s{' '}
              <em className="kp-headline-em">Tournaments</em>
            </h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            disabled={!isSubscribed}
            className="btn-primary ad-export-btn"
          >
            <Plus size={15} /> Create Tournament
          </button>
        </div>

        {/* ── Subscription banner ────────────────────────────────────────── */}
        {!isSubscribed && (
          <div className="card-clean hd-sub-banner animate-in-d1">
            <div className="hd-sub-left">
              <div className="hd-sub-title">
                <Crown size={16} className="hd-sub-crown" />
                Host Subscription Required
              </div>
              <p className="hd-sub-desc">
                Subscribe to create and manage tournaments.
                $10 will be deducted from your wallet.
              </p>
              {subError && <div className="hd-error-banner" style={{ marginTop: 8 }}>{subError}</div>}
            </div>
            <div className="hd-sub-right">
              <div className="hd-sub-balance">
                Wallet:{' '}
                <strong>${user.walletBalance}</strong>
                <button onClick={() => setFinanceModal('deposit')} className="hd-add-funds">
                  Add Funds
                </button>
              </div>
              <button onClick={handleSubscribe} disabled={subscribing} className="btn-primary">
                {subscribing
                  ? <><Loader2 size={14} className="hd-spin" /> Subscribing…</>
                  : <><DollarSign size={14} /> Subscribe ($10)</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Stat cards ────────────────────────────────────────────────── */}
        <div className="ad-stat-grid animate-in-d1">
          {statCards.map((s, i) => (
            <div
              key={s.label}
              className={`card-clean ad-stat-card ${loading ? 'stat-hidden' : 'stat-visible'}`}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="ad-stat-icon"><s.icon size={16} /></div>
              <div className="ad-stat-value">{s.value}</div>
              <div className="ad-stat-label">{s.label}</div>
              <div className="kp-bar-track" style={{ marginTop: 14 }}>
                <div className="kp-bar" style={{ width: `${Math.min(100, Number(s.value) || 55)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="ad-tabs animate-in-d2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`ad-tab ${activeTab === tab ? 'ad-tab-active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TOURNAMENTS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'tournaments' && (
          <div className="hd-list animate-in">
            {loading ? (
              <div className="hd-list-loading"><div className="kp-spinner" /></div>
            ) : tournaments.length === 0 ? (
              <div className="card-clean hd-list-empty">
                <div className="hd-empty-icon"><Trophy size={22} /></div>
                <div className="hd-empty-title">No tournaments yet</div>
                <p className="hd-empty-desc">Create your first tournament to get started</p>
                <button onClick={() => setShowCreate(true)} className="btn-secondary" style={{ padding: '9px 20px', fontSize: 13 }}>
                  Create Tournament
                </button>
              </div>
            ) : (
              tournaments.map(t => <TournamentRow key={t._id} t={t} onRefresh={fetchData} />)
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ANALYTICS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && analytics && (
          <div className="ad-charts-grid animate-in">
            <div className="card-clean ad-chart-card">
              <div className="ad-chart-header"><BarChart2 size={13} /> Game Distribution</div>
              <div className="ad-chart-body">
                {(analytics.perGameStats?.length ?? 0) > 0
                  ? <Doughnut data={gameChartData} options={CHART_OPTS_DOUGHNUT} />
                  : <div className="ad-chart-empty">No data yet</div>
                }
              </div>
            </div>
            <div className="card-clean ad-chart-card ad-chart-wide">
              <div className="ad-chart-header"><DollarSign size={13} /> Monthly Revenue</div>
              <div className="ad-chart-body">
                {(analytics.monthlyRevenue?.length ?? 0) > 0
                  ? <Bar data={revenueChartData} options={CHART_OPTS_BAR} />
                  : <div className="ad-chart-empty">No revenue data yet</div>
                }
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
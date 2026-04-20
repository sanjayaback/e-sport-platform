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
import QRCodeUpload from '@/components/QRCodeUpload';
import Link from 'next/link';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

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


// ─── CREATE TOURNAMENT MODAL ──────────────────────────────────────────────────

function CreateTournamentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', gameName: 'PUBG', entryFee: '0',
    maxPlayers: '16', prizePool: '100', hostQRCodeURL: '',
    roomId: '', roomPassword: '',
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleQRUploadSuccess = (image: any) => {
    setForm(f => ({ ...f, hostQRCodeURL: image.secure_url }));
  };

  const handleQRUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await axios.post('/api/tournaments', {
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
                <QRCodeUpload
                  onUploadSuccess={handleQRUploadSuccess}
                  onUploadError={handleQRUploadError}
                  className="hd-upload-wrap"
                />
              </div>
              <div className="hd-two-col">
                <div className="hd-field">
                  <label className="hd-label">Entry Fee (Rs.)</label>
                  <input type="number" min="0" step="0.01" value={form.entryFee}
                    onChange={e => setForm(f => ({ ...f, entryFee: e.target.value }))} required className="input-clean" />
                </div>
                <div className="hd-field">
                  <label className="hd-label">Prize Pool (Rs.)</label>
                  <input type="number" min="0" step="0.01" value={form.prizePool}
                    onChange={e => setForm(f => ({ ...f, prizePool: e.target.value }))} required className="input-clean" />
                </div>
              </div>
              <div className="hd-two-col">
                <div className="hd-field">
                  <label className="hd-label">Room ID *</label>
                  <input value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}
                    required className="input-clean" placeholder="Enter room ID" />
                </div>
                <div className="hd-field">
                  <label className="hd-label">Room Password *</label>
                  <input type="password" value={form.roomPassword} onChange={e => setForm(f => ({ ...f, roomPassword: e.target.value }))}
                    required className="input-clean" placeholder="Enter room password" />
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage]   = useState('');

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
            <span>Prize: Rs.{t.prizePool.toLocaleString()}</span>
            <span>{t.gameName}</span>
          </div>
        </div>

        <div className="hd-row-actions" onClick={e => e.stopPropagation()}>
          <Link href={`/tournaments/${t._id}`} className="ad-icon-btn" title="View tournament details" style={{ cursor: 'pointer' }}>
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
                        {p.paymentScreenshot && (
                          <button 
                            onClick={() => {
                              const screenshot = p.paymentScreenshot || '';
                              // Handle both Cloudinary URLs and legacy base64 data
                              const imageUrl = screenshot.startsWith('http') 
                                ? screenshot 
                                : screenshot.startsWith('data:') 
                                  ? screenshot 
                                  : `data:image/jpeg;base64,${screenshot}`;
                              window.open(imageUrl, '_blank');
                            }}
                            className="hd-screenshot-btn" 
                            title="View payment screenshot"
                            style={{
                              background: 'rgba(251, 146, 60, 0.1)',
                              border: '1px solid rgba(251, 146, 60, 0.2)',
                              color: '#ea580c',
                              borderRadius: 6,
                              padding: '4px 8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(251, 146, 60, 0.15)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(251, 146, 60, 0.1)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <DollarSign size={13} />
                            Payment
                          </button>
                        )}
                        {p.screenshotURL && (
                          <a href={p.screenshotURL} target="_blank" rel="noreferrer" className="hd-screenshot-btn" title="View game screenshot">
                            <ImageIcon size={13} />
                          </a>
                        )}
                        {p.paymentApproved ? (
                          <span className="hd-paid-badge"><CheckCircle size={11} /> Payment Approved</span>
                        ) : p.paymentScreenshot ? (
                          <div className="hd-approve-row">
                            <button onClick={() => approvePlayer(pid, true)} className="hd-approve-btn">Approve Payment</button>
                            <button onClick={() => approvePlayer(pid, false)} className="hd-reject-btn">Reject</button>
                          </div>
                        ) : p.paid ? (
                          <span className="hd-paid-badge"><CheckCircle size={11} /> Paid</span>
                        ) : (
                          <span className="hd-pending-badge">Pending Payment</span>
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
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [tournaments,   setTournaments]   = useState<ITournament[]>([]);
  const [analytics,     setAnalytics]     = useState<AnalyticsData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [activeTab,     setActiveTab]     = useState<Tab>('tournaments');

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'host' && user.role !== 'admin'))) router.push('/');
  }, [user, authLoading, router]);

  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch tournaments with timeout
      const [tRes, aRes] = await Promise.all([
        axios.get('/api/tournaments?limit=50', { timeout: 5000 }),
        axios.get('/api/analytics', { timeout: 5000 }),
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
    } catch (e) { 
      console.error('Data fetch error:', e);
      // Set default values on error
      setTournaments([]);
      setAnalytics(null);
    } finally {
      setLoading(false); 
    }
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  // Separate effect for refreshing user data
  useEffect(() => {
    if (user) {
      const refreshInterval = setInterval(async () => {
        try {
          await refreshUser();
        } catch (e) {
          console.warn('User refresh failed:', e);
        }
      }, 60000); // Refresh every 60 seconds instead of 30

      return () => clearInterval(refreshInterval);
    }
  }, [user, refreshUser]);

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
      label:         'Revenue (Rs.)',
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
    // { label: 'Prize Pool',    value: `Rs.${totalPrize.toLocaleString()}`, icon: DollarSign },
  ];

  
  return (
    <div className="ad-page">
      {showCreate && (
        <CreateTournamentModal onClose={() => setShowCreate(false)} onCreated={fetchData} />
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
            className="btn-primary ad-export-btn"
          >
            <Plus size={15} /> Create Tournament
          </button>
        </div>

        {/* ── Wallet Information Banner ────────────────────────────────────────── */}
        <div className="card-clean hd-sub-banner animate-in-d1">
          <div className="hd-sub-left">
            <div className="hd-sub-title">
              <DollarSign size={16} className="hd-sub-crown" />
              Wallet-Based Tournament Creation
            </div>
            <p className="hd-sub-desc">
              Create tournaments by funding prize pools from your wallet.
              Each tournament costs <strong>Rs.50 host fee</strong> + prize pool amount.
            </p>
          </div>
          <div className="hd-sub-right">
            <div className="hd-sub-balance">
              Wallet Balance:{' '}
              <strong>Rs.{user?.walletBalance || 0}</strong>
            </div>
          </div>
        </div>

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
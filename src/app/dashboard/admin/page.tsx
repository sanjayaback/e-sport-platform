'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/components/AuthProvider';
import { ITournament, AnalyticsData, IPayment } from '@/types';
import {
  Shield, Users, Trophy, TrendingUp, Download, Loader2,
  Trash2, CheckCircle, XCircle, BarChart2,
  DollarSign, ArrowUpRight, ArrowDownLeft,
} from 'lucide-react';
import Link from 'next/link';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, PointElement, LineElement,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, PointElement, LineElement,
);

// ─── CHART DEFAULTS ───────────────────────────────────────────────────────────

const DOUGHNUT_COLORS = {
  bg:     ['rgba(26,28,30,0.06)', 'rgba(26,28,30,0.12)', 'rgba(26,28,30,0.18)'],
  border: ['#1A1C1E', '#4B5058', '#8B919A'],
};

const CHART_OPTS_DOUGHNUT = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { font: { family: "'DM Sans', sans-serif", size: 11 }, color: '#8B919A', boxWidth: 10, padding: 16 },
    },
  },
};

const CHART_OPTS_LINE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: '#E4E7EC' }, ticks: { font: { family: "'DM Sans', sans-serif", size: 11 }, color: '#8B919A' } },
    y: { grid: { color: '#E4E7EC' }, ticks: { font: { family: "'DM Sans', sans-serif", size: 11 }, color: '#8B919A' } },
  },
};

// ─── PAGE ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'tournaments' | 'payments';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tournaments, setTournaments] = useState<ITournament[]>([]);
  const [payments,    setPayments]    = useState<IPayment[]>([]);
  const [analytics,   setAnalytics]   = useState<AnalyticsData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<Tab>('overview');

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') router.push('/');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, pRes, aRes] = await Promise.all([
        axios.get('/api/tournaments?limit=100'),
        axios.get('/api/payments'),
        axios.get('/api/analytics'),
      ]);
      setTournaments(tRes.data.data.tournaments);
      setPayments(pRes.data.data.payments);
      setAnalytics(aRes.data.data);
    } catch (e) { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user?.role === 'admin') fetchData(); }, [user, fetchData]);

  async function updatePayment(id: string, status: string) {
    try { await axios.patch(`/api/payments/approve/${id}`, { status }); fetchData(); }
    catch { /* ignore */ }
  }

  function exportCSV() {
    const headers = ['Title', 'Game', 'Status', 'Players', 'MaxPlayers', 'EntryFee', 'PrizePool', 'Host', 'CreatedAt'];
    const rows = tournaments.map(t => [
      t.title, t.gameName, t.status, t.players.length, t.maxPlayers,
      t.entryFee, t.prizePool, (t.hostId as any)?.username || '',
      new Date(t.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `kill_pro_export_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteTournament(id: string) {
    if (!confirm('Delete this tournament? This cannot be undone.')) return;
    try { await axios.delete(`/api/tournaments/${id}`); fetchData(); }
    catch { /* ignore */ }
  }

  // ── Loading / auth guard ────────────────────────────────────────────────────
  if (authLoading || !user) return (
    <div className="ad-loading-guard">
      <div className="kp-spinner" />
    </div>
  );

  // ── Derived data ────────────────────────────────────────────────────────────
  const liveTournaments = tournaments.filter(t => t.status === 'live');
  const totalPrize      = tournaments.reduce((s, t) => s + t.prizePool, 0);
  const totalRevenue    = analytics?.totalRevenue || 0;

  const overviewStats = [
    { label: 'Tournaments', value: tournaments.length,              icon: Trophy     },
    { label: 'Live Now',    value: liveTournaments.length,          icon: TrendingUp },
    { label: 'Revenue',     value: `Rs.${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { label: 'Prize Pool',  value: `Rs.${totalPrize.toLocaleString()}`,   icon: BarChart2  },
    { label: 'Total Users', value: analytics?.totalPlayers || 0,   icon: Users      },
  ];

  const doughnutData = {
    labels: analytics?.perGameStats.map(g => g.game) || [],
    datasets: [{
      data:            analytics?.perGameStats.map(g => g.count) || [],
      backgroundColor: DOUGHNUT_COLORS.bg,
      borderColor:     DOUGHNUT_COLORS.border,
      borderWidth: 1.5,
    }],
  };

  const revenueData = {
    labels: analytics?.monthlyRevenue.map(m => m.month) || [],
    datasets: [{
      label:           'Revenue (Rs.)',
      data:            analytics?.monthlyRevenue.map(m => m.revenue) || [],
      borderColor:     '#1A1C1E',
      backgroundColor: 'rgba(26,28,30,0.04)',
      fill:            true,
      tension:         0.4,
      pointBackgroundColor: '#fff',
      pointBorderColor:     '#1A1C1E',
      pointRadius: 4,
    }],
  };

  const TABS: Tab[] = ['overview', 'tournaments', 'payments'];
  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="ad-page">
      <div className="kp-wrap ad-inner">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="ad-page-header animate-in-d0">
          <div>
            <div className="ad-page-eyebrow">
              <Shield size={13} />
              Admin Dashboard
            </div>
            <h1 className="ad-page-title">
              Kill Pro <em className="kp-headline-em">Admin</em>
            </h1>
          </div>
          <button onClick={exportCSV} className="btn-secondary ad-export-btn">
            <Download size={15} /> Export CSV
          </button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="ad-tabs animate-in-d1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`ad-tab ${activeTab === tab ? 'ad-tab-active' : ''}`}
            >
              {tab}
              {tab === 'payments' && pendingPayments > 0 && (
                <span className="ad-tab-badge">{pendingPayments}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="ad-tab-content animate-in">

            {/* Stat cards */}
            <div className="ad-stat-grid">
              {overviewStats.map((s, i) => (
                <div key={s.label} className={`card-clean ad-stat-card ${loading ? 'stat-hidden' : 'stat-visible'}`} style={{ transitionDelay: `${i * 0.08}s` }}>
                  <div className="ad-stat-icon">
                    <s.icon size={16} />
                  </div>
                  <div className="ad-stat-value">{s.value}</div>
                  <div className="ad-stat-label">{s.label}</div>
                  <div className="kp-bar-track" style={{ marginTop: 14 }}>
                    <div className="kp-bar" style={{ width: `${Math.min(100, Number(s.value) || 60)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="ad-charts-grid">
              {/* Doughnut */}
              <div className="card-clean ad-chart-card">
                <div className="ad-chart-header">
                  <BarChart2 size={14} />
                  <span>Game Distribution</span>
                </div>
                <div className="ad-chart-body">
                  {(analytics?.perGameStats?.length ?? 0) > 0
                    ? <Doughnut data={doughnutData} options={CHART_OPTS_DOUGHNUT} />
                    : <div className="ad-chart-empty">No data yet</div>
                  }
                </div>
              </div>

              {/* Line */}
              <div className="card-clean ad-chart-card ad-chart-wide">
                <div className="ad-chart-header">
                  <TrendingUp size={14} />
                  <span>Revenue Trend</span>
                </div>
                <div className="ad-chart-body">
                  {(revenueData.labels?.length ?? 0) > 0
                    ? <Line data={revenueData} options={CHART_OPTS_LINE} />
                    : <div className="ad-chart-empty">No revenue data yet</div>
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TOURNAMENTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'tournaments' && (
          <div className="card-clean ad-table-card animate-in">
            {/* Table header */}
            <div className="ad-table-header">
              <div>
                <div className="ad-table-title">All Tournaments</div>
                <div className="ad-table-sub">{tournaments.length} total</div>
              </div>
            </div>

            <div className="ad-table-scroll">
              <table className="ad-table">
                <thead>
                  <tr className="ad-thead-row">
                    {['Tournament', 'Game', 'Host', 'Status', 'Players', 'Prize', ''].map(h => (
                      <th key={h} className="ad-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="ad-td-center">
                        <Loader2 size={20} className="ad-loader" />
                      </td>
                    </tr>
                  ) : tournaments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="ad-td-center ad-td-empty">No tournaments found</td>
                    </tr>
                  ) : tournaments.map(t => (
                    <tr key={t._id} className="ad-tr">
                      <td className="ad-td">
                        <Link href={`/tournaments/${t._id}`} className="ad-link">
                          {t.title}
                        </Link>
                      </td>
                      <td className="ad-td ad-td-muted">{t.gameName}</td>
                      <td className="ad-td ad-td-faint">{(t.hostId as any)?.username}</td>
                      <td className="ad-td">
                        <span className={
                          t.status === 'live'     ? 'badge-live'     :
                          t.status === 'upcoming' ? 'badge-upcoming' : 'badge-finished'
                        }>
                          {t.status}
                        </span>
                      </td>
                      <td className="ad-td ad-td-bold">{t.players.length}/{t.maxPlayers}</td>
                      <td className="ad-td ad-td-prize">Rs.{t.prizePool.toLocaleString()}</td>
                      <td className="ad-td">
                        {t.status === 'upcoming' && (
                          <button
                            onClick={() => deleteTournament(t._id)}
                            className="ad-icon-btn ad-icon-btn-danger"
                            title="Delete tournament"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PAYMENTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'payments' && (
          <div className="card-clean ad-table-card animate-in">
            {/* Table header */}
            <div className="ad-table-header">
              <div>
                <div className="ad-table-title">Payments</div>
                {pendingPayments > 0 && (
                  <div className="ad-table-sub">
                    <span className="ad-pending-pill">{pendingPayments} pending review</span>
                  </div>
                )}
              </div>
            </div>

            <div className="ad-table-scroll">
              <table className="ad-table">
                <thead>
                  <tr className="ad-thead-row">
                    {['User', 'Type', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} className="ad-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="ad-td-center">
                        <Loader2 size={20} className="ad-loader" />
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="ad-td-center ad-td-empty">No payments found</td>
                    </tr>
                  ) : payments.map(p => (
                    <tr key={p._id} className="ad-tr">

                      {/* User */}
                      <td className="ad-td">
                        <div className="ad-td-bold" style={{ fontSize: 13 }}>
                          {(p.playerId as any)?.username || 'User'}
                        </div>
                        <div className="ad-td-faint">{(p.playerId as any)?.email}</div>
                      </td>

                      {/* Type */}
                      <td className="ad-td">
                        <span className={`ad-type-pill ${p.type === 'deposit' ? 'ad-type-deposit' : 'ad-type-withdraw'}`}>
                          {p.type === 'deposit'
                            ? <ArrowUpRight size={11} />
                            : <ArrowDownLeft size={11} />
                          }
                          {p.type}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="ad-td">
                        <span className="ad-amount">Rs.{p.amount.toLocaleString()}</span>
                      </td>

                      {/* Status */}
                      <td className="ad-td">
                        <span className={`ad-status-pill ${
                          p.status === 'confirmed' ? 'ad-status-confirmed' :
                          p.status === 'pending'   ? 'ad-status-pending'   :
                          'ad-status-failed'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="ad-td ad-td-faint">
                        {new Date(p.timestamp).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="ad-td">
                        {p.status === 'pending' && (
                          <div className="ad-action-row">
                            <button
                              onClick={() => updatePayment(p._id, 'confirmed')}
                              className="ad-icon-btn ad-icon-btn-confirm"
                              title="Confirm payment"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => updatePayment(p._id, 'failed')}
                              className="ad-icon-btn ad-icon-btn-danger"
                              title="Reject payment"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
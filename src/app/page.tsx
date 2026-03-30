'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Trophy, Users, Shield, ArrowRight, Globe,
  ChevronRight, Target, TrendingUp, Award, Gamepad2,
} from 'lucide-react';
import TournamentCard from '@/components/tournaments/TournamentCard';
import dynamicImport from 'next/dynamic';
import type { ITournament } from '@/types';

// Responsive styles live in a plain CSS file — no inline <style> = no hydration mismatch
import './home.mobile.css';

const HeroBackground = dynamicImport(
  () => import('@/components/effects/HeroBackground'),
  { ssr: false },
);

// ─── DATA ─────────────────────────────────────────────────────────────────────

const PLATFORM_STATS = [
  { label: 'Active Tournaments', value: '140+',   icon: Target, bar: 65 },
  { label: 'Players',            value: '12K+',   icon: Users,  bar: 88 },
  { label: 'Prize Pool',         value: '$450K+', icon: Award,  bar: 72 },
  { label: 'Regions',            value: '38+',    icon: Globe,  bar: 50 },
];

const FEATURES = [
  { title: 'Verified Entry',  icon: Shield,     desc: 'Secure tournament entry with host-verified payment confirmation.', bar: 72 },
  { title: 'Live Tracking',   icon: TrendingUp, desc: 'Real-time player count, status updates, and result tracking.',     bar: 88 },
  { title: 'Instant Payouts', icon: Trophy,     desc: 'Winners are notified instantly and prizes distributed by hosts.',  bar: 60 },
];

const GAMES = [
  { name: 'PUBG Mobile',  players: '8.4K+', icon: '🎮', thumbClass: 'game-thumb-1' },
  { name: 'Free Fire',    players: '3.8K+', icon: '🔥', thumbClass: 'game-thumb-2' },
  { name: 'Call of Duty', players: '2.1K+', icon: '⚡', thumbClass: 'game-thumb-3' },
];

const QUICK_STATS = [
  { value: '12K+',   label: 'Active Players' },
  { value: '$450K+', label: 'Prize Pool'      },
  { value: '140+',   label: 'Tournaments'     },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [liveTournaments, setLiveTournaments] = useState<ITournament[]>([]);
  const [loading, setLoading]                 = useState(true);
  const statsRef                              = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible]       = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
      { threshold: 0.2 },
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    axios
      .get('/api/tournaments?status=live&limit=4')
      .then(r => setLiveTournaments(r.data.data.tournaments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="kp-page">
      <HeroBackground />

      {/* ════════════════════════════ HERO ═══════════════════════════════════ */}
      <section className="kp-hero-section light-grid">
        <div className="deco-ring"        style={{ width: 520, height: 520, top: -130, right: -90 }} />
        <div className="deco-ring-dashed" style={{ width: 320, height: 320, top: 60,   right: 150 }} />
        <div className="deco-ring"        style={{ width: 210, height: 210, bottom: 50, left: -65, animationDuration: '24s' }} />

        {/* Mobile-only: hero image rendered as full-bleed background via CSS */}
        <div
          className="kp-hero-mobile-bg"
          aria-hidden="true"
          style={{ backgroundImage: 'url(/images/image.jpeg)' }}
        />

        <div className="kp-wrap kp-hero-inner">

          {/* LEFT */}
          <div className="kp-hero-left">
            <div className="pill-tag animate-in-d0" style={{ marginBottom: 32, width: 'fit-content' }}>
              <span className="live-dot" />
              Platform is Live
            </div>

            <h1 className="kp-headline animate-in-d1">
              Compete.<br />Win.<br />
              <em className="kp-headline-em">Level Up.</em>
            </h1>

            <p className="kp-subtext animate-in-d2">
              The premier tournament platform for{' '}
              <strong className="kp-subtext-strong">PUBG &amp; Free Fire</strong>{' '}
              mobile esports. Join tournaments, prove your skill, and win real prizes.
            </p>

            <div className="kp-cta-row animate-in-d2">
              <Link href="/tournaments" className="btn-primary">
                <Trophy size={16} />
                Browse Tournaments
                <ArrowRight size={15} />
              </Link>
              <Link href="/auth/register" className="btn-secondary">
                Create Account
              </Link>
            </div>

            <div className="kp-quick-stats animate-in-d3">
              {QUICK_STATS.map((s, i) => (
                <div key={s.label} className="kp-qs-item">
                  {i > 0 && <div className="kp-qs-divider" />}
                  <div>
                    <div className="kp-qs-value">{s.value}</div>
                    <div className="kp-qs-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — desktop-only soldiers image */}
          <div
            className="kp-hero-right animate-in-d1"
            style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}
          >
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse 70% 60% at 50% 80%, rgba(var(--kp-accent-rgb, 255,160,40), 0.18) 0%, transparent 70%)',
                zIndex: 0, pointerEvents: 'none',
              }}
            />
            <div className="kp-ghost-card kp-ghost-back" style={{ position: 'absolute', zIndex: 0 }} />
            <div className="kp-ghost-card kp-ghost-mid"  style={{ position: 'absolute', zIndex: 1 }} />

            <img
              src="/images/image.jpeg"
              alt="Elite soldiers — compete and win"
              style={{
                position: 'relative', zIndex: 2,
                width: '100%', maxWidth: 480, height: 'auto', display: 'block',
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0%, black 18%, black 72%, transparent 100%), ' +
                  'linear-gradient(to right,  transparent 0%, black 12%, black 88%, transparent 100%)',
                WebkitMaskComposite: 'intersect',
                maskImage:
                  'linear-gradient(to bottom, transparent 0%, black 18%, black 72%, transparent 100%), ' +
                  'linear-gradient(to right,  transparent 0%, black 12%, black 88%, transparent 100%)',
                maskComposite: 'intersect',
                filter: 'contrast(1.04) saturate(0.88)',
                transform: 'translateX(270px)',
              }}
            />
            <div
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
                background: 'linear-gradient(to top, rgba(var(--kp-accent-rgb, 255,140,20), 0.10) 0%, transparent 100%)',
                zIndex: 3, pointerEvents: 'none',
              }}
            />
          </div>

        </div>
      </section>

      {/* ════════════════════════ FEATURES ═══════════════════════════════════ */}
      <section className="kp-section kp-section-white">
        <div className="kp-wrap">
          <div className="kp-section-header">
            <div>
              <div className="section-label" style={{ marginBottom: 10 }}>
                <Shield size={12} /> Platform Features
              </div>
              <h2 className="kp-section-title">Built for Competitors</h2>
            </div>
            <p className="kp-section-desc">
              Every feature is designed around one goal — making competitive mobile
              esports accessible, fair, and rewarding.
            </p>
          </div>

          <div className="kp-feat-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="card-clean kp-feat-card">
                <div className="kp-feat-icon-wrap"><f.icon size={20} /></div>
                <div className="kp-feat-index">0{i + 1}</div>
                <div className="kp-feat-title">{f.title}</div>
                <p className="kp-feat-desc">{f.desc}</p>
                <div className="kp-bar-track" style={{ marginTop: 20 }}>
                  <div className="kp-bar" style={{ width: `${f.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════ GAMES ════════════════════════════════════ */}
      <section className="kp-section kp-section-muted">
        <div className="kp-wrap">
          <div className="kp-section-header">
            <div>
              <div className="section-label" style={{ marginBottom: 10 }}>
                <Gamepad2 size={12} /> Popular Games
              </div>
              <h2 className="kp-section-title">Choose Your Battleground</h2>
            </div>
            <Link href="/tournaments" className="btn-outline">
              All Games <ChevronRight size={13} />
            </Link>
          </div>

          <div className="kp-games-grid">
            {GAMES.map(game => (
              <div key={game.name} className="card-clean kp-game-card">
                <div className={`kp-game-thumb ${game.thumbClass}`}>
                  <span className="kp-game-icon">{game.icon}</span>
                  <span className="kp-game-pill">{game.players}</span>
                </div>
                <div className="kp-game-body">
                  <div className="kp-game-name">{game.name}</div>
                  <div className="kp-game-footer">
                    <span className="kp-game-players">{game.players} active players</span>
                    <Link href={`/tournaments?game=${game.name}`} className="kp-game-join">
                      Join <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ LIVE TOURNAMENTS ════════════════════════════════ */}
      <section className="kp-section kp-section-white">
        <div className="kp-wrap-w">
          <div className="kp-section-header">
            <div>
              <div className="section-label" style={{ marginBottom: 10 }}>
                <span className="live-dot" /> Live Now
              </div>
              <h2 className="kp-section-title">Featured Tournaments</h2>
              <p className="kp-tourn-sub">Tournaments currently accepting players or in progress.</p>
            </div>
            <Link href="/tournaments" className="btn-primary" style={{ padding: '11px 22px', fontSize: 13 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="kp-loading-state">
              <div className="kp-spinner" />
              <span className="kp-loading-text">Loading tournaments…</span>
            </div>
          ) : liveTournaments.length === 0 ? (
            <div className="kp-empty-state">
              <div className="kp-empty-icon"><Globe size={24} /></div>
              <div className="kp-empty-title">No Live Tournaments</div>
              <p className="kp-empty-desc">Check back soon for new tournaments</p>
              <Link href="/tournaments" className="btn-primary" style={{ padding: '11px 22px', fontSize: 13 }}>
                Browse All <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="kp-tourn-grid">
              {liveTournaments.map(t => (
                <div key={t._id} className="card-clean" style={{ borderRadius: 14, overflow: 'hidden' }}>
                  <TournamentCard tournament={t} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ PLATFORM STATS ══════════════════════════════════ */}
      <section ref={statsRef} className="kp-section kp-section-muted kp-section-bordered">
        <div className="kp-wrap">
          <div style={{ marginBottom: 48 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Platform Statistics</div>
            <h2 className="kp-section-title">Real-time metrics</h2>
          </div>

          <div className="kp-stats-grid">
            {PLATFORM_STATS.map((s, i) => (
              <div
                key={s.label}
                className={`card-clean kp-stat-card ${statsVisible ? 'stat-visible' : 'stat-hidden'}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="kp-stat-icon"><s.icon size={18} /></div>
                <div className="kp-stat-value">{s.value}</div>
                <div className="kp-stat-label">{s.label}</div>
                <div className="kp-bar-track" style={{ marginTop: 16 }}>
                  <div className="kp-bar" style={{ width: `${s.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ CTA ══════════════════════════════════════ */}
      <section className="kp-cta-section light-grid">
        <div className="deco-ring"        style={{ width: 480, height: 480, top: -140, right: -80,  opacity: 0.6 }} />
        <div className="deco-ring-dashed" style={{ width: 280, height: 280, bottom: -70, left: -40, opacity: 0.5 }} />

        <div className="kp-wrap kp-cta-inner">
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: 16 }}>
            Ready to Compete?
          </div>
          <h2 className="kp-cta-title">
            Join the Elite.<br />
            <em className="kp-cta-em">Play Without Limits.</em>
          </h2>
          <p className="kp-cta-body">
            Thousands of players compete every week. Register your team,
            find your tournament, and start climbing the ranks today.
          </p>
          <div className="kp-cta-btns">
            <Link href="/tournaments" className="btn-primary">
              <Trophy size={16} /> Join Tournament
            </Link>
            <Link href="/auth/register" className="btn-secondary">
              <Users size={16} /> Create Account
            </Link>
          </div>
          <div className="kp-divider kp-cta-divider" />
          <div className="kp-trust-row">
            {['No credit card required', 'Instant access', 'Secure & private'].map((t, i) => (
              <div key={t} className="kp-trust-item">
                {i > 0 && <div className="kp-trust-sep" />}
                <span className="kp-trust-dot" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
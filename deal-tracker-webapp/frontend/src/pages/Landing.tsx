import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AddTrackerForm, AuthCard, Brand, Button, DealBadge, NotificationRow, TrackerCard,
  type AuthMode, type TrackerFormValues,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { createTracker } from '../utils/trackers';
import type { PendingTrackerState } from './Trackers';
import './Landing.css';

const noop = () => {};

/** The dashboard preview below the fold: real components with sample data, not interactive. */
function DemoFrame() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.setAttribute('inert', ''); }, []);

  return (
    <div className="lp-stage">
      <div className="lp-glow" aria-hidden="true" />
      <div ref={ref} className="lp-frame" role="img" aria-label="Preview of the Deal Tracker dashboard">
        <div className="lp-bar"><i /><i /><i /><span className="lp-addr">Your trackers</span></div>
        <div className="lp-app">
          <div>
            <div className="lp-app-head">
              <div>
                <h3>Your trackers</h3>
                <p className="small">4 active · 1 offer live</p>
              </div>
              <Button variant="primary" size="sm">Track a new site</Button>
            </div>
            <div className="lp-cards">
              <TrackerCard store="Nordic Outdoor Store" url="nordicoutdoor.se/jackets" status="deal" deal={{ title: '20% off all jackets', detail: '€149 → €119 · ends Sunday' }} lastChecked="Found 12 min ago" onViewOffer={noop} />
              <TrackerCard store="Lindqvist Home" url="lindqvisthome.se" status="watching" watchFor="Any sitewide campaign" lastChecked="Checked 4 min ago" onTogglePause={noop} />
              <TrackerCard store="Sportkompaniet" url="sportkompaniet.se/lopskor" status="watching" watchFor="Any campaign on running shoes" lastChecked="Checked 9 min ago" onTogglePause={noop} />
              <TrackerCard store="Bokhandeln" url="bokhandeln.se/kampanj" status="paused" watchFor="Any campaign" lastChecked="Paused since 2 Oct" onTogglePause={noop} />
            </div>
          </div>
          <aside className="lp-panel">
            <div className="lp-panel-head"><h4 className="heading-3">Alerts</h4><DealBadge tone="deal">2 new</DealBadge></div>
            <p className="label lp-day">Today</p>
            <div className="lp-rows">
              <NotificationRow store="Nordic Outdoor Store" message="20% off all jackets, ends Sunday" time="12 min" unread />
              <NotificationRow store="Lindqvist Home" message="Free shipping over €50" time="1 h" unread />
            </div>
            <p className="label lp-day">Earlier</p>
            <div className="lp-rows">
              <NotificationRow store="Bokhandeln" message="3 for 2 on paperbacks ended" time="Mon" />
              <NotificationRow store="Sportkompaniet" message="Running shoes −25%" time="Sat" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function Landing({ mode: initialMode = 'register' }: { mode?: AuthMode }) {
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const authRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // A tracker filled in on the page before signing up; created once the account exists.
  const [pendingTracker, setPendingTracker] = useState<TrackerFormValues | null>(null);

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  useEffect(() => {
    if (!loading && user && !submitting) navigate('/dashboard', { replace: true });
  }, [user, loading, submitting, navigate]);

  const openAuth = (next: AuthMode) => {
    setMode(next);
    setError(undefined);
    const card = authRef.current;
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.querySelector('input')?.focus({ preventScroll: true });
  };

  const handleAuth = async (m: AuthMode, e: FormEvent<HTMLFormElement>) => {
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    setSubmitting(true);
    setError(undefined);
    const err = m === 'register' ? await register(email, password) : await login(email, password);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }
    const trackerError = pendingTracker && await createTracker(pendingTracker);
    // If the tracker couldn't be created, reopen the form on the dashboard with the values and the reason.
    const state: PendingTrackerState | null = trackerError ? { pendingTracker: pendingTracker!, error: trackerError } : null;
    navigate('/dashboard', { replace: true, state });
  };

  const handleTracker = (values: TrackerFormValues) => {
    setPendingTracker(values);
    openAuth('register');
  };

  return (
    <div className="lp">
      <section className="lp-hero">
        <header className="lp-wrap lp-nav">
          <Brand to="/landing" mark={false} />
          <nav className="lp-nav-links" aria-label="Main">
            <a href="#how">How it works</a>
            <a href="#demo">See it live</a>
          </nav>
        </header>

        <div className="lp-wrap lp-hero-grid">
          <div>
            <h1>Know the moment your favourite stores <em>go on sale.</em></h1>
            <p className="lp-lede">Add any online store. We’ll alert you when a campaign goes live.</p>
          </div>
          <div ref={authRef}>
            <AuthCard
              mode={mode}
              onModeChange={(m) => { setMode(m); setError(undefined); }}
              onSubmit={handleAuth}
              collectName={false}
              finePrint={{
                register: pendingTracker
                  ? `We’ll start tracking ${pendingTracker.name || pendingTracker.url} as soon as your account is ready.`
                  : 'Free account. No card needed.',
              }}
              submitting={submitting}
              error={error}
            />
          </div>
        </div>
        {/* The design's StatTile row goes here once a public stats endpoint can back the numbers with real data. */}
      </section>

      <section className="lp-section" id="demo">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <h2>Your stores, watched while you’re away</h2>
          </div>
          <DemoFrame />
        </div>
      </section>

      <section className="lp-section" id="how">
        <div className="lp-wrap lp-how">
          <div>
            <div className="lp-section-head lp-section-head--left">
              <h2>Set it up in a minute</h2>
            </div>
            <ol className="lp-steps">
              <li><span className="lp-num">1</span><div><h3>Add a site</h3><p>A store, a category or a single product.</p></div></li>
              <li><span className="lp-num">2</span><div><h3>Choose how often</h3><p>Every 30 minutes, hourly, or once a day.</p></div></li>
              <li><span className="lp-num">3</span><div><h3>Get the alert</h3><p>In the app or by email.</p></div></li>
            </ol>
          </div>
          <AddTrackerForm
            defaultValues={{ url: 'nordicoutdoor.se/jackets', name: 'Nordic Outdoor Store', frequency: 'PT1H' }}
            onSubmit={handleTracker}
          />
        </div>
      </section>

      <section className="lp-wrap">
        <footer className="small lp-foot">
          <span>© {new Date().getFullYear()} Deal Tracker</span>
        </footer>
      </section>
    </div>
  );
}

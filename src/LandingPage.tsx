import { Link } from "@tanstack/solid-router";
import { For, Show, createSignal } from "solid-js";
import { api } from "../convex/_generated/api";
import { Icon, type IconName } from "./components/Icon";
import { convex } from "./data/convex";
import { waitlistEntrySchema } from "./schemas";
import "./LandingPage.css";

const features: Array<{
  icon: IconName;
  tone: string;
  title: string;
  body: string;
}> = [
  {
    icon: "sparkle",
    tone: "violet",
    title: "Quick Capture",
    body: "Get a thought out of your head in seconds, then decide where it belongs later.",
  },
  {
    icon: "folder",
    tone: "green",
    title: "Organize by Areas",
    body: "Keep college, work, health, and personal life distinct without scattering your attention.",
  },
  {
    icon: "list",
    tone: "amber",
    title: "Everything is an Item",
    body: "Tasks, notes, events, expenses, and payments live together with the right context.",
  },
  {
    icon: "calendar",
    tone: "blue",
    title: "Plan with Clarity",
    body: "Move from a focused daily view to a complete week or agenda whenever you need it.",
  },
];

const steps: Array<{
  number: string;
  icon: IconName;
  title: string;
  body: string;
}> = [
  {
    number: "01",
    icon: "sparkle",
    title: "Capture",
    body: "Save what is on your mind before it gets lost.",
  },
  {
    number: "02",
    icon: "folder",
    title: "Organize",
    body: "Give it an Area, type, date, and the context it needs.",
  },
  {
    number: "03",
    icon: "checkSquare",
    title: "Act",
    body: "See the right things at the right time and make progress.",
  },
];

const showcases = [
  {
    image: "/screenshots/2.png",
    eyebrow: "Everything in context",
    title: "One calm home for every kind of item",
    body: "Open an Area to see tasks, notes, events, expenses, and payments together. Inspect or edit an item without losing your place.",
  },
  {
    image: "/screenshots/3.png",
    eyebrow: "A week you can understand",
    title: "Plan visually without the calendar clutter",
    body: "See dated work across the week, open any day, and create a new item directly where it belongs.",
  },
  {
    image: "/screenshots/4.png",
    eyebrow: "From overview to agenda",
    title: "Switch perspective, not tools",
    body: "Use Agenda when you want a clean chronological plan and Week when you need the bigger picture.",
  },
];

type FormErrors = { name?: string; email?: string; form?: string };

export function LandingPage() {
  const [errors, setErrors] = createSignal<FormErrors>({});
  const [joinedName, setJoinedName] = createSignal<string | null>(null);
  const [submitting, setSubmitting] = createSignal(false);

  const submitWaitlist = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const parsed = waitlistEntrySchema.safeParse({
      name: data.get("name"),
      email: data.get("email"),
      createdAt: new Date().toISOString(),
    });

    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "name" && !next.name) next.name = issue.message;
        if (issue.path[0] === "email" && !next.email)
          next.email = issue.message;
      }
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      await convex.mutation(api.waitlist.join, {
        name: parsed.data.name,
        email: parsed.data.email,
      });
      setErrors({});
      setJoinedName(parsed.data.name);
      form.reset();
    } catch {
      setErrors({
        form: "We could not save your spot right now. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main class="landing-page">
      <div class="landing-glow landing-glow-one" />
      <div class="landing-glow landing-glow-two" />

      <header class="landing-nav-wrap">
        <nav class="landing-nav" aria-label="Main navigation">
          <a class="landing-brand" href="#top" aria-label="Life OS home">
            <span class="landing-logo">
              <Icon name="sparkle" size={20} />
            </span>
            <span>Life OS</span>
          </a>
          <div class="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#product">Product</a>
          </div>
          <div class="landing-nav-actions">
            <a class="landing-button landing-button-small" href="#waitlist">
              Join waitlist <span aria-hidden="true">→</span>
            </a>
          </div>
        </nav>
      </header>

      <section class="landing-hero landing-container" id="top">
        <div class="hero-copy">
          <div class="landing-kicker">
            <Icon name="sparkle" size={16} /> Your life. Organized.
          </div>
          <h1>
            A personal OS for your <span>whole life.</span>
          </h1>
          <p class="hero-lede">
            Capture what matters, organize every part of your life, and plan
            your time with clarity—without stitching together five different
            apps.
          </p>
          <div class="hero-pills" aria-label="Life areas">
            <span>
              <Icon name="graduation" size={15} /> College
            </span>
            <span>
              <Icon name="briefcase" size={15} /> Work
            </span>
            <span>
              <Icon name="folder" size={15} /> Projects
            </span>
            <span>
              <Icon name="heartPulse" size={15} /> Health
            </span>
          </div>
          <div class="hero-actions">
            <a class="landing-button" href="#waitlist">
              Get early access <span aria-hidden="true">→</span>
            </a>
            <a class="landing-secondary" href="#product">
              <span class="play-icon">▶</span> See how it works
            </a>
          </div>
          <div class="hero-trust">
            <div class="trust-faces" aria-hidden="true">
              <span>J</span>
              <span>M</span>
              <span>A</span>
            </div>
            <div>
              <strong>Built for real life</strong>
              <small>One thoughtful system, every part of you.</small>
            </div>
          </div>
        </div>

        <div class="hero-visual" aria-label="Life OS Areas dashboard preview">
          <div class="hero-orbit orbit-one">
            <Icon name="checkSquare" size={21} />
          </div>
          <div class="hero-orbit orbit-two">
            <Icon name="calendar" size={21} />
          </div>
          <div class="product-window product-window-hero">
            <div class="window-bar">
              <i />
              <i />
              <i />
              <span>Life OS</span>
            </div>
            <img
              src="/screenshots/1.png"
              alt="Life OS Areas dashboard showing six organized life areas"
            />
          </div>
          <div class="hero-float-card float-capture">
            <span class="float-icon">
              <Icon name="sparkle" size={18} />
            </span>
            <div>
              <strong>Quick Capture</strong>
              <small>Thought saved to Inbox</small>
            </div>
            <span class="float-check">✓</span>
          </div>
          <div class="hero-float-card float-week">
            <span class="float-date">15</span>
            <div>
              <strong>Your week is ready</strong>
              <small>4 items planned</small>
            </div>
          </div>
        </div>
      </section>

      <section
        class="landing-feature-strip landing-container"
        id="features"
        aria-label="Life OS features"
      >
        <For each={features}>
          {(feature) => (
            <article class="landing-feature-card">
              <span class={`feature-icon feature-${feature.tone}`}>
                <Icon name={feature.icon} size={23} />
              </span>
              <div>
                <h2>{feature.title}</h2>
                <p>{feature.body}</p>
              </div>
            </article>
          )}
        </For>
      </section>

      <section class="flow-section" id="how-it-works">
        <div class="landing-container">
          <div class="section-heading centered-heading">
            <span class="section-eyebrow">A better flow</span>
            <h2>Less chaos. More clarity.</h2>
            <p>A simple rhythm that helps you focus on what counts.</p>
          </div>
          <div class="flow-track">
            <For each={steps}>
              {(step, index) => (
                <article class="flow-step">
                  <span class="flow-number">{step.number}</span>
                  <span class="flow-icon">
                    <Icon name={step.icon} size={28} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <Show when={index() < steps.length - 1}>
                    <span class="flow-arrow" aria-hidden="true">
                      →
                    </span>
                  </Show>
                </article>
              )}
            </For>
          </div>
        </div>
      </section>

      <section class="product-section landing-container" id="product">
        <div class="section-heading product-heading">
          <div>
            <span class="section-eyebrow">One connected system</span>
            <h2>Every part of life, finally in one place.</h2>
          </div>
          <p>
            Life OS keeps the details close without letting them take over. Move
            naturally from capture to context to a plan you can act on.
          </p>
        </div>

        <div class="areas-showcase">
          <div class="areas-showcase-copy">
            <span class="showcase-count">01</span>
            <span class="section-eyebrow">Your life at a glance</span>
            <h3>Give every responsibility a clear home</h3>
            <p>
              Areas create calm boundaries around the parts of life that matter,
              while your Inbox stays ready for anything new.
            </p>
            <ul>
              <li>
                <span>✓</span> Flexible Areas for the way you actually live
              </li>
              <li>
                <span>✓</span> A single Inbox for fast, frictionless capture
              </li>
              <li>
                <span>✓</span> Simple visual cues that stay easy to scan
              </li>
            </ul>
          </div>
          <div class="product-window showcase-window">
            <img
              src="/screenshots/1.png"
              alt="Areas dashboard with Inbox and color-coded Area cards"
              loading="lazy"
            />
          </div>
        </div>

        <div class="showcase-grid">
          <For each={showcases}>
            {(showcase, index) => (
              <article class="showcase-card">
                <div class="showcase-card-copy">
                  <span class="showcase-count">0{index() + 2}</span>
                  <span class="section-eyebrow">{showcase.eyebrow}</span>
                  <h3>{showcase.title}</h3>
                  <p>{showcase.body}</p>
                </div>
                <div class="product-window">
                  <img
                    src={showcase.image}
                    alt={showcase.title}
                    loading="lazy"
                  />
                </div>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="waitlist-section landing-container" id="waitlist">
        <div class="waitlist-copy">
          <span class="waitlist-spark">
            <Icon name="sparkle" size={30} />
          </span>
          <span class="section-eyebrow">Early access</span>
          <h2>Your life deserves one clear system.</h2>
          <p>
            Join the waitlist to be among the first to shape Life OS and receive
            private beta access.
          </p>
          <div class="waitlist-notes">
            <span>✓ No spam</span>
            <span>✓ Early product updates</span>
            <span>✓ Founding member access</span>
          </div>
        </div>

        <div class="waitlist-card">
          <Show
            when={joinedName()}
            keyed
            fallback={
              <form onSubmit={submitWaitlist} novalidate>
                <div class="waitlist-form-heading">
                  <h3>Save your spot</h3>
                  <p>It takes less than a minute.</p>
                </div>
                <label for="waitlist-name">Your name</label>
                <div class="landing-input-wrap">
                  <Icon name="user" size={18} />
                  <input
                    id="waitlist-name"
                    name="name"
                    type="text"
                    autocomplete="name"
                    placeholder="Alex Morgan"
                    aria-invalid={errors().name ? "true" : "false"}
                  />
                </div>
                <Show when={errors().name}>
                  <p class="field-error">{errors().name}</p>
                </Show>
                <label for="waitlist-email">Email address</label>
                <div class="landing-input-wrap">
                  <span class="mail-icon">@</span>
                  <input
                    id="waitlist-email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    placeholder="alex@example.com"
                    aria-invalid={errors().email ? "true" : "false"}
                  />
                </div>
                <Show when={errors().email}>
                  <p class="field-error">{errors().email}</p>
                </Show>
                <Show when={errors().form}>
                  <p class="form-error">{errors().form}</p>
                </Show>
                <button
                  class="landing-button waitlist-submit"
                  type="submit"
                  disabled={submitting()}
                >
                  {submitting()
                    ? "Saving your spot…"
                    : "Join the early access waitlist"}{" "}
                  <Show when={!submitting()}>
                    <span aria-hidden="true">→</span>
                  </Show>
                </button>
                <small class="privacy-note">
                  By joining, you agree to receive occasional Life OS product
                  updates.
                </small>
              </form>
            }
          >
            {(name) => (
              <div class="waitlist-success" role="status">
                <span class="success-mark">✓</span>
                <span class="section-eyebrow">You’re on the list</span>
                <h3>Welcome, {name}.</h3>
                <p>
                  Your early-access spot is saved. We’ll keep you in the loop as
                  Life OS gets ready for launch.
                </p>
                <Link class="landing-secondary" to="/app/areas">
                  Explore the working preview <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </Show>
        </div>
      </section>

      <footer class="landing-footer landing-container">
        <a class="landing-brand" href="#top">
          <span class="landing-logo">
            <Icon name="sparkle" size={18} />
          </span>
          <span>Life OS</span>
        </a>
        <p>One place for the life you’re building.</p>
        <div>
          <a href="#features">Features</a>
          <a href="#product">Product</a>
        </div>
      </footer>
    </main>
  );
}

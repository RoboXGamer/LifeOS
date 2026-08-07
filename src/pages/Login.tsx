import { createSignal, Show } from "solid-js";
import { Link, useNavigate } from "@tanstack/solid-router";
import { api } from "../../convex/_generated/api";
import { authClient } from "../auth/client";
import { createQuery, toError } from "../convex";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const profile = createQuery(api.profiles.current, {}, {});
  const [mode, setMode] = createSignal<"signup" | "signin">("signup");
  const [identifier, setIdentifier] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (busy()) return;
    setBusy(true);
    setError(null);
    try {
      if (mode() === "signup") {
        const username = identifier().trim().toLowerCase();
        if (!/^[a-z0-9][a-z0-9_]{2,29}$/.test(username)) {
          throw new Error(
            "Username must be 3–30 lowercase letters, numbers, or _.",
          );
        }
        const result = await authClient.signUp.email({
          name: username,
          username,
          displayUsername: username,
          email: email().trim().toLowerCase(),
          password: password(),
        });
        if (result.error) {
          throw new Error(result.error.message ?? "Account creation failed.");
        }
      } else {
        const login = identifier().trim().toLowerCase();
        const result = login.includes("@")
          ? await authClient.signIn.email({
              email: login,
              password: password(),
            })
          : await authClient.signIn.username({
              username: login,
              password: password(),
            });
        if (result.error) {
          throw new Error(result.error.message ?? "Sign in failed.");
        }
      }
      authClient.$store.notify("$sessionSignal");
      void navigate({ to: "/app/areas", replace: true });
    } catch (reason) {
      setError(toError(reason).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section class="login-page">
      <Show
        when={profile()?.isAnonymous}
        fallback={
          <div class="login-card login-complete">
            <span>Account</span>
            <h1>You’re signed in</h1>
            <p>
              Your Life OS belongs to @{profile()?.username ?? "your account"}.
            </p>
            <Link to="/app/areas">Return to Areas</Link>
          </div>
        }
      >
        <div class="login-card">
          <span>Life OS account</span>
          <h1>{mode() === "signup" ? "Keep your Life OS" : "Welcome back"}</h1>
          <p>
            {mode() === "signup"
              ? "Create an account and keep this profile, its Workspaces, and all your Items."
              : "Sign in with your username or email. This anonymous Workspace will be preserved separately."}
          </p>

          <div class="login-tabs">
            <button
              type="button"
              class={{ active: mode() === "signup" }}
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
            >
              Create account
            </button>
            <button
              type="button"
              class={{ active: mode() === "signin" }}
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              Sign in
            </button>
          </div>

          <Show when={error()}>
            {(message) => (
              <p class="login-error" role="alert">
                {message()}
              </p>
            )}
          </Show>

          <form onSubmit={submit}>
            <label>
              <span>
                {mode() === "signup" ? "Username" : "Username or email"}
              </span>
              <input
                value={identifier()}
                autocomplete="username"
                autofocus
                required
                onInput={(event) => setIdentifier(event.currentTarget.value)}
              />
            </label>
            <Show when={mode() === "signup"}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email()}
                  autocomplete="email"
                  required
                  onInput={(event) => setEmail(event.currentTarget.value)}
                />
              </label>
            </Show>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password()}
                minlength="8"
                autocomplete={
                  mode() === "signup" ? "new-password" : "current-password"
                }
                required
                onInput={(event) => setPassword(event.currentTarget.value)}
              />
            </label>
            <button type="submit" disabled={busy()}>
              {busy()
                ? "Please wait…"
                : mode() === "signup"
                  ? "Create account"
                  : "Sign in and continue"}
            </button>
          </form>
        </div>
      </Show>
    </section>
  );
}

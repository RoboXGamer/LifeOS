import {
  Show,
  createContext,
  createSignal,
  onSettled,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
import { api } from "../../convex/_generated/api";
import { authClient } from "./client";
import { convex } from "../convex";

interface AuthState {
  ready: Accessor<boolean>;
  error: Accessor<string | null>;
  retry: () => void;
}

const AuthContext = createContext<AuthState>();

export function AuthProvider(props: ParentProps) {
  const [ready, setReady] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  let anonymousRequest: Promise<unknown> | null = null;
  let activeSessionId: string | null = null;
  let disposed = false;

  const bootstrapProfile = async () => {
    await convex.mutation(api.profiles.bootstrap, {});
    if (!disposed) {
      setError(null);
      setReady(true);
    }
  };

  const fetchAccessToken = async () => {
    const result = await authClient.convex.token({
      fetchOptions: { throw: false },
    });
    return result.data?.token ?? null;
  };

  const connectSession = (sessionId: string) => {
    if (activeSessionId === sessionId) return;
    activeSessionId = sessionId;
    setReady(false);
    convex.setAuth(fetchAccessToken, (isAuthenticated) => {
      if (!isAuthenticated || disposed) return;
      void bootstrapProfile().catch((reason: unknown) => {
        if (!disposed) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Life OS could not prepare your profile.",
          );
        }
      });
    });
  };

  const ensureAnonymousSession = () => {
    if (anonymousRequest || disposed) return;
    anonymousRequest = authClient.signIn
      .anonymous()
      .then((result) => {
        if (result.error) {
          throw new Error(
            result.error.message ?? "Anonymous access could not be created.",
          );
        }
        authClient.$store.notify("$sessionSignal");
      })
      .catch((reason: unknown) => {
        if (!disposed) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Anonymous access could not be created.",
          );
        }
      })
      .finally(() => {
        anonymousRequest = null;
      });
  };

  const retry = () => {
    setError(null);
    setReady(false);
    authClient.$store.notify("$sessionSignal");
    ensureAnonymousSession();
  };

  onSettled(() => {
    const unsubscribe = authClient.useSession.subscribe((snapshot) => {
      if (snapshot.isPending) return;
      const sessionId = snapshot.data?.session.id;
      if (sessionId) {
        connectSession(sessionId);
      } else {
        activeSessionId = null;
        convex.setAuth(async () => null);
        ensureAnonymousSession();
      }
    });

    return () => {
      disposed = true;
      unsubscribe();
      convex.setAuth(async () => null);
    };
  });

  const state: AuthState = { ready, error, retry };

  return (
    <AuthContext value={state}>
      <Show
        when={ready()}
        fallback={
          <main class="auth-bootstrap">
            <div class="auth-bootstrap-mark">L</div>
            <Show
              when={error()}
              fallback={
                <>
                  <strong>Preparing your Life OS</strong>
                  <p>Creating a private space for what matters.</p>
                </>
              }
            >
              {(message) => (
                <>
                  <strong>We couldn’t open your space</strong>
                  <p>{message()}</p>
                  <button type="button" onClick={retry}>
                    Try again
                  </button>
                </>
              )}
            </Show>
          </main>
        }
      >
        {props.children}
      </Show>
    </AuthContext>
  );
}

export function useAuthState(): AuthState {
  return useContext(AuthContext);
}

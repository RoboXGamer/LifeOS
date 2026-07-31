import { createSignal, For, Show } from "solid-js";
import { api } from "../../convex/_generated/api";
import { authClient } from "../auth/client";
import { createMutation, createQuery, toError } from "../convex";
import { useWorkspaces } from "../features/workspaces/context";
import "./Lifecycle.css";
import "./Organization.css";

export default function Settings() {
  const workspaces = useWorkspaces();
  const profile = createQuery(api.profiles.current, {}, {});
  const changeUsername = createMutation(api.profiles.changeUsername);
  const [username, setUsername] = createSignal("");
  const [workspaceName, setWorkspaceName] = createSignal("");
  const [message, setMessage] = createSignal<string | null>(null);
  const saveUsername = async () => {
    try {
      const normalized = username().trim().toLowerCase();
      const availability = await authClient.isUsernameAvailable({
        username: normalized,
      });
      if (availability.error) {
        throw new Error(
          availability.error.message ?? "Username availability check failed.",
        );
      }
      if (!availability.data?.available) {
        throw new Error("That username is already taken.");
      }
      await changeUsername({ username: normalized });
      const authUpdate = await authClient.updateUser({
        username: normalized,
        displayUsername: normalized,
      });
      if (authUpdate.error) {
        throw new Error(
          authUpdate.error.message ?? "Authentication username update failed.",
        );
      }
      setUsername("");
      setMessage("Username updated.");
    } catch (reason) {
      setMessage(toError(reason).message);
    }
  };
  const createWorkspace = () => {
    if (!workspaceName().trim()) return;
    workspaces.createWorkspace(workspaceName());
    setWorkspaceName("");
  };
  const signOut = async () => {
    const result = await authClient.signOut();
    if (result.error) setMessage(result.error.message ?? "Sign out failed.");
  };

  return (
    <section class="lifecycle-page">
      <header class="lifecycle-header">
        <span>Account</span>
        <h2>Settings</h2>
        <p>Identity, session, and Workspace essentials only.</p>
      </header>
      <Show when={message()}>
        {(value) => <p class="organization-message">{value()}</p>}
      </Show>
      <div class="settings-grid">
        <article class="settings-card">
          <span>Profile</span>
          <h3>{profile()?.username ? `@${profile()?.username}` : "Anonymous"}</h3>
          <p>
            {profile()?.isAnonymous
              ? "You can use Life OS immediately. Sign-up can make this data permanent later."
              : "This is a permanent Life OS account."}
          </p>
          <strong class="settings-value">
            {profile()?.email ?? "No email attached"}
          </strong>
        </article>
        <article class="settings-card">
          <span>Username</span>
          <h3>Change your public handle</h3>
          <p>
            Lowercase, globally unique, and changeable once every seven days.
          </p>
          <form
            class="settings-form"
            onSubmit={(event) => {
              event.preventDefault();
              void saveUsername();
            }}
          >
            <input
              value={username()}
              placeholder={profile()?.username ?? "username"}
              autocomplete="username"
              onInput={(event) => setUsername(event.currentTarget.value)}
            />
            <button type="submit" disabled={!username().trim()}>
              Save
            </button>
          </form>
        </article>
        <article class="settings-card">
          <span>Workspaces</span>
          <h3>Manage separate spaces</h3>
          <div class="workspace-settings-list">
            <For each={workspaces.state.workspaces} keyed={(space) => space.id}>
              {(space) => (
                <div class="workspace-setting">
                  <span>{space().name}</span>
                  <Show
                    when={space().id !== workspaces.state.activeWorkspaceId}
                    fallback={<small>Active</small>}
                  >
                    <button
                      type="button"
                      onClick={() => workspaces.selectWorkspace(space().id)}
                    >
                      Switch
                    </button>
                  </Show>
                </div>
              )}
            </For>
          </div>
          <form
            class="settings-form"
            onSubmit={(event) => {
              event.preventDefault();
              createWorkspace();
            }}
          >
            <input
              value={workspaceName()}
              placeholder="New Workspace name"
              onInput={(event) => setWorkspaceName(event.currentTarget.value)}
            />
            <button type="submit">Create</button>
          </form>
          <p>Rename and archive controls remain in the avatar menu.</p>
        </article>
        <article class="settings-card">
          <span>Session</span>
          <h3>{profile()?.isAnonymous ? "Anonymous session" : "Signed in"}</h3>
          <p>
            {profile()?.isAnonymous
              ? "Signing out of an anonymous session starts a fresh private space."
              : "Signing out disconnects this device without deleting your data."}
          </p>
          <Show
            when={!profile()?.isAnonymous}
            fallback={
              <p>
                Sign-out is hidden here because an anonymous space cannot yet
                be recovered. Make it permanent before leaving it.
              </p>
            }
          >
            <button type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          </Show>
        </article>
      </div>
    </section>
  );
}

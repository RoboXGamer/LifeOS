import { For, Show, createSignal } from "solid-js";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../Icon";
import Avatar from "../../Avatar";
import { createQuery } from "../../convex";
import { useWorkspaces } from "./context";
import "./WorkspaceMenu.css";

export function WorkspaceMenu() {
  const model = useWorkspaces();
  const [open, setOpen] = createSignal(false);
  const [creating, setCreating] = createSignal(false);
  const [renaming, setRenaming] = createSignal(false);
  const [archivedOpen, setArchivedOpen] = createSignal(false);
  const [deleteTarget, setDeleteTarget] =
    createSignal<Doc<"workspaces"> | null>(null);
  const removalImpact = createQuery(
    api.workspaces.removalImpact,
    () => {
      const workspace = deleteTarget();
      return workspace ? { workspaceId: workspace._id } : "skip";
    },
    { initialValue: undefined },
  );

  const submitCreate = (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const name = new FormData(form).get("workspaceName")?.toString() ?? "";
    model.createWorkspace(name);
    form.reset();
    setCreating(false);
  };

  const submitRename = (event: SubmitEvent) => {
    event.preventDefault();
    const workspace = model.activeWorkspace();
    if (!workspace) return;
    const name =
      new FormData(event.currentTarget as HTMLFormElement)
        .get("workspaceName")
        ?.toString() ?? "";
    model.renameWorkspace(workspace.id, name);
    setRenaming(false);
  };

  return (
    <div class="workspace-menu">
      <button
        type="button"
        class="workspace-trigger"
        aria-label="Switch Workspace"
        aria-expanded={open() ? "true" : "false"}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar
          size={40}
          fallback={(model.activeWorkspace()?.name ?? "Life")
            .slice(0, 2)
            .toUpperCase()}
        />
      </button>
      <Show when={open()}>
        <button
          class="workspace-menu-backdrop"
          aria-label="Close Workspace menu"
          onClick={() => setOpen(false)}
        />
        <section class="workspace-popover" aria-label="Workspaces">
          <header>
            <div>
              <span>Current Workspace</span>
              <strong>{model.activeWorkspace()?.name ?? "My Life"}</strong>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <Icon name="close" size={17} />
            </button>
          </header>

          <div class="workspace-list">
            <For each={model.state.workspaces}>
              {(workspace) => (
                <button
                  type="button"
                  class={{
                    selected: workspace.id === model.state.activeWorkspaceId,
                  }}
                  onClick={() => model.selectWorkspace(workspace.id)}
                >
                  <span>{workspace.name.slice(0, 1).toUpperCase()}</span>
                  <strong>{workspace.name}</strong>
                  <Show when={workspace.id === model.state.activeWorkspaceId}>
                    <small>Active</small>
                  </Show>
                </button>
              )}
            </For>
          </div>

          <Show when={model.error()}>
            {(message) => (
              <p class="workspace-error" role="alert">
                {message()}
              </p>
            )}
          </Show>

          <Show when={creating()}>
            <form class="workspace-form" onSubmit={submitCreate}>
              <input
                name="workspaceName"
                aria-label="Workspace name"
                placeholder="Workspace name"
                maxlength="80"
                autofocus
                required
              />
              <button type="submit">Create</button>
            </form>
          </Show>

          <Show when={renaming() && model.activeWorkspace()}>
            <form class="workspace-form" onSubmit={submitRename}>
              <input
                name="workspaceName"
                aria-label="New Workspace name"
                value={model.activeWorkspace()?.name}
                maxlength="80"
                autofocus
                required
              />
              <button type="submit">Save</button>
            </form>
          </Show>

          <footer>
            <button
              type="button"
              onClick={() => setCreating((value) => !value)}
            >
              <Icon name="plus" size={16} />
              New
            </button>
            <button
              type="button"
              onClick={() => setRenaming((value) => !value)}
            >
              <Icon name="edit" size={16} />
              Rename
            </button>
            <button
              type="button"
              class="danger"
              disabled={model.state.workspaces.length <= 1}
              onClick={() => {
                const workspace = model.activeWorkspace();
                if (workspace) model.archiveWorkspace(workspace.id);
              }}
            >
              <Icon name="archive" size={16} />
              Archive
            </button>
            <button
              type="button"
              onClick={() => setArchivedOpen((value) => !value)}
            >
              <Icon name="archive" size={16} />
              Archived
            </button>
          </footer>

          <Show when={archivedOpen()}>
            <div class="archived-workspaces">
              <For
                each={model.archivedWorkspaces()}
                fallback={<p>No archived Workspaces.</p>}
              >
                {(workspace) => (
                  <article>
                    <strong>{workspace.name}</strong>
                    <button
                      type="button"
                      onClick={() => model.restoreWorkspace(workspace._id)}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      class="danger"
                      onClick={() => setDeleteTarget({ ...workspace })}
                    >
                      Delete
                    </button>
                  </article>
                )}
              </For>
            </div>
          </Show>
        </section>
      </Show>
      <Show when={deleteTarget()} keyed>
        {(workspace) => (
          <WorkspaceDeleteDialog
            workspace={workspace}
            areaCount={removalImpact()?.areaCount}
            itemCount={removalImpact()?.itemCount}
            onClose={() => setDeleteTarget(null)}
            onConfirm={(confirmation) => {
              model.deleteWorkspace(workspace._id, confirmation);
              setDeleteTarget(null);
            }}
          />
        )}
      </Show>
    </div>
  );
}

function WorkspaceDeleteDialog(props: {
  workspace: Doc<"workspaces">;
  areaCount?: number;
  itemCount?: number;
  onClose: () => void;
  onConfirm: (confirmation: string) => void;
}) {
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const confirmation =
      new FormData(event.currentTarget as HTMLFormElement)
        .get("confirmation")
        ?.toString() ?? "";
    props.onConfirm(confirmation);
  };
  return (
    <div class="workspace-delete-backdrop">
      <section
        class="workspace-delete-dialog"
        role="alertdialog"
        aria-modal="true"
      >
        <span>Permanent deletion</span>
        <h3>Delete {props.workspace.name}?</h3>
        <p>
          This removes {props.areaCount ?? "all"} Areas and{" "}
          {props.itemCount ?? "all"} Items. It cannot be undone.
        </p>
        <form onSubmit={submit}>
          <label>
            Type “{props.workspace.name}” to confirm
            <input name="confirmation" autocomplete="off" autofocus required />
          </label>
          <footer>
            <button type="button" onClick={props.onClose}>
              Cancel
            </button>
            <button type="submit">Delete permanently</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

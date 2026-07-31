import {
  Errored,
  For,
  Loading,
  Show,
  action,
  createOptimisticStore,
  createSignal,
} from "solid-js";
import { Link } from "@tanstack/solid-router";
import { nanoid } from "nanoid";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { Icon, type IconName } from "../Icon";
import { createMutation, createQuery, toError } from "../convex";
import { useWorkspaces } from "../features/workspaces/context";
import "./Areas.css";

const areaIcons: IconName[] = [
  "folder",
  "graduation",
  "briefcase",
  "chart",
  "user",
  "heart",
  "heartPulse",
  "book",
  "monitor",
  "leaf",
];

interface AreaInput {
  name: string;
  description?: string;
  icon: string;
  color: string;
}

export default function Areas() {
  const workspaces = useWorkspaces();
  const [editor, setEditor] = createSignal<Doc<"areas"> | "new" | null>(null);
  const [archiveOpen, setArchiveOpen] = createSignal(false);
  const [deleteTarget, setDeleteTarget] = createSignal<Doc<"areas"> | null>(
    null,
  );
  const [error, setError] = createSignal<string | null>(null);

  const activeWorkspaceId = () => workspaces.state.activeWorkspaceId;
  const areaSource = createQuery(
    api.areas.list,
    () => {
      const workspaceId = activeWorkspaceId();
      return workspaceId ? { workspaceId } : "skip";
    },
    { initialValue: [] },
  );
  const archivedSource = createQuery(
    api.areas.listArchived,
    () => {
      const workspaceId = activeWorkspaceId();
      return workspaceId ? { workspaceId } : "skip";
    },
    { initialValue: [] },
  );
  const deleteImpact = createQuery(
    api.areas.removalImpact,
    () => {
      const area = deleteTarget();
      return area ? { areaId: area._id } : "skip";
    },
    { initialValue: undefined },
  );

  const [areas, setAreas] = createOptimisticStore<Doc<"areas">[]>(
    () => areaSource() ?? [],
    [],
    { key: "_id" },
  );
  const createAreaMutation = createMutation(api.areas.create);
  const updateAreaMutation = createMutation(api.areas.update);
  const archiveAreaMutation = createMutation(api.areas.setArchived);
  const removeAreaMutation = createMutation(api.areas.remove);

  const recordFailure = (reason: unknown) => setError(toError(reason).message);

  const createArea = action(function* (input: AreaInput) {
    const workspaceId = activeWorkspaceId();
    if (!workspaceId) return;
    setError(null);
    const now = Date.now();
    const tempId = `temp-${nanoid()}` as Id<"areas">;
    setAreas((draft) => {
      draft.push({
        _id: tempId,
        _creationTime: now,
        workspaceId,
        name: input.name,
        description: input.description,
        icon: input.icon,
        color: input.color,
        archived: false,
        createdAt: now,
        updatedAt: now,
      });
    });
    try {
      yield createAreaMutation({ workspaceId, ...input });
    } catch (reason) {
      recordFailure(reason);
    }
  });

  const updateArea = action(function* (areaId: Id<"areas">, input: AreaInput) {
    setError(null);
    setAreas((draft) => {
      const area = draft.find((item) => item._id === areaId);
      if (area) Object.assign(area, input, { updatedAt: Date.now() });
    });
    try {
      yield updateAreaMutation({ areaId, ...input });
    } catch (reason) {
      recordFailure(reason);
    }
  });

  const archiveArea = action(function* (areaId: Id<"areas">) {
    setError(null);
    setAreas((draft) => draft.filter((item) => item._id !== areaId));
    try {
      yield archiveAreaMutation({ areaId, archived: true });
    } catch (reason) {
      recordFailure(reason);
    }
  });

  const restoreArea = action(function* (areaId: Id<"areas">) {
    setError(null);
    try {
      yield archiveAreaMutation({ areaId, archived: false });
    } catch (reason) {
      recordFailure(reason);
    }
  });

  const deleteArea = action(function* (
    area: Doc<"areas">,
    confirmation: string,
  ) {
    setError(null);
    try {
      yield removeAreaMutation({ areaId: area._id, confirmation });
      setDeleteTarget(null);
    } catch (reason) {
      recordFailure(reason);
    }
  });

  const saveArea = (input: AreaInput) => {
    const current = editor();
    if (current === "new") createArea(input);
    else if (current) updateArea(current._id, input);
    queueMicrotask(() => setEditor(null));
  };

  return (
    <section class="areas-page">
      <header class="areas-header">
        <div>
          <span>{workspaces.activeWorkspace()?.name ?? "My Life"}</span>
          <h2>Areas</h2>
          <p>The parts of life you want to keep intentionally in view.</p>
        </div>
        <div>
          <button
            type="button"
            class="secondary-action"
            onClick={() => setArchiveOpen(true)}
          >
            <Icon name="archive" size={17} />
            Archived
          </button>
          <button
            type="button"
            class="primary-action"
            onClick={() => setEditor("new")}
          >
            <Icon name="plus" size={18} />
            New Area
          </button>
        </div>
      </header>

      <Show when={error()}>
        {(message) => (
          <p class="areas-error" role="alert">
            {message()}
            <button type="button" onClick={() => setError(null)}>
              Dismiss
            </button>
          </p>
        )}
      </Show>

      <Errored
        fallback={(reason) => <p class="areas-error">{String(reason)}</p>}
      >
        <Loading fallback={<AreasSkeleton />}>
          <Show
            when={areas.length > 0}
            fallback={
              <div class="areas-empty">
                <span>
                  <Icon name="grid" size={27} />
                </span>
                <h3>Create your first Area</h3>
                <p>
                  Start with one part of life you want to protect from drift.
                </p>
                <button type="button" onClick={() => setEditor("new")}>
                  Create an Area
                </button>
              </div>
            }
          >
            <div class="areas-grid">
              <For each={areas} keyed={(area) => area._id}>
                {(area) => (
                  <article
                    class="area-item"
                    style={{ "--_deco-color": area().color }}
                  >
                    <Link
                      class="area-card-link"
                      to="/app/areas/$areaId"
                      params={{ areaId: area()._id }}
                      aria-label={`Open ${area().name}`}
                    >
                      <div class="deco">
                        <div class="deco-blobs">
                          <span class="shape shape-a" />
                          <span class="shape shape-b" />
                        </div>
                        <Icon
                          name={area().icon as IconName}
                          size={40}
                          strokeWidth={1.3}
                        />
                      </div>
                    </Link>
                    <div class="area-title">
                      <Icon name={area().icon as IconName} />
                      <div>
                        <h3>{area().name}</h3>
                        <Show when={area().description}>
                          <p>{area().description}</p>
                        </Show>
                      </div>
                      <div class="area-actions">
                        <button
                          type="button"
                          aria-label={`Edit ${area().name}`}
                          onClick={() => setEditor({ ...area() })}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Archive ${area().name}`}
                          onClick={() => archiveArea(area()._id)}
                        >
                          <Icon name="archive" size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                )}
              </For>
            </div>
          </Show>
        </Loading>
      </Errored>

      <Show when={editor()} keyed>
        {(value) => (
          <AreaEditor
            area={value === "new" ? null : (value as Doc<"areas">)}
            onClose={() => setEditor(null)}
            onSave={saveArea}
          />
        )}
      </Show>

      <Show when={archiveOpen()}>
        <ArchivedAreas
          areas={() => archivedSource() ?? []}
          onClose={() => setArchiveOpen(false)}
          onRestore={restoreArea}
          onDelete={(area) => setDeleteTarget({ ...area })}
        />
      </Show>

      <Show when={deleteTarget()} keyed>
        {(area) => (
          <DeleteAreaDialog
            area={area}
            itemCount={deleteImpact()?.itemCount}
            onClose={() => setDeleteTarget(null)}
            onConfirm={(confirmation) => deleteArea(area, confirmation)}
          />
        )}
      </Show>
    </section>
  );
}

function AreaEditor(props: {
  area: Doc<"areas"> | null;
  onClose: () => void;
  onSave: (input: AreaInput) => void;
}) {
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    props.onSave({
      name: data.get("name")?.toString().trim() ?? "",
      description: data.get("description")?.toString().trim() || undefined,
      icon: data.get("icon")?.toString() ?? "folder",
      color: data.get("color")?.toString() ?? "#5a45e5",
    });
  };

  return (
    <div
      class="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) props.onClose();
      }}
    >
      <section class="area-dialog" role="dialog" aria-modal="true">
        <header>
          <div>
            <span>
              <Icon name={props.area ? "edit" : "plus"} size={18} />
            </span>
            <div>
              <h3>{props.area ? "Edit Area" : "Create an Area"}</h3>
              <p>Give this part of life a clear identity.</p>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={props.onClose}>
            <Icon name="close" size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          <label>
            <span>Name</span>
            <input
              name="name"
              value={props.area?.name ?? ""}
              maxlength="80"
              autofocus
              required
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              name="description"
              rows="3"
              maxlength="5000"
              placeholder="What belongs here?"
            >
              {props.area?.description ?? ""}
            </textarea>
          </label>
          <div class="area-form-row">
            <label>
              <span>Icon</span>
              <select name="icon" value={props.area?.icon ?? "folder"}>
                <For each={areaIcons}>
                  {(icon) => <option value={icon}>{icon}</option>}
                </For>
              </select>
            </label>
            <label>
              <span>Color</span>
              <input
                name="color"
                type="color"
                value={props.area?.color ?? "#5a45e5"}
              />
            </label>
          </div>
          <footer>
            <button type="button" onClick={props.onClose}>
              Cancel
            </button>
            <button type="submit" class="primary-action">
              {props.area ? "Save changes" : "Create Area"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function ArchivedAreas(props: {
  areas: () => Doc<"areas">[];
  onClose: () => void;
  onRestore: (areaId: Id<"areas">) => void;
  onDelete: (area: Doc<"areas">) => void;
}) {
  return (
    <div
      class="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) props.onClose();
      }}
    >
      <section
        class="area-dialog archive-dialog"
        role="dialog"
        aria-modal="true"
      >
        <header>
          <div>
            <span>
              <Icon name="archive" size={18} />
            </span>
            <div>
              <h3>Archived Areas</h3>
              <p>Restore an Area or remove it permanently.</p>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={props.onClose}>
            <Icon name="close" size={18} />
          </button>
        </header>
        <div class="archived-area-list">
          <For
            each={props.areas()}
            fallback={<p class="archive-empty">No archived Areas.</p>}
          >
            {(area) => (
              <article>
                <span style={{ background: area.color }}>
                  <Icon name={area.icon as IconName} size={17} />
                </span>
                <strong>{area.name}</strong>
                <button type="button" onClick={() => props.onRestore(area._id)}>
                  Restore
                </button>
                <button
                  type="button"
                  class="danger"
                  onClick={() => props.onDelete(area)}
                >
                  Delete
                </button>
              </article>
            )}
          </For>
        </div>
      </section>
    </div>
  );
}

function DeleteAreaDialog(props: {
  area: Doc<"areas">;
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
    <div class="dialog-backdrop destructive-backdrop">
      <section
        class="area-dialog delete-dialog"
        role="alertdialog"
        aria-modal="true"
      >
        <header>
          <div>
            <span>
              <Icon name="trash" size={18} />
            </span>
            <div>
              <h3>Delete {props.area.name}?</h3>
              <p>This permanently deletes {props.itemCount ?? "its"} Items.</p>
            </div>
          </div>
        </header>
        <form onSubmit={submit}>
          <label>
            <span>Type “{props.area.name}” to confirm</span>
            <input name="confirmation" autocomplete="off" autofocus required />
          </label>
          <footer>
            <button type="button" onClick={props.onClose}>
              Cancel
            </button>
            <button type="submit" class="danger-action">
              Delete permanently
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function AreasSkeleton() {
  return (
    <div class="areas-grid" aria-label="Loading Areas">
      <For each={[1, 2, 3]}>
        {() => <div class="area-item area-skeleton" />}
      </For>
    </div>
  );
}

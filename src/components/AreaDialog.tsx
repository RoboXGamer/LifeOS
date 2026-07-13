import { For, Show } from "solid-js";
import type { Area, AreaTone, IconName } from "../types";
import { AREA_TONES } from "../schemas";
import { Icon } from "./Icon";

const AREA_ICONS: IconName[] = ["graduation", "briefcase", "folder", "chart", "user", "heart", "heartPulse", "book", "monitor"];

export type AreaFormValue = Pick<Area, "name" | "description" | "tone" | "icon">;

export function AreaDialog(props: { area: Area | null; open: boolean; onClose: () => void; onSave: (value: AreaFormValue) => void }) {
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    props.onSave({
      name: data.get("name")?.toString().trim() ?? "",
      description: data.get("description")?.toString().trim() || undefined,
      tone: data.get("tone") as AreaTone,
      icon: data.get("icon") as IconName
    });
  };

  return <Show when={props.open}>
    <div class="dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && props.onClose()}>
      <section class="item-dialog area-dialog" role="dialog" aria-modal="true" aria-labelledby="area-dialog-title">
        <header><div><span><Icon name="folder" size={20}/></span><div><h2 id="area-dialog-title">{props.area ? "Edit Area" : "Create an Area"}</h2><p>Define this part of your life clearly.</p></div></div><button aria-label="Close" onClick={props.onClose}><Icon name="close" size={20}/></button></header>
        <form onSubmit={submit}>
          <label class="full-field"><span>Name</span><input name="name" value={props.area?.name ?? ""} autofocus required maxlength="80"/></label>
          <label class="full-field"><span>Description</span><textarea name="description" rows="3" maxlength="5000">{props.area?.description ?? ""}</textarea></label>
          <div class="field-grid">
            <label><span>Color</span><select name="tone" value={props.area?.tone ?? "violet"}><For each={AREA_TONES}>{tone => <option value={tone}>{tone[0].toUpperCase() + tone.slice(1)}</option>}</For></select></label>
            <label><span>Icon</span><select name="icon" value={props.area?.icon ?? "folder"}><For each={AREA_ICONS}>{icon => <option value={icon}>{icon}</option>}</For></select></label>
          </div>
          <footer><button type="button" onClick={props.onClose}>Cancel</button><button class="save-item" type="submit">{props.area ? "Save Changes" : "Create Area"}</button></footer>
        </form>
      </section>
    </div>
  </Show>;
}

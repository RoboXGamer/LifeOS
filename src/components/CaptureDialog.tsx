import { Show } from "solid-js";
import { Icon } from "./Icon";

export function CaptureDialog(props: {
  mode: () => "capture" | "area" | null;
  onClose: () => void;
  onCaptureItem: (title: string) => void;
  onAddArea: (name: string) => void;
}) {
  const submit = (event: Event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const value = new FormData(form).get("value")?.toString().trim() ?? "";
    if (!value) return;
    if (props.mode() === "capture") props.onCaptureItem(value);
    else props.onAddArea(value);
    form.reset();
    props.onClose();
  };

  return (
    <Show when={props.mode()}>
      <div class="dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && props.onClose()}>
        <section class="capture-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <button class="dialog-close" aria-label="Close" onClick={props.onClose}><Icon name="close" size={20}/></button>
          <span class="dialog-symbol"><Icon name={props.mode() === "capture" ? "sparkle" : "folder"} size={27}/></span>
          <h2 id="dialog-title">{props.mode() === "capture" ? "Quick Capture" : "Create an Area"}</h2>
          <p>{props.mode() === "capture" ? "Capture it now. Organize it when you’re ready." : "Add another meaningful part of your life."}</p>
          <form onSubmit={submit}>
            <input
              name="value"
              autocomplete="off"
              autofocus
              placeholder={props.mode() === "capture" ? "What’s on your mind?" : "Area name"}
            />
            <button type="submit">{props.mode() === "capture" ? "Add to Inbox" : "Add Area"}</button>
          </form>
        </section>
      </div>
    </Show>
  );
}

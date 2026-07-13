import { Show } from "solid-js";
import { Icon } from "./Icon";

export function CaptureDialog(props: { mode: () => "capture" | null; onClose: () => void; onCaptureItem: (title: string) => void }) {
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const value = new FormData(form).get("value")?.toString().trim() ?? "";
    if (!value) return;
    props.onCaptureItem(value);
    form.reset();
    props.onClose();
  };

  return <Show when={props.mode()}>
    <div class="dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && props.onClose()}>
      <section class="capture-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button class="dialog-close" aria-label="Close" onClick={props.onClose}><Icon name="close" size={20}/></button>
        <span class="dialog-symbol"><Icon name="sparkle" size={27}/></span>
        <h2 id="dialog-title">Quick Capture</h2>
        <p>Capture it now. Organize it when you’re ready.</p>
        <form onSubmit={submit}><input name="value" autocomplete="off" autofocus placeholder="What’s on your mind?"/><button type="submit">Add to Inbox</button></form>
      </section>
    </div>
  </Show>;
}

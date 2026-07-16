import { For, Loading, Errored } from "solid-js";
import "./Areas.css";
import { Icon, type IconName } from "../Icon";
import { createQuery, WORKSPACE_ID } from "../convex";
import { api } from "../../convex/_generated/api";

export default function Areas() {
  const areas = createQuery(api.areas.list, { workspaceId: WORKSPACE_ID });

  return (
    <>
      <h2>Areas</h2>
      <Errored fallback={(e) => <p>{(e as Error).message}</p>}>
        <Loading fallback={<p>Loading…</p>}>
          <div class="areas-grid">
            <For each={areas()}>
              {(area) => (
                <div class="area-item" style={{ "--_deco-color": area.color }}>
                  <div class="deco">
                    <div class="deco-blobs">
                      <span class="shape shape-a"></span>
                      <span class="shape shape-b"></span>
                    </div>
                    <Icon name={area.icon as IconName} size={40} strokeWidth={1.3} />
                  </div>
                  <div class="area-title">
                    <Icon name={area.icon as IconName} />
                    <h3>{area.name}</h3>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Loading>
      </Errored>
    </>
  );
}

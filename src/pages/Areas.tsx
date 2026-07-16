import { For } from "solid-js";
import "./Areas.css";
import { Icon, type IconName } from "../Icon";

const areas: { name: string; icon: IconName; color: string }[] = [
  { name: "College", icon: "graduation", color: "#7654e8" },
  { name: "Freelancing", icon: "briefcase", color: "#3d72e5" },
  { name: "Projects", icon: "folder", color: "#44a95f" },
  { name: "Business", icon: "chart", color: "#f1a007" },
  { name: "Personal", icon: "user", color: "#ed6977" },
  { name: "Health", icon: "leaf", color: "#16a6a3" },
];

export default function Areas() {
  return (
    <>
      <h2>Areas</h2>
      <div class="areas-grid">
        <For each={areas}>
          {(area) => (
            <div class="area-item" style={{ "--_deco-color": area.color }}>
              <div class="deco">
                <div class="deco-blobs">
                  <span class="shape shape-a"></span>
                  <span class="shape shape-b"></span>
                </div>
                <Icon name={area.icon} size={40} strokeWidth={1.3} />
              </div>
              <div class="area-title">
                <Icon name={area.icon} />
                <h3>{area.name}</h3>
              </div>
            </div>
          )}
        </For>
      </div>
    </>
  );
}

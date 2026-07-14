import "./App.css";
import { useElementSize } from "./useElementSize.ts";

function App() {
  const {
    ref: sidebarRef,
    width: sidebarW,
    height: sidebarH,
  } = useElementSize();
  const { ref: mainRef, width: mainW, height: mainH } = useElementSize();
  return (
    <>
      <div id="app">
        <div class="sidebar" ref={sidebarRef}>
          <span>
            {sidebarW()} x {sidebarH()}
          </span>
        </div>
        <main class="main" ref={mainRef}>
          <span>
            {mainW()} x {mainH()}
          </span>
        </main>
      </div>
    </>
  );
}

export default App;

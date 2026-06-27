import { MouseEvent } from "react";
import { Eye, EyeOff, Grip, MousePointer2, MousePointerClick } from "lucide-react";

import { ApiState } from "../types";

type TitleBarProps = {
  apiState: ApiState;
  clickThrough: boolean;
  openTasks: number;
  onDragStart: (event: MouseEvent<HTMLButtonElement>) => void;
  onHide: () => void;
  onToggleClickThrough: () => void;
};

export function TitleBar({
  apiState,
  clickThrough,
  openTasks,
  onDragStart,
  onHide,
  onToggleClickThrough,
}: TitleBarProps) {
  return (
    <header className="titlebar">
      <button
        className="drag-handle"
        type="button"
        onMouseDown={onDragStart}
        title="Move overlay"
        aria-label="Move overlay"
      >
        <Grip size={18} aria-hidden="true" />
      </button>
      <div className="identity">
        <span className="app-name">Basic Overlay</span>
        <span className={`status api-${apiState}`}>{openTasks} open</span>
      </div>
      <div className="window-actions">
        <div className={clickThrough ? "click-mode enabled" : "click-mode"}>
          <button
            className={clickThrough ? "icon-button active" : "icon-button"}
            type="button"
            onClick={onToggleClickThrough}
            title="Toggle click-through (Alt+Shift+C)"
            aria-label="Toggle click-through"
          >
            {clickThrough ? <MousePointerClick size={18} /> : <MousePointer2 size={18} />}
          </button>
          <div className="click-mode-copy" aria-live="polite">
            <span>{clickThrough ? "ON" : "OFF"}</span>
            <kbd>Alt Shift C</kbd>
          </div>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onHide}
          title="Hide overlay"
          aria-label="Hide overlay"
        >
          {clickThrough ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </header>
  );
}

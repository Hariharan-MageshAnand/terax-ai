import { usePreferencesStore } from "@/modules/settings/preferences";
import { useTheme } from "@/modules/theme";
import type { SearchAddon } from "@xterm/addon-search";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { TerminalAutocompleteUiModel } from "./lib/autocomplete/types";
import { TerminalAutocompleteOverlay } from "./TerminalAutocompleteOverlay";
import { useTerminalSession, type TeraxOpenInput } from "./lib/useTerminalSession";

export type TerminalPaneHandle = {
  write: (data: string) => void;
  focus: () => void;
  getBuffer: (maxLines?: number) => string | null;
  getSelection: () => string | null;
};

type Props = {
  /** Stable identifier for this leaf (passed back through callbacks). */
  leafId: number;
  /** Tab containing this pane is on screen. */
  visible: boolean;
  /** This leaf is the active pane within its tab — receives auto-focus. */
  focused?: boolean;
  initialCwd?: string;
  onSearchReady?: (leafId: number, addon: SearchAddon) => void;
  onExit?: (leafId: number, code: number) => void;
  onCwd?: (leafId: number, cwd: string) => void;
  onTeraxOpen?: (leafId: number, input: TeraxOpenInput) => void;
};

export const TerminalPane = forwardRef<TerminalPaneHandle, Props>(
  function TerminalPane(
    {
      leafId,
      visible,
      focused = true,
      initialCwd,
      onSearchReady,
      onExit,
      onCwd,
      onTeraxOpen,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const paneBoundsRef = useRef<HTMLDivElement>(null);
    const { resolvedTheme } = useTheme();
    const terminalAutocompleteEnabled = usePreferencesStore(
      (s) => s.terminalAutocompleteEnabled,
    );
    const [acModel, setAcModel] = useState<TerminalAutocompleteUiModel | null>(
      null,
    );

    const getTerminalAutocompleteEnabled = useCallback(
      () => usePreferencesStore.getState().terminalAutocompleteEnabled,
      [],
    );

    useEffect(() => {
      if (!visible) setAcModel(null);
    }, [visible]);

    useEffect(() => {
      if (!terminalAutocompleteEnabled) setAcModel(null);
    }, [terminalAutocompleteEnabled]);

    const session = useTerminalSession({
      leafId,
      container: containerRef,
      visible,
      focused,
      initialCwd,
      onSearchReady: (a) => onSearchReady?.(leafId, a),
      onExit: (c) => onExit?.(leafId, c),
      onCwd: (c) => onCwd?.(leafId, c),
      onTeraxOpen: (input) => onTeraxOpen?.(leafId, input),
      getTerminalAutocompleteEnabled,
      onTerminalAutocompleteModel: setAcModel,
    });

    useEffect(() => {
      // Defer one frame so CSS-variable token resolution sees the new class.
      const id = requestAnimationFrame(() => session.applyTheme());
      return () => cancelAnimationFrame(id);
    }, [resolvedTheme, session]);

    useImperativeHandle(
      ref,
      () => ({
        write: (data: string) => session.write(data),
        focus: () => session.focus(),
        getBuffer: (max?: number) => session.getBuffer(max),
        getSelection: () => session.getSelection(),
      }),
      [session],
    );

    return (
      <div
        ref={paneBoundsRef}
        className="relative h-full w-full"
        style={{
          visibility: visible ? "visible" : "hidden",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <div ref={containerRef} className="h-full w-full" />
        {visible ? (
          <TerminalAutocompleteOverlay
            model={acModel}
            boundsRef={paneBoundsRef}
            onPickSuggestion={(i) => session.applyAutocompletePick(i)}
          />
        ) : null}
      </div>
    );
  },
);

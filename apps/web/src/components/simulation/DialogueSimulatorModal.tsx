import React, { useState, useEffect, useRef } from "react";
import type { Conversation, Project } from "@freewrite/core";
import {
  DialogueSimulationEngine,
  type SimulationState,
  type VariableValue,
} from "@freewrite/core";
import {
  Play,
  RotateCcw,
  X,
  MessageSquare,
  User,
  Zap,
  GitBranch,
  Square,
  Sliders,
  ChevronRight,
  ListOrdered,
  Code,
  Terminal,
  Bell,
  Film,
} from "lucide-react";

interface Props {
  conversation: Conversation;
  project: Project;
  onClose: () => void;
}

export function DialogueSimulatorModal({ conversation, project, onClose }: Props) {
  const [engine, setEngine] = useState<DialogueSimulationEngine | null>(null);
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [variableOverrides, setVariableOverrides] = useState<Record<string, VariableValue>>({});

  // Right pane tabs: "vars" | "lua" | "trace"
  const [activeTab, setActiveTab] = useState<"vars" | "lua" | "trace">("vars");

  // Interactive Lua console state
  const [luaInput, setLuaInput] = useState("");
  const [luaHistory, setLuaHistory] = useState<
    Array<{ command: string; result?: any; error?: string }>
  >([]);

  const historyEndRef = useRef<HTMLDivElement>(null);

  // Initialize simulation engine
  const initSimulation = (overrides = variableOverrides) => {
    const newEngine = new DialogueSimulationEngine(conversation, project, overrides);
    const initialState = newEngine.start();
    setEngine(newEngine);
    setSimState(initialState);
  };

  useEffect(() => {
    initSimulation();
  }, [conversation.id]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [simState?.history.length, simState?.status]);

  const handleNext = () => {
    if (!engine) return;
    const nextState = engine.next();
    setSimState(nextState);
  };

  const handleChoice = (targetNodeId: string) => {
    if (!engine) return;
    const nextState = engine.choose(targetNodeId);
    setSimState(nextState);
  };

  const handleVariableChange = (nameOrId: string, val: VariableValue) => {
    if (!engine) return;
    engine.setVariable(nameOrId, val);
    setVariableOverrides((prev) => ({ ...prev, [nameOrId]: val }));
    setSimState(engine.getState());
  };

  const handleRunLuaConsole = () => {
    if (!engine || !luaInput.trim()) return;
    const code = luaInput.trim();
    const runtime = engine.getLuaRuntime();
    const res = runtime.runLua(code);

    setLuaHistory((prev) => [
      ...prev,
      {
        command: code,
        result: res.success ? (res.result !== undefined ? String(res.result) : "OK") : undefined,
        error: res.error,
      },
    ]);
    setLuaInput("");

    // Sync variables back to state
    setSimState(engine.getState());
  };

  const getActorInfo = (speakerId?: string | null) => {
    if (!speakerId) return null;
    return project.actors.find((a) => a.id === speakerId) || null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none">
      <div className="bg-[#181818] border border-fw-border rounded-lg w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden text-xs text-fw-text">
        {/* Simulator Top Header */}
        <div className="h-12 bg-fw-panel border-b border-fw-border px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/40">
              <Play size={12} fill="currentColor" />
            </div>
            <div>
              <span className="font-semibold text-sm text-fw-text">Dialogue Simulator (DS4U Lua)</span>
              <span className="ml-2 text-xs text-fw-muted/80">({conversation.title})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => initSimulation(variableOverrides)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-fw-muted hover:text-fw-text border border-fw-border rounded hover:bg-fw-bg transition-colors"
              title="Restart simulation"
            >
              <RotateCcw size={12} />
              <span>Restart</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-fw-muted hover:text-fw-text rounded transition-colors"
              title="Close Simulator"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Alerts Banner (ShowAlert from Lua) */}
        {simState?.alerts && simState.alerts.length > 0 && (
          <div className="bg-amber-950/40 border-b border-amber-800/50 px-4 py-1.5 flex items-center gap-2 text-amber-300 text-xs shrink-0">
            <Bell size={13} className="text-amber-400 shrink-0" />
            <span className="font-semibold">DS4U ShowAlert:</span>
            <span className="truncate">{simState.alerts[simState.alerts.length - 1]}</span>
          </div>
        )}

        {/* Simulator Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Stage: Dialogue Feed & Controls */}
          <div className="flex-1 flex flex-col bg-[#141414] border-r border-fw-border overflow-hidden">
            {/* Feed Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {simState?.history.map((entry, idx) => {
                const isPlayer = entry.nodeType === "player_response";
                const isAction = entry.nodeType === "action";
                const isCondition = entry.nodeType === "condition";
                const isEnd = entry.nodeType === "end";

                if (isAction) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-[11px] text-rose-300/80 bg-rose-950/20 border border-rose-900/40 px-3 py-1.5 rounded max-w-lg mx-auto"
                    >
                      <Zap size={13} className="text-rose-400 shrink-0" />
                      <span>
                        Action executed: {entry.text}{" "}
                        {entry.executedActions?.length ? `(${entry.executedActions.join(", ")})` : ""}
                      </span>
                    </div>
                  );
                }

                if (isCondition) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-[11px] text-amber-300/80 bg-amber-950/20 border border-amber-900/40 px-3 py-1.5 rounded max-w-lg mx-auto font-mono"
                    >
                      <GitBranch size={13} className="text-amber-400 shrink-0" />
                      <span>{entry.text}</span>
                    </div>
                  );
                }

                if (isEnd) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 py-2 px-4 rounded max-w-md mx-auto font-medium"
                    >
                      <Square size={13} fill="currentColor" />
                      <span>End of Conversation ({entry.text || "Finished"})</span>
                    </div>
                  );
                }

                const actorInfo = getActorInfo(entry.speakerId);
                const actorColor = actorInfo?.color || (isPlayer ? "#10b981" : "#3b82f6");

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isPlayer ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-fw-muted">
                      {isPlayer ? (
                        <>
                          <span>{entry.speakerName || "Player"}</span>
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: actorColor }}
                          >
                            P
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: actorColor }}
                          >
                            {(entry.speakerName || "N").slice(0, 1).toUpperCase()}
                          </div>
                          <span style={{ color: actorColor }}>
                            {entry.speakerName || "Narrator"}
                          </span>
                        </>
                      )}
                    </div>

                    <div
                      className={`p-3 rounded-lg text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap break-words ${
                        isPlayer
                          ? "bg-purple-950/40 border border-purple-500/50 text-purple-100 rounded-tr-none"
                          : "bg-[#1f2430] border border-blue-500/40 text-blue-50 rounded-tl-none shadow"
                      }`}
                    >
                      {entry.text}
                    </div>

                    {/* Cutscene Sequence indicator */}
                    {entry.sequence && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-purple-400/80 font-mono">
                        <Film size={11} />
                        <span>Seq: {entry.sequence}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={historyEndRef} />
            </div>

            {/* Stage Footer: User Choices or Next Button */}
            <div className="p-3 border-t border-fw-border bg-fw-panel min-h-[5rem] flex flex-col justify-center">
              {simState?.status === "waiting_for_choice" ? (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-semibold text-purple-400 tracking-wider">
                    Select Player Choice:
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {simState.availableChoices.map((choice, i) => (
                      <button
                        key={choice.targetNodeId}
                        onClick={() => handleChoice(choice.targetNodeId)}
                        className="flex items-center gap-2 w-full text-left p-2.5 rounded bg-[#251d30] border border-purple-500/50 hover:border-purple-400 hover:bg-purple-900/30 text-purple-100 transition-all font-medium text-xs group"
                      >
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                          {i + 1}
                        </span>
                        <span className="flex-1">{choice.menuText || choice.responseText}</span>
                        <ChevronRight
                          size={14}
                          className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : simState?.status === "running" ? (
                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-2 bg-fw-accent text-white rounded font-medium text-xs hover:bg-fw-accent-hover transition-colors shadow-md"
                  >
                    <span>Continue</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-fw-muted">Simulation completed.</span>
                  <button
                    onClick={() => initSimulation(variableOverrides)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-fw-accent text-white rounded text-xs hover:bg-fw-accent-hover transition-colors"
                  >
                    <RotateCcw size={12} />
                    <span>Run Again</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Variables / Live Lua Console / Execution Trace */}
          <div className="w-80 bg-fw-panel flex flex-col shrink-0 text-xs border-l border-fw-border">
            {/* Tabs Header */}
            <div className="flex border-b border-fw-border bg-fw-bg/40">
              <button
                onClick={() => setActiveTab("vars")}
                className={`flex-1 py-2 text-center text-[11px] font-semibold border-b-2 transition-colors ${
                  activeTab === "vars"
                    ? "border-fw-accent text-fw-accent bg-fw-panel"
                    : "border-transparent text-fw-muted hover:text-fw-text"
                }`}
              >
                Variables
              </button>
              <button
                onClick={() => setActiveTab("lua")}
                className={`flex-1 py-2 text-center text-[11px] font-semibold border-b-2 transition-colors flex items-center justify-center gap-1 ${
                  activeTab === "lua"
                    ? "border-amber-400 text-amber-400 bg-fw-panel"
                    : "border-transparent text-fw-muted hover:text-fw-text"
                }`}
              >
                <Terminal size={12} />
                Lua Console
              </button>
              <button
                onClick={() => setActiveTab("trace")}
                className={`flex-1 py-2 text-center text-[11px] font-semibold border-b-2 transition-colors ${
                  activeTab === "trace"
                    ? "border-fw-accent text-fw-accent bg-fw-panel"
                    : "border-transparent text-fw-muted hover:text-fw-text"
                }`}
              >
                Trace
              </button>
            </div>

            {/* Tab 1: Variables */}
            {activeTab === "vars" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {!project.variables.length ? (
                  <div className="text-fw-muted text-[11px] italic">
                    No project variables defined.
                  </div>
                ) : (
                  project.variables.map((v) => {
                    const currentVal =
                      simState?.variables[v.name] !== undefined
                        ? simState.variables[v.name]
                        : v.initialValue;

                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between bg-fw-bg p-2 rounded border border-fw-border/60"
                      >
                        <span
                          className="font-mono text-fw-text font-medium truncate max-w-[120px]"
                          title={`Variable["${v.name}"]`}
                        >
                          {v.name}
                        </span>

                        {v.type === "boolean" ? (
                          <button
                            onClick={() => handleVariableChange(v.name, !currentVal)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                              currentVal
                                ? "bg-green-500/20 text-green-400 border-green-500/40"
                                : "bg-red-500/20 text-red-400 border-red-500/40"
                            }`}
                          >
                            {String(currentVal)}
                          </button>
                        ) : v.type === "number" ? (
                          <input
                            type="number"
                            value={Number(currentVal)}
                            onChange={(e) =>
                              handleVariableChange(v.name, Number(e.target.value))
                            }
                            className="w-16 bg-fw-panel border border-fw-border rounded px-1.5 py-0.5 text-[11px] font-mono text-fw-text text-right"
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(currentVal)}
                            onChange={(e) =>
                              handleVariableChange(v.name, e.target.value)
                            }
                            className="w-24 bg-fw-panel border border-fw-border rounded px-1.5 py-0.5 text-[11px] text-fw-text truncate"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Interactive Lua Console */}
            {activeTab === "lua" && (
              <div className="flex-1 flex flex-col p-2 overflow-hidden bg-[#101014]">
                <div className="flex-1 overflow-y-auto space-y-1.5 p-1 font-mono text-[11px]">
                  <div className="text-[10px] text-amber-400/80 pb-1 border-b border-fw-border/40">
                    -- DS4U Lua Console. Try:
                    <br />
                    -- Variable["Gold"] = 200
                    <br />
                    -- return Actor["Player"].Name
                    <br />
                    -- ShowAlert("Greetings!")
                  </div>

                  {luaHistory.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="text-fw-muted flex items-start gap-1">
                        <span className="text-amber-400 select-none">&gt;</span>
                        <span className="text-fw-text break-all">{item.command}</span>
                      </div>
                      {item.error ? (
                        <div className="text-red-400 pl-3 break-all text-[10px]">
                          Error: {item.error}
                        </div>
                      ) : (
                        <div className="text-green-400 pl-3 break-all text-[10px]">
                          = {item.result}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-fw-border flex gap-1">
                  <input
                    type="text"
                    value={luaInput}
                    onChange={(e) => setLuaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRunLuaConsole();
                    }}
                    placeholder="Enter Lua code…"
                    className="flex-1 bg-fw-bg border border-fw-border rounded px-2 py-1 font-mono text-[11px] text-fw-text focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleRunLuaConsole}
                    className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded hover:bg-amber-500/30 font-medium text-[11px]"
                  >
                    Run
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Execution Trace */}
            {activeTab === "trace" && (
              <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[11px]">
                {simState?.history.map((step, idx) => (
                  <div
                    key={idx}
                    className="px-2 py-1 rounded bg-fw-bg/60 border border-fw-border/40 text-fw-muted flex items-center justify-between"
                  >
                    <span className="text-[10px] text-fw-accent">#{step.stepIndex + 1}</span>
                    <span className="text-fw-text capitalize">
                      {step.nodeType.replace("_", " ")}
                    </span>
                    <span
                      className="text-[10px] text-fw-muted/70 truncate max-w-[80px]"
                      title={step.nodeId}
                    >
                      {step.nodeId.slice(0, 6)}…
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

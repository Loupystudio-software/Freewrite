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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none">
      <div className="bg-[#181818] border border-fw-border rounded-lg w-full max-w-4xl h-[88vh] flex flex-col shadow-2xl overflow-hidden text-xs text-fw-text">
        {/* Simulator Top Header */}
        <div className="h-12 bg-fw-panel border-b border-fw-border px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/40">
              <Play size={12} fill="currentColor" />
            </div>
            <div>
              <span className="font-semibold text-sm text-fw-text">Dialogue Previewer</span>
              <span className="ml-2 text-xs text-fw-muted/80">({conversation.title})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => initSimulation(variableOverrides)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-fw-muted hover:text-fw-text border border-fw-border rounded hover:bg-fw-bg transition-colors"
              title="Restart from Start node"
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

        {/* Simulator Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Stage: Dialogue Feed & Controls */}
          <div className="flex-1 flex flex-col bg-[#141414] border-r border-fw-border overflow-hidden">
            {/* Feed Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {simState?.history.map((entry, idx) => {
                const isNPC = entry.nodeType === "dialogue";
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
                      className="flex items-center gap-2 text-[11px] text-amber-300/80 bg-amber-950/20 border border-amber-900/40 px-3 py-1.5 rounded max-w-lg mx-auto"
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

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isPlayer ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-fw-muted">
                      {isPlayer ? (
                        <>
                          <span>{entry.speakerName || "Player"}</span>
                          <User size={12} className="text-purple-400" />
                        </>
                      ) : (
                        <>
                          <MessageSquare size={12} className="text-blue-400" />
                          <span className="text-blue-400">{entry.speakerName || "Narrator"}</span>
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
                        <ChevronRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
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

          {/* Right Column: Runtime Variables & Execution Trace */}
          <div className="w-72 bg-fw-panel flex flex-col shrink-0 text-xs">
            {/* Variables Header */}
            <div className="p-3 border-b border-fw-border flex items-center gap-1.5">
              <Sliders size={14} className="text-fw-accent" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Runtime Variables
              </span>
            </div>

            {/* Variables List */}
            <div className="p-3 border-b border-fw-border max-h-48 overflow-y-auto space-y-2">
              {!project.variables.length ? (
                <div className="text-fw-muted text-[11px] italic">
                  No project variables defined.
                </div>
              ) : (
                project.variables.map((v) => {
                  const currentVal =
                    simState?.variables[v.name] !== undefined
                      ? simState.variables[v.name]
                      : simState?.variables[v.id] !== undefined
                      ? simState.variables[v.id]
                      : v.initialValue;

                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between bg-fw-bg p-1.5 rounded border border-fw-border/60"
                    >
                      <span className="font-mono text-fw-text font-medium truncate max-w-[110px]" title={v.name}>
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
                          onChange={(e) => handleVariableChange(v.name, Number(e.target.value))}
                          className="w-16 bg-fw-panel border border-fw-border rounded px-1.5 py-0.5 text-[11px] font-mono text-fw-text text-right"
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(currentVal)}
                          onChange={(e) => handleVariableChange(v.name, e.target.value)}
                          className="w-20 bg-fw-panel border border-fw-border rounded px-1.5 py-0.5 text-[11px] text-fw-text truncate"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Execution Trace Header */}
            <div className="p-3 border-b border-fw-border flex items-center gap-1.5">
              <ListOrdered size={14} className="text-fw-accent" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Execution Trace ({simState?.history.length || 0})
              </span>
            </div>

            {/* Trace List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[11px]">
              {simState?.history.map((step, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 rounded bg-fw-bg/60 border border-fw-border/40 text-fw-muted flex items-center justify-between"
                >
                  <span className="text-[10px] text-fw-accent">#{step.stepIndex + 1}</span>
                  <span className="text-fw-text capitalize">{step.nodeType.replace("_", " ")}</span>
                  <span className="text-[10px] text-fw-muted/70 truncate max-w-[80px]" title={step.nodeId}>
                    {step.nodeId.slice(0, 6)}…
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

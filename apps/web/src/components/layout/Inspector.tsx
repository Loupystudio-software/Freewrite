import React from "react";
import { useProjectStore } from "../../stores/projectStore";
import { useConversationStore } from "../../stores/conversationStore";
import { NodeInspector } from "../inspector/NodeInspector";
import { ConversationInspector } from "../inspector/ConversationInspector";

export function Inspector() {
  const { project, updateProjectMeta } = useProjectStore();
  const { activeConversationId, selectedNodeId } = useConversationStore();

  const activeConv = project?.conversations.find((c) => c.id === activeConversationId);
  const selectedNode = activeConv?.nodes.find((n) => n.id === selectedNodeId);

  if (!project) {
    return (
      <div className="w-72 bg-fw-panel border-l border-fw-border flex flex-col shrink-0 select-none">
        <div className="px-3 py-2 border-b border-fw-border">
          <span className="text-xs font-semibold text-fw-muted uppercase tracking-wider">
            Inspector
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-fw-muted">No project loaded</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-fw-panel border-l border-fw-border flex flex-col shrink-0">
      <div className="px-3 py-2 border-b border-fw-border flex items-center justify-between">
        <span className="text-xs font-semibold text-fw-muted uppercase tracking-wider">
          Inspector
        </span>
        <span className="text-[10px] text-fw-muted/70">
          {selectedNode
            ? "Node Properties"
            : activeConv
            ? "Conversation"
            : "Project"}
        </span>
      </div>

      {selectedNode ? (
        <NodeInspector key={selectedNode.id} node={selectedNode} />
      ) : activeConv ? (
        <ConversationInspector key={activeConv.id} conversation={activeConv} />
      ) : (
        /* Project Inspector */
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
          <div>
            <label className="text-fw-muted block mb-1">Project Name</label>
            <input
              className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
              value={project.project.name}
              onChange={(e) => updateProjectMeta({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-fw-muted block mb-1">Author</label>
            <input
              className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent"
              value={project.project.author}
              onChange={(e) => updateProjectMeta({ author: e.target.value })}
            />
          </div>
          <div>
            <label className="text-fw-muted block mb-1">Description</label>
            <textarea
              className="w-full bg-fw-bg border border-fw-border rounded-sm px-2 py-1 text-fw-text focus:outline-none focus:border-fw-accent resize-none leading-relaxed"
              rows={3}
              value={project.project.description}
              onChange={(e) => updateProjectMeta({ description: e.target.value })}
            />
          </div>
          <hr className="border-fw-border" />
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-fw-muted">ID:</span>
              <span
                className="text-fw-muted/70 font-mono truncate max-w-36"
                title={project.project.id}
              >
                {project.project.id.slice(0, 8)}…
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fw-muted">Created:</span>
              <span className="text-fw-muted/70">
                {new Date(project.project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fw-muted">Actors:</span>
              <span className="text-fw-muted/70">{project.actors.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fw-muted">Conversations:</span>
              <span className="text-fw-muted/70">{project.conversations.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fw-muted">Variables:</span>
              <span className="text-fw-muted/70">{project.variables.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

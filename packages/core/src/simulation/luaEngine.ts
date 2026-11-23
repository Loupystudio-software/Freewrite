import { lua, lauxlib, lualib, to_luastring, to_jsstring } from "fengari";
import type { Project } from "../models/project.js";
import type { Actor } from "../models/actor.js";
import type { Item } from "../models/item.js";

export interface LuaAlert {
  message: string;
  timestamp: string;
}

export interface LuaConditionResult {
  passed: boolean;
  error?: string;
}

export interface LuaScriptResult {
  success: boolean;
  error?: string;
  alerts: string[];
}

export class DS4ULuaRuntime {
  private L: any;
  private alerts: string[] = [];

  constructor(project?: Project) {
    this.init(project);
  }

  /**
   * Initialize or reset the Lua state with DS4U globals.
   */
  public init(project?: Project): void {
    if (this.L) {
      lua.lua_close(this.L);
    }
    this.L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(this.L);
    this.alerts = [];

    // Register JS Alert handler
    // In fengari, we can provide global helper script to populate DS4U functions
    this.setupDS4UEnvironment(project);
  }

  private setupDS4UEnvironment(project?: Project): void {
    // 1. Initialize base tables
    const baseScript = `
      Variable = {}
      Actor = {}
      Item = {}
      Quest = {}
      Conversation = {}
      __fw_alerts = {}

      function ShowAlert(msg)
        table.insert(__fw_alerts, tostring(msg))
      end

      function GetVariable(varName)
        if Variable[varName] ~= nil then
          return Variable[varName]
        end
        return nil
      end

      function SetVariable(varName, val)
        Variable[varName] = val
      end

      function GetActorField(actorName, fieldName)
        if Actor[actorName] and Actor[actorName][fieldName] ~= nil then
          return Actor[actorName][fieldName]
        end
        return nil
      end

      function SetActorField(actorName, fieldName, val)
        if not Actor[actorName] then
          Actor[actorName] = {}
        end
        Actor[actorName][fieldName] = val
      end

      function GetQuestState(questName)
        if Item[questName] and Item[questName].State ~= nil then
          return Item[questName].State
        end
        if Quest[questName] and Quest[questName].State ~= nil then
          return Quest[questName].State
        end
        return "unassigned"
      end

      function SetQuestState(questName, state)
        if not Item[questName] then
          Item[questName] = { State = state }
        else
          Item[questName].State = state
        end
        Quest[questName] = Item[questName]
      end

      function GetQuestEntry(questName, entryIndex)
        local q = Item[questName] or Quest[questName]
        if q and q.Entries and q.Entries[entryIndex] then
          return q.Entries[entryIndex]
        end
        return ""
      end

      function SetQuestEntry(questName, entryIndex, state)
        local q = Item[questName] or Quest[questName]
        if not q then
          q = { Entries = {} }
          Item[questName] = q
          Quest[questName] = q
        end
        if not q.Entries then q.Entries = {} end
        q.Entries[entryIndex] = state
      end

      function RandomElement(listOrCsv)
        if type(listOrCsv) == "string" then
          local elements = {}
          for item in string.gmatch(listOrCsv, "([^,]+)") do
            local trimmed = string.match(item, "^%s*(.-)%s*$")
            table.insert(elements, trimmed)
          end
          if #elements > 0 then
            return elements[math.random(#elements)]
          end
          return ""
        elseif type(listOrCsv) == "table" then
          if #listOrCsv > 0 then
            return listOrCsv[math.random(#listOrCsv)]
          end
        end
        return ""
      end
    `;

    this.runRawScript(baseScript);

    // 2. Populate Variables
    if (project?.variables) {
      for (const v of project.variables) {
        this.setVariable(v.name, v.initialValue);
      }
    }

    // 3. Populate Actors
    if (project?.actors) {
      for (const a of project.actors) {
        this.setActor(a);
      }
    }

    // 4. Populate Items & Quests
    if (project?.items) {
      for (const it of project.items) {
        this.setItem(it);
      }
    }

    // 5. Populate Conversations for SimStatus
    if (project?.conversations) {
      for (const conv of project.conversations) {
        const cId = conv.externalId ?? conv.id;
        const convInit = `
          if not Conversation[${JSON.stringify(cId)}] then
            Conversation[${JSON.stringify(cId)}] = { Dialog = {} }
          end
        `;
        this.runRawScript(convInit);

        for (const node of conv.nodes) {
          const nId = node.externalId ?? node.id;
          const nodeInit = `
            Conversation[${JSON.stringify(cId)}].Dialog[${JSON.stringify(nId)}] = {
              SimStatus = "Untouched"
            }
          `;
          this.runRawScript(nodeInit);
        }
      }
    }
  }

  public setConversationContext(actorName?: string | null, conversantName?: string | null): void {
    const act = actorName || "";
    const conv = conversantName || "";
    this.runRawScript(`
      Variable["Actor"] = ${JSON.stringify(act)}
      Variable["Conversant"] = ${JSON.stringify(conv)}
      Variable["ActorIndex"] = ${JSON.stringify(act)}
      Variable["ConversantIndex"] = ${JSON.stringify(conv)}
    `);
  }

  public setVariable(name: string, value: boolean | number | string): void {
    let luaVal: string;
    if (typeof value === "boolean") {
      luaVal = value ? "true" : "false";
    } else if (typeof value === "number") {
      luaVal = String(value);
    } else {
      luaVal = JSON.stringify(value);
    }
    this.runRawScript(`Variable[${JSON.stringify(name)}] = ${luaVal}`);
  }

  public setActor(actor: Actor): void {
    const fieldsTable: Record<string, any> = {
      Name: actor.name,
      Description: actor.description,
      IsPlayer: actor.isPlayer,
      Pictures: actor.pictures || [],
      Portrait: actor.portrait || "",
      Color: actor.color || "#3b82f6",
    };

    if (actor.fields) {
      for (const f of actor.fields) {
        if (f.type === "Number") {
          fieldsTable[f.title] = Number(f.value) || 0;
        } else if (f.type === "Boolean") {
          fieldsTable[f.title] = f.value === "true" || f.value === "True";
        } else {
          fieldsTable[f.title] = f.value;
        }
      }
    }

    const script = `
      Actor[${JSON.stringify(actor.name)}] = ${this.jsObjectToLuaTable(fieldsTable)}
      if ${actor.externalId !== null && actor.externalId !== undefined} then
        Actor[${actor.externalId}] = Actor[${JSON.stringify(actor.name)}]
      end
    `;
    this.runRawScript(script);
  }

  public setItem(item: Item): void {
    const fieldsTable: Record<string, any> = {
      Name: item.name,
      IsItem: item.isItem,
      State: item.state,
      Description: item.description,
      SuccessDescription: item.successDescription,
      FailureDescription: item.failureDescription,
    };

    if (item.fields) {
      for (const f of item.fields) {
        if (f.type === "Number") {
          fieldsTable[f.title] = Number(f.value) || 0;
        } else if (f.type === "Boolean") {
          fieldsTable[f.title] = f.value === "true" || f.value === "True";
        } else {
          fieldsTable[f.title] = f.value;
        }
      }
    }

    const script = `
      Item[${JSON.stringify(item.name)}] = ${this.jsObjectToLuaTable(fieldsTable)}
      Quest[${JSON.stringify(item.name)}] = Item[${JSON.stringify(item.name)}]
    `;
    this.runRawScript(script);
  }

  public setSimStatus(
    convId: number | string,
    entryId: number | string,
    status: "Untouched" | "WasOffered" | "WasDisplayed"
  ): void {
    const script = `
      if not Conversation[${JSON.stringify(convId)}] then
        Conversation[${JSON.stringify(convId)}] = { Dialog = {} }
      end
      if not Conversation[${JSON.stringify(convId)}].Dialog[${JSON.stringify(entryId)}] then
        Conversation[${JSON.stringify(convId)}].Dialog[${JSON.stringify(entryId)}] = {}
      end
      Conversation[${JSON.stringify(convId)}].Dialog[${JSON.stringify(entryId)}].SimStatus = ${JSON.stringify(status)}
    `;
    this.runRawScript(script);
  }

  public getSimStatus(convId: number | string, entryId: number | string): string {
    const script = `
      if Conversation[${JSON.stringify(convId)}] and 
         Conversation[${JSON.stringify(convId)}].Dialog[${JSON.stringify(entryId)}] then
        return Conversation[${JSON.stringify(convId)}].Dialog[${JSON.stringify(entryId)}].SimStatus
      end
      return "Untouched"
    `;
    const res = this.runLua(script);
    return res.result || "Untouched";
  }

  /**
   * Evaluate a DS4U Lua condition expression.
   * If condition is empty or whitespace, it passes (true).
   */
  public evaluateCondition(
    condition: string,
    context?: { actorName?: string; conversantName?: string }
  ): LuaConditionResult {
    if (!condition || !condition.trim()) {
      return { passed: true };
    }

    if (context) {
      this.setConversationContext(context.actorName, context.conversantName);
    }

    const wrapped = `return (${condition.trim()})`;
    const status = lauxlib.luaL_dostring(this.L, to_luastring(wrapped));

    if (status !== 0) {
      const err = to_jsstring(lua.lua_tostring(this.L, -1));
      lua.lua_pop(this.L, 1);
      return { passed: false, error: err };
    }

    const isTruthy = lua.lua_toboolean(this.L, -1);
    lua.lua_pop(this.L, 1);
    return { passed: Boolean(isTruthy) };
  }

  /**
   * Execute a DS4U Lua script block.
   */
  public executeScript(
    scriptCode: string,
    context?: { actorName?: string; conversantName?: string }
  ): LuaScriptResult {
    if (!scriptCode || !scriptCode.trim()) {
      return { success: true, alerts: [] };
    }

    if (context) {
      this.setConversationContext(context.actorName, context.conversantName);
    }

    // Clear alert buffer before script
    this.runRawScript("__fw_alerts = {}");

    const status = lauxlib.luaL_dostring(this.L, to_luastring(scriptCode.trim()));
    if (status !== 0) {
      const err = to_jsstring(lua.lua_tostring(this.L, -1));
      lua.lua_pop(this.L, 1);
      return { success: false, error: err, alerts: [] };
    }

    const alerts = this.extractAlerts();
    return { success: true, alerts };
  }

  /**
   * Parse DS4U formatted text with inline tags:
   * [lua(expression)] -> evaluated Lua string
   * [var=VariableName] -> variable value
   * [pic=N] -> unchanged or portrait indicator
   */
  public evaluateText(text: string): string {
    if (!text) return "";

    // 1. [var=VariableName]
    let result = text.replace(/\[var=([a-zA-Z0-9_]+)\]/g, (_, varName) => {
      const val = this.getVariable(varName);
      return val !== undefined ? String(val) : "";
    });

    // 2. [lua(code)]
    result = result.replace(/\[lua\((.*?)\)\]/gs, (_, luaCode) => {
      const evalRes = this.runLua(`return tostring(${luaCode})`);
      if (evalRes.success && evalRes.result !== undefined) {
        return String(evalRes.result);
      }
      return `[lua error: ${evalRes.error || "failed"}]`;
    });

    return result;
  }

  /**
   * Run arbitrary Lua code for interactive console.
   */
  public runLua(code: string): { success: boolean; result?: any; output?: string; error?: string } {
    if (!code || !code.trim()) {
      return { success: true, result: null };
    }

    let trimmed = code.trim();
    // Try evaluating as expression first if it doesn't contain statement keywords
    let status = lauxlib.luaL_dostring(this.L, to_luastring(`return (${trimmed})`));
    if (status !== 0) {
      // Pop error from expression attempt and try as raw statement
      lua.lua_pop(this.L, 1);
      status = lauxlib.luaL_dostring(this.L, to_luastring(trimmed));
    }

    if (status !== 0) {
      const err = to_jsstring(lua.lua_tostring(this.L, -1));
      lua.lua_pop(this.L, 1);
      return { success: false, error: err };
    }

    // Read top of stack
    const top = lua.lua_gettop(this.L);
    let retVal: any = undefined;
    if (top > 0) {
      const valType = lua.lua_type(this.L, -1);
      if (valType === lua.LUA_TBOOLEAN) {
        retVal = Boolean(lua.lua_toboolean(this.L, -1));
      } else if (valType === lua.LUA_TNUMBER) {
        retVal = lua.lua_tonumber(this.L, -1);
      } else if (valType === lua.LUA_TSTRING) {
        retVal = to_jsstring(lua.lua_tostring(this.L, -1));
      } else if (valType === lua.LUA_TTABLE) {
        retVal = "[Lua Table]";
      } else if (valType === lua.LUA_TNIL) {
        retVal = null;
      }
      lua.lua_pop(this.L, 1);
    }

    return { success: true, result: retVal };
  }

  /**
   * Extract all current Variables from Lua state into a JS map.
   */
  public getAllVariables(): Record<string, boolean | number | string> {
    const vars: Record<string, boolean | number | string> = {};
    lua.lua_getglobal(this.L, to_luastring("Variable"));
    if (lua.lua_type(this.L, -1) !== lua.LUA_TTABLE) {
      lua.lua_pop(this.L, 1);
      return vars;
    }

    lua.lua_pushnil(this.L);
    while (lua.lua_next(this.L, -2) !== 0) {
      const key = to_jsstring(lua.lua_tostring(this.L, -2));
      const valType = lua.lua_type(this.L, -1);
      if (valType === lua.LUA_TBOOLEAN) {
        vars[key] = Boolean(lua.lua_toboolean(this.L, -1));
      } else if (valType === lua.LUA_TNUMBER) {
        vars[key] = lua.lua_tonumber(this.L, -1);
      } else if (valType === lua.LUA_TSTRING) {
        vars[key] = to_jsstring(lua.lua_tostring(this.L, -1));
      }
      lua.lua_pop(this.L, 1);
    }
    lua.lua_pop(this.L, 1); // pop Variable table
    return vars;
  }

  public getVariable(name: string): boolean | number | string | undefined {
    const all = this.getAllVariables();
    return all[name];
  }

  private extractAlerts(): string[] {
    const alerts: string[] = [];
    lua.lua_getglobal(this.L, to_luastring("__fw_alerts"));
    if (lua.lua_type(this.L, -1) !== lua.LUA_TTABLE) {
      lua.lua_pop(this.L, 1);
      return alerts;
    }

    const len = lua.lua_rawlen(this.L, -1);
    for (let i = 1; i <= len; i++) {
      lua.lua_rawgeti(this.L, -1, i);
      alerts.push(to_jsstring(lua.lua_tostring(this.L, -1)));
      lua.lua_pop(this.L, 1);
    }
    lua.lua_pop(this.L, 1);
    return alerts;
  }

  private runRawScript(script: string): void {
    const status = lauxlib.luaL_dostring(this.L, to_luastring(script));
    if (status !== 0) {
      const err = to_jsstring(lua.lua_tostring(this.L, -1));
      lua.lua_pop(this.L, 1);
      console.warn("DS4U Lua script error:", err, "Script:", script);
    }
  }

  private jsObjectToLuaTable(obj: Record<string, any>): string {
    const pairs: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      let valStr: string;
      if (typeof v === "boolean") {
        valStr = v ? "true" : "false";
      } else if (typeof v === "number") {
        valStr = String(v);
      } else if (typeof v === "string") {
        valStr = JSON.stringify(v);
      } else if (Array.isArray(v)) {
        valStr = "{" + v.map((item) => JSON.stringify(item)).join(", ") + "}";
      } else if (v && typeof v === "object") {
        valStr = this.jsObjectToLuaTable(v);
      } else {
        valStr = "nil";
      }
      pairs.push(`[${JSON.stringify(k)}] = ${valStr}`);
    }
    return "{" + pairs.join(", ") + "}";
  }

  public destroy(): void {
    if (this.L) {
      lua.lua_close(this.L);
      this.L = null;
    }
  }
}

import type { Project } from "../models/project.js";
import type { Variable } from "../models/variable.js";
import type { AnyDialogueNode, ConditionNode, ActionNode } from "../models/node.js";

export type VariableValue = boolean | number | string;
export type VariableEnvironment = Record<string, VariableValue>;

export interface ConditionRule {
  type?: string;
  variableId?: string;
  variableName?: string;
  operator: "equals" | "notEquals" | "greaterThan" | "lessThan" | "greaterThanOrEqual" | "lessThanOrEqual";
  value: VariableValue;
}

export interface ActionRule {
  type?: string;
  actionType?: string;
  variableId?: string;
  variableName?: string;
  value?: VariableValue;
  operation?: "set" | "increment" | "decrement";
  parameters?: Record<string, unknown>;
}

/**
 * Initializes runtime variable environment from a project.
 * Uses both variable ID and variable Name as keys for flexible lookups.
 */
export function createVariableEnvironment(
  variables: Variable[],
  overrides?: Record<string, VariableValue>
): VariableEnvironment {
  const env: VariableEnvironment = {};

  for (const v of variables) {
    let val: VariableValue = v.initialValue;
    if (overrides && overrides[v.name] !== undefined) {
      val = overrides[v.name];
    } else if (overrides && overrides[v.id] !== undefined) {
      val = overrides[v.id];
    }
    env[v.id] = val;
    env[v.name] = val;
  }

  return env;
}

/**
 * Safely parses and evaluates a simple string expression without using eval().
 * Supports:
 *   VariableName == true / false
 *   VariableName != "something"
 *   VariableName >= 10
 *   VariableName <= 5
 *   VariableName > 2
 *   VariableName < 8
 */
export function evaluateExpressionString(
  expression: string,
  env: VariableEnvironment
): boolean {
  const trimmed = expression.trim();
  if (!trimmed || trimmed === "true") return true;
  if (trimmed === "false") return false;

  const operators = ["==", "!=", ">=", "<=", ">", "<"] as const;
  let opMatch: typeof operators[number] | null = null;

  for (const op of operators) {
    if (trimmed.includes(op)) {
      opMatch = op;
      break;
    }
  }

  if (!opMatch) {
    // If it's just a boolean variable name
    if (trimmed in env) {
      return Boolean(env[trimmed]);
    }
    return true;
  }

  const parts = trimmed.split(opMatch);
  if (parts.length !== 2) return true;

  const leftKey = parts[0].trim();
  const rawRight = parts[1].trim();

  const leftValue = env[leftKey] !== undefined ? env[leftKey] : leftKey;

  let rightValue: VariableValue;
  if (rawRight === "true") {
    rightValue = true;
  } else if (rawRight === "false") {
    rightValue = false;
  } else if (!isNaN(Number(rawRight))) {
    rightValue = Number(rawRight);
  } else if (
    (rawRight.startsWith('"') && rawRight.endsWith('"')) ||
    (rawRight.startsWith("'") && rawRight.endsWith("'"))
  ) {
    rightValue = rawRight.slice(1, -1);
  } else if (rawRight in env) {
    rightValue = env[rawRight];
  } else {
    rightValue = rawRight;
  }

  switch (opMatch) {
    case "==":
      return leftValue == rightValue;
    case "!=":
      return leftValue != rightValue;
    case ">":
      return Number(leftValue) > Number(rightValue);
    case "<":
      return Number(leftValue) < Number(rightValue);
    case ">=":
      return Number(leftValue) >= Number(rightValue);
    case "<=":
      return Number(leftValue) <= Number(rightValue);
  }
}

export function evaluateCondition(
  condition: unknown,
  env: VariableEnvironment
): boolean {
  if (!condition) return true;

  if (typeof condition === "string") {
    return evaluateExpressionString(condition, env);
  }

  if (typeof condition === "object" && condition !== null) {
    const c = condition as ConditionRule;
    const varKey = c.variableName || c.variableId;
    if (!varKey) return true;

    const currentVal = env[varKey];
    if (currentVal === undefined) return false;

    switch (c.operator) {
      case "equals":
        return currentVal == c.value;
      case "notEquals":
        return currentVal != c.value;
      case "greaterThan":
        return Number(currentVal) > Number(c.value);
      case "lessThan":
        return Number(currentVal) < Number(c.value);
      case "greaterThanOrEqual":
        return Number(currentVal) >= Number(c.value);
      case "lessThanOrEqual":
        return Number(currentVal) <= Number(c.value);
    }
  }

  return true;
}

export function executeAction(
  action: unknown,
  env: VariableEnvironment
): { modifiedKey?: string; newValue?: VariableValue } {
  if (!action || typeof action !== "object") return {};

  const a = action as ActionRule;
  const params = a.parameters || {};

  // Case 1: action has parameters.variable and parameters.value
  const targetVar =
    a.variableName ||
    a.variableId ||
    (typeof params["variable"] === "string" ? params["variable"] : undefined);

  if (targetVar) {
    let newVal: VariableValue | undefined = a.value;

    if (newVal === undefined && params["value"] !== undefined) {
      newVal = params["value"] as VariableValue;
    }

    if (newVal !== undefined) {
      env[targetVar] = newVal;
      return { modifiedKey: targetVar, newValue: newVal };
    }
  }

  return {};
}

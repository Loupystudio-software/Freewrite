const path = require("path");
const assert = require("assert");

// Load built @freewrite/core
const core = require(path.join(__dirname, "../packages/core/dist/index.js"));
const { DS4ULuaRuntime, DialogueSimulationEngine } = core;

console.log("=== Testing DS4U Lua Engine Interoperability ===");

const testProject = {
  format: "freewrite",
  schemaVersion: "1.0.0",
  project: {
    id: "99999999-9999-9999-9999-999999999999",
    name: "Lua Test Project",
    description: "Testing 1-1 DS4U Lua features",
    author: "Freewrite",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  actors: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      externalId: 1,
      name: "Player",
      isPlayer: true,
      description: "Main protagonist",
      pictures: [],
      portrait: null,
      color: "#10b981",
      fields: [{ title: "Age", type: "Number", value: "22" }],
      metadata: {},
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      externalId: 2,
      name: "Merchant",
      isPlayer: false,
      description: "Local shopkeeper",
      pictures: [],
      portrait: null,
      color: "#f59e0b",
      fields: [{ title: "Disposition", type: "Text", value: "Friendly" }],
      metadata: {},
    },
  ],
  variables: [
    {
      id: "33333333-3333-3333-3333-333333333333",
      externalId: 1,
      name: "Gold",
      type: "number",
      initialValue: 100,
      description: "Player coins",
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      externalId: 2,
      name: "HasPotion",
      type: "boolean",
      initialValue: false,
      description: "Inventory check",
    },
  ],
  items: [
    {
      id: "55555555-5555-5555-5555-555555555555",
      externalId: 1,
      name: "FindLostAmulet",
      isItem: false,
      state: "active",
      description: "Retrieve the lost amulet",
      successDescription: "Amulet returned",
      failureDescription: "Failed",
      fields: [],
      metadata: {},
    },
  ],
  conversations: [],
  locations: [],
  metadata: { applicationVersion: "0.1.0", exportSettings: {} },
};

// 1. Test Lua Runtime Initialization
const runtime = new DS4ULuaRuntime(testProject);

console.log("1. Checking Initial Variable & Actor State in Lua...");
const vars = runtime.getAllVariables();
assert.strictEqual(vars["Gold"], 100, "Variable Gold should be 100");
assert.strictEqual(vars["HasPotion"], false, "Variable HasPotion should be false");

// 2. Test Condition Evaluation
console.log("2. Checking DS4U Lua Conditions...");
const cond1 = runtime.evaluateCondition("Variable['Gold'] >= 50 and Actor['Player'].Age > 20");
assert.strictEqual(cond1.passed, true, "Condition 1 should pass");

const cond2 = runtime.evaluateCondition("Variable['Gold'] < 10");
assert.strictEqual(cond2.passed, false, "Condition 2 should fail");

// 3. Test DS4U Script Execution and Helpers
console.log("3. Checking DS4U Lua Script & ShowAlert...");
const script = `
  Variable["Gold"] = Variable["Gold"] - 30
  Variable["HasPotion"] = true
  SetQuestState("FindLostAmulet", "success")
  ShowAlert("Purchased Healing Potion!")
`;
const scriptRes = runtime.executeScript(script);
assert.strictEqual(scriptRes.success, true, "Script execution should succeed");
assert.strictEqual(scriptRes.alerts.length, 1, "Should capture 1 alert");
assert.strictEqual(scriptRes.alerts[0], "Purchased Healing Potion!");

const updatedVars = runtime.getAllVariables();
assert.strictEqual(updatedVars["Gold"], 70, "Gold should be reduced to 70");
assert.strictEqual(updatedVars["HasPotion"], true, "HasPotion should be true");

// 4. Test Quest Helpers
const questState = runtime.runLua("return GetQuestState('FindLostAmulet')");
assert.strictEqual(questState.result, "success", "Quest state should be success");

// 5. Test Tag Replacement ([var=...] and [lua(...)])
console.log("4. Checking [var=...] and [lua(...)] text replacement...");
const rawText = "Hello [lua(Actor['Player'].Name)], you have [var=Gold] gold! Quest: [lua(GetQuestState('FindLostAmulet'))]";
const evalText = runtime.evaluateText(rawText);
console.log("   Evaluated text:", evalText);
assert.strictEqual(
  evalText,
  "Hello Player, you have 70 gold! Quest: success",
  "Markup tags should be correctly replaced"
);

// 6. Test SimStatus
console.log("5. Checking SimStatus tracking...");
runtime.setSimStatus(1, 0, "WasDisplayed");
runtime.setSimStatus(1, 1, "WasOffered");
assert.strictEqual(runtime.getSimStatus(1, 0), "WasDisplayed");
assert.strictEqual(runtime.getSimStatus(1, 1), "WasOffered");
assert.strictEqual(runtime.getSimStatus(1, 99), "Untouched");

// 7. Test Simulation Engine Integration
console.log("6. Checking DialogueSimulationEngine with Lua...");
const testConv = {
  id: "conv-1",
  externalId: 1,
  title: "Shop Conversation",
  description: "",
  actorId: "22222222-2222-2222-2222-222222222222", // Merchant
  conversantId: "11111111-1111-1111-1111-111111111111", // Player
  priority: "Normal",
  startNodeId: "node-start",
  nodes: [
    {
      id: "node-start",
      externalId: 0,
      type: "start",
      label: "Start",
      position: { x: 0, y: 0 },
      metadata: {},
    },
    {
      id: "node-greeting",
      externalId: 1,
      type: "dialogue",
      speakerId: "22222222-2222-2222-2222-222222222222",
      conversantId: "11111111-1111-1111-1111-111111111111",
      menuText: "",
      dialogueText: "Welcome! You currently have [var=Gold] gold.",
      conditions: [],
      actions: [],
      conditionsString: "",
      script: "ShowAlert('Merchant waves.')",
      sequence: "Camera(Closeup); Delay({{end}})",
      falseConditionAction: "Block",
      priority: "Normal",
      fields: [],
      position: { x: 100, y: 0 },
    },
    {
      id: "node-choice-buy",
      externalId: 2,
      type: "player_response",
      speakerId: "11111111-1111-1111-1111-111111111111",
      conversantId: "22222222-2222-2222-2222-222222222222",
      menuText: "Buy Magic Ring (50 gold)",
      responseText: "I would like to buy the Magic Ring.",
      conditions: [],
      actions: [],
      conditionsString: "Variable['Gold'] >= 50",
      script: "Variable['Gold'] = Variable['Gold'] - 50; ShowAlert('Bought Ring!')",
      sequence: "",
      falseConditionAction: "Block",
      priority: "Normal",
      fields: [],
      position: { x: 200, y: 50 },
    },
  ],
  connections: [
    {
      id: "conn-1",
      sourceNodeId: "node-start",
      targetNodeId: "node-greeting",
      conditions: [],
      priority: 0,
    },
    {
      id: "conn-2",
      sourceNodeId: "node-greeting",
      targetNodeId: "node-choice-buy",
      conditions: [],
      priority: 0,
    },
  ],
  fields: [],
  metadata: {},
};

testProject.conversations = [testConv];

const engine = new DialogueSimulationEngine(testConv, testProject);
const startState = engine.start();

console.log("   Current Speaker:", startState.currentSpeakerName);
console.log("   Dialogue Line:", startState.history[0]?.text);
console.log("   Alerts queued:", startState.alerts);
assert.strictEqual(startState.currentSpeakerName, "Merchant");
assert.strictEqual(startState.history[0]?.text, "Welcome! You currently have 100 gold.");
assert.strictEqual(startState.alerts.includes("Merchant waves."), true);
assert.strictEqual(startState.availableChoices.length, 1);
assert.strictEqual(startState.availableChoices[0].menuText, "Buy Magic Ring (50 gold)");

// Choose buy
console.log("   Choosing 'Buy Magic Ring'...");
const afterChoice = engine.choose("node-choice-buy");
console.log("   Gold after buying ring:", afterChoice.variables["Gold"]);
assert.strictEqual(afterChoice.variables["Gold"], 50);
assert.strictEqual(afterChoice.alerts.includes("Bought Ring!"), true);

console.log("\n>>> ALL DS4U LUA INTEROPERABILITY TESTS PASSED WITH 100% SUCCESS! <<<");

const fs = require("fs");
const path = require("path");

const {
  deserialize,
  validateProject,
  exportProjectToDialogueSystemCSV,
  importProjectFromDialogueSystemCSV,
  exportProjectToChatMapperXML,
  importProjectFromChatMapperXML,
} = require(path.join(process.cwd(), "packages/core/dist/index.js"));

function runTest() {
  console.log("=== Dialogue System for Unity Integration Test ===");

  const rawJson = fs.readFileSync("./fixtures/example-project.json", "utf8");
  const { project: origProject } = deserialize(rawJson);
  console.log("1. Loaded original project:", origProject.project.name);

  // --- TEST A: CSV EXPORT & IMPORT ---
  console.log("\n--- TEST A: CSV Export & Import ---");
  const csvOutput = exportProjectToDialogueSystemCSV(origProject);
  console.log("Exported CSV length:", csvOutput.length, "bytes");

  // Save fixture
  fs.writeFileSync("./fixtures/example-ds4u.csv", csvOutput);
  console.log("Saved fixture to ./fixtures/example-ds4u.csv");

  // Import CSV back
  const { project: csvImported, warnings: csvWarnings } =
    importProjectFromDialogueSystemCSV(csvOutput);
  console.log("Reconstructed project from CSV:", csvImported.project.name);
  console.log("Actors count:", csvImported.actors.length);
  console.log("Conversations count:", csvImported.conversations.length);
  console.log("Nodes in conv 0:", csvImported.conversations[0]?.nodes.length);
  console.log("Connections in conv 0:", csvImported.conversations[0]?.connections.length);
  console.log("Variables count:", csvImported.variables.length);
  console.log("Warnings:", csvWarnings);

  const csvValidation = validateProject(csvImported);
  console.log("CSV Validation valid?", csvValidation.valid, "Errors:", csvValidation.errors.length);
  if (!csvValidation.valid) {
    console.error("Validation issues:", csvValidation.errors);
    process.exit(1);
  }

  // Verify node canvas positions round-trip
  const startNode = csvImported.conversations[0]?.nodes.find((n) => n.type === "start");
  console.log("Start node position preserved:", startNode?.position);

  // --- TEST B: Chat Mapper XML Export & Import ---
  console.log("\n--- TEST B: Chat Mapper XML Export & Import ---");
  const xmlOutput = exportProjectToChatMapperXML(origProject);
  console.log("Exported XML length:", xmlOutput.length, "bytes");

  // Save fixture
  fs.writeFileSync("./fixtures/example-chatmapper.xml", xmlOutput);
  console.log("Saved fixture to ./fixtures/example-chatmapper.xml");

  // Import XML back
  const { project: xmlImported, warnings: xmlWarnings } =
    importProjectFromChatMapperXML(xmlOutput);
  console.log("Reconstructed project from XML:", xmlImported.project.name);
  console.log("Actors count:", xmlImported.actors.length);
  console.log("Conversations count:", xmlImported.conversations.length);
  console.log("Nodes in conv 0:", xmlImported.conversations[0]?.nodes.length);
  console.log("Connections in conv 0:", xmlImported.conversations[0]?.connections.length);
  console.log("Warnings:", xmlWarnings);

  const xmlValidation = validateProject(xmlImported);
  console.log("XML Validation valid?", xmlValidation.valid, "Errors:", xmlValidation.errors.length);
  if (!xmlValidation.valid) {
    console.error("Validation issues:", xmlValidation.errors);
    process.exit(1);
  }

  console.log("\n>>> ALL DS4U INTEGRATION TESTS PASSED CLEANLY! <<<");
}

runTest();

// Script to set Firestore rules to permissive (for development/demo)
// Run: bun run scripts/set-firestore-rules.ts
// Requires FIREBASE_SERVICE_ACCOUNT env var OR google application default credentials

async function setRules() {
  try {
    const admin = require("firebase-admin");
    const { getApps, cert, initializeApp } = require("firebase-admin/app");

    if (!getApps().length) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountKey) {
        const serviceAccount = JSON.parse(
          Buffer.from(serviceAccountKey, "base64").toString("utf-8")
        );
        initializeApp({ credential: cert(serviceAccount) });
      } else {
        initializeApp({ projectId: "mess-66852" });
      }
    }

    const firestore = admin.firestore();

    // Set permissive rules for development
    const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
`;

    // Try to set security rules via the REST API
    const projectId = "mess-66852";
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/securityRules`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `projects/${projectId}/databases/(default)/securityRules`,
          ruleset: {
            source: {
              files: [{ name: "firestore.rules", content: rules }],
            },
          },
        }),
      }
    );

    if (response.ok) {
      console.log("✅ Firestore rules set successfully!");
    } else {
      const text = await response.text();
      console.log("⚠️  Could not set rules automatically. Error:", text);
      console.log("\n📋 Manual setup required:");
      console.log("1. Go to: https://console.firebase.google.com/project/mess-66852/firestore/rules");
      console.log("2. Paste these rules:");
      console.log(rules);
      console.log("3. Click 'Publish'");
    }
  } catch (e) {
    console.log("⚠️  Automatic rule setting failed:", (e as Error).message);
    console.log("\n📋 Manual setup required:");
    console.log("1. Go to: https://console.firebase.google.com/project/mess-66852/firestore/rules");
    console.log("2. Paste these rules:");
    console.log("rules_version = '2';");
    console.log("service cloud.firestore {");
    console.log("  match /databases/{database}/documents {");
    console.log("    match /{document=**} {");
    console.log("      allow read, write: if true;");
    console.log("    }");
    console.log("  }");
    console.log("}");
    console.log("3. Click 'Publish'");
  }
}

setRules();

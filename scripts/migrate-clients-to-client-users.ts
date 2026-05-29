/**
 * One-off migration: legacy `clients` (auth allowlist) → `client_users`.
 *
 * Background
 * ----------
 * Before Phase 1a, the `clients` Firestore collection was the auth allowlist
 * for client-portal users (docs with at least an `email` field). Phase 1a
 * repurposed `clients` as the Client *entity* collection (production
 * house / studio / indie producer, with `name`, `accountManagerId`,
 * `engagementType`, etc.). The auth allowlist moved to `client_users`.
 *
 * After Phase 1a/1b shipped, the `clients` collection can contain a mix of
 * shapes:
 *
 *  - "new-client"  — created Phase 1a+. Has `name` AND `accountManagerId`.
 *                    Leave alone.
 *  - "legacy-auth" — pre-Phase 1a. Has `email` but no `accountManagerId`
 *                    (and usually no `name`). Copy to `client_users`.
 *  - "ambiguous"   — neither pattern fits cleanly. Skip and report for
 *                    manual review.
 *
 * What this script does
 * ---------------------
 * 1. Reads every doc in `clients`.
 * 2. Classifies it.
 * 3. Dry-run (default): prints classifications, writes nothing.
 * 4. With `--apply`: copies each "legacy-auth" doc to
 *    `client_users/{same-id}`. Idempotent — if `client_users/{id}` already
 *    exists, the script skips it (logs a notice).
 *
 * The script never deletes from the source `clients` collection. After you
 * verify the copy in production (e.g. by signing in as a client-portal user
 * and confirming the dashboard loads), you can delete the legacy docs from
 * `clients` via the Firebase console or a follow-up script.
 *
 * Setup
 * -----
 * 1. `npm install` (firebase-admin is in devDependencies)
 * 2. Download a service-account JSON from Firebase Console → Project
 *    Settings → Service accounts → Generate new private key.
 * 3. Set the env var: `export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json`
 *    (keep the JSON OUT of git — add to .gitignore if not already covered).
 *
 * Usage
 * -----
 * Dry-run:   `npm run migrate:clients`
 * Apply:     `npm run migrate:clients -- --apply`
 */

import { cert, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');

function initAdmin() {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const json = JSON.parse(readFileSync(credPath, 'utf8'));
    initializeApp({ credential: cert(json) });
  } else {
    // Falls back to gcloud ADC if the user is already logged in there.
    initializeApp({ credential: applicationDefault() });
  }
}

type Classification = 'new-client' | 'legacy-auth' | 'ambiguous';

function classify(data: FirebaseFirestore.DocumentData): { kind: Classification; reason: string } {
  const hasName = typeof data.name === 'string' && data.name.length > 0;
  const hasAccountManager = typeof data.accountManagerId === 'string' && data.accountManagerId.length > 0;
  const hasEmail = typeof data.email === 'string' && data.email.length > 0;

  if (hasName && hasAccountManager) return { kind: 'new-client', reason: 'has name + accountManagerId' };
  if (hasEmail && !hasAccountManager) return { kind: 'legacy-auth', reason: 'has email, no accountManagerId' };
  return { kind: 'ambiguous', reason: `name=${hasName} accountManagerId=${hasAccountManager} email=${hasEmail}` };
}

async function main() {
  initAdmin();
  const db = getFirestore();

  const snapshot = await db.collection('clients').get();
  console.log(`Found ${snapshot.size} docs in 'clients' collection.\n`);

  const newClients: { id: string; reason: string }[] = [];
  const legacyAuth: { id: string; email: string; data: FirebaseFirestore.DocumentData }[] = [];
  const ambiguous: { id: string; reason: string; data: FirebaseFirestore.DocumentData }[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const { kind, reason } = classify(data);
    if (kind === 'new-client') {
      newClients.push({ id: doc.id, reason });
    } else if (kind === 'legacy-auth') {
      legacyAuth.push({ id: doc.id, email: data.email, data });
    } else {
      ambiguous.push({ id: doc.id, reason, data });
    }
  }

  console.log(`== Classification ==`);
  console.log(`  new-client (leave alone):   ${newClients.length}`);
  console.log(`  legacy-auth (will migrate): ${legacyAuth.length}`);
  console.log(`  ambiguous (skip + report):  ${ambiguous.length}\n`);

  if (legacyAuth.length > 0) {
    console.log(`== Legacy auth docs to migrate to 'client_users' ==`);
    for (const item of legacyAuth) {
      console.log(`  ${item.id}  email=${item.email}`);
    }
    console.log();
  }

  if (ambiguous.length > 0) {
    console.log(`== Ambiguous docs (NOT migrated — review manually) ==`);
    for (const item of ambiguous) {
      console.log(`  ${item.id}  ${item.reason}`);
      console.log(`    data:`, JSON.stringify(item.data));
    }
    console.log();
  }

  if (!APPLY) {
    console.log(`Dry-run only. Re-run with '--apply' to perform the migration.`);
    return;
  }

  if (legacyAuth.length === 0) {
    console.log(`Nothing to apply.`);
    return;
  }

  console.log(`== Applying migration ==`);
  let copied = 0;
  let skipped = 0;
  let failed = 0;
  for (const item of legacyAuth) {
    const target = db.collection('client_users').doc(item.id);
    try {
      const existing = await target.get();
      if (existing.exists) {
        const existingEmail = existing.data()?.email;
        if (existingEmail === item.email) {
          console.log(`  skip ${item.id} — already in client_users with matching email`);
          skipped += 1;
          continue;
        }
        console.log(`  WARN ${item.id} — client_users doc exists with different email (${existingEmail} vs ${item.email}); not overwriting`);
        skipped += 1;
        continue;
      }
      await target.set(item.data);
      console.log(`  copied ${item.id}`);
      copied += 1;
    } catch (err: any) {
      console.log(`  FAIL ${item.id} — ${err.message || err}`);
      failed += 1;
    }
  }

  console.log(`\nDone. copied=${copied} skipped=${skipped} failed=${failed}`);
  console.log(`Source docs in 'clients' were NOT deleted. Verify portal sign-in still works, then delete legacy docs manually.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

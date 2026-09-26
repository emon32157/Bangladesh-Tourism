/**
 * Script to assign Firebase Custom Claims (role: "admin") to any user
 * using the Firebase Admin SDK.
 * 
 * Usage:
 *   node scripts/set-admin-claim.js <USER_UID>
 * 
 * Requirements:
 *   Place your serviceAccountKey.json in the project root or specify
 *   GOOGLE_APPLICATION_CREDENTIALS in your environment.
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetUid = process.argv[2];

if (!targetUid) {
  console.error('\nUsage: node scripts/set-admin-claim.js <USER_UID>\n');
  console.error('Example: node scripts/set-admin-claim.js dG81hK9Lw0mP12\n');
  process.exit(1);
}

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  console.log(`Setting Custom Claim { role: "admin" } for UID: ${targetUid}...`);

  await admin.auth().setCustomUserClaims(targetUid, { role: 'admin' });

  // Also update Firestore 'admins' and 'users' collections for fast lookup
  const db = admin.firestore();
  await db.collection('admins').doc(targetUid).set(
    {
      uid: targetUid,
      role: 'admin',
      assignedAt: Date.now(),
    },
    { merge: true }
  );

  await db.collection('users').doc(targetUid).set(
    {
      role: 'admin',
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  console.log(`✅ Success! User ${targetUid} has been granted verified Admin role.`);
  console.log('The user must sign out and sign in again to receive their new Admin token.\n');
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to assign admin claim:', error);
  process.exit(1);
}

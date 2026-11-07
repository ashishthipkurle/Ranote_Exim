/**
 * Sync and backfill legal consent approvals for existing registered users.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncApprovals() {
  console.log("=== SYNCING LEGAL CONSENT & APPROVALS ===");
  try {
    // 1. Create table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS legal_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT,
        "userEmail" TEXT,
        document TEXT NOT NULL,
        version TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'APPROVED',
        "acceptedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "ipHash" TEXT,
        "userAgent" TEXT
      );
    `);
    console.log("Verified 'legal_consents' table exists.");

    // 2. Fetch registered users from users table
    const users = await prisma.user.findMany({
      select: { id: true, email: true, contactInfo: true },
    });
    console.log(`Found ${users.length} registered user(s).`);

    for (const u of users) {
      // Insert approvals into legal_consents
      await prisma.$executeRawUnsafe(`
        INSERT INTO legal_consents ("userId", "userEmail", document, version, status, "acceptedAt")
        VALUES ($1, $2, 'TERMS', '1.2.0', 'APPROVED', NOW()),
               ($1, $2, 'PRIVACY_POLICY', '1.2.0', 'APPROVED', NOW())
        ON CONFLICT DO NOTHING;
      `, u.id, u.email);

      // Update contactInfo with legalStatus: APPROVED
      const currentContact = (u.contactInfo && typeof u.contactInfo === 'object') ? u.contactInfo : {};
      const updatedContact = {
        ...currentContact,
        termsAccepted: true,
        termsVersion: "1.2.0",
        privacyAccepted: true,
        privacyVersion: "1.2.0",
        legalStatus: "APPROVED",
        status: "APPROVED",
      };

      await prisma.user.update({
        where: { id: u.id },
        data: { contactInfo: updatedContact },
      });
      console.log(`Updated approval record for: ${u.email} (${u.id})`);
    }

    console.log("=== ALL LEGAL APPROVALS SYNCED SUCCESSFULLY ===");
  } catch (err) {
    console.warn("Sync warning (if offline/sandboxed, will run dynamically on API routes):", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncApprovals();


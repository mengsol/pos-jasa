-- ============================================================
-- Loyalty Reward — Supabase migration
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Run
-- Aman dijalankan ulang (idempotent): pakai IF NOT EXISTS
-- ============================================================

-- 1. Customer
CREATE TABLE IF NOT EXISTS "Customer" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "phone"     TEXT NOT NULL,
    "note"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_phone_key" ON "Customer"("phone");

-- 2. LoyaltyConfig
CREATE TABLE IF NOT EXISTS "LoyaltyConfig" (
    "id"              TEXT NOT NULL,
    "minTransactions" INTEGER NOT NULL DEFAULT 10,
    "withinDays"      INTEGER NOT NULL DEFAULT 30,
    "claimDaysLimit"  INTEGER NOT NULL DEFAULT 60,
    "rewardServiceId" TEXT,
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "LoyaltyConfig_pkey" PRIMARY KEY ("id")
);

-- 3. PendingReward
CREATE TABLE IF NOT EXISTS "PendingReward" (
    "id"                 TEXT NOT NULL,
    "customerId"         TEXT NOT NULL,
    "unlockedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"          TIMESTAMP(3) NOT NULL,
    "status"             TEXT NOT NULL DEFAULT 'pending',
    "claimedAt"          TIMESTAMP(3),
    "claimTransactionId" TEXT,
    CONSTRAINT "PendingReward_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PendingReward_customerId_status_idx"
    ON "PendingReward"("customerId", "status");

-- 4. RewardClaim
CREATE TABLE IF NOT EXISTS "RewardClaim" (
    "id"            TEXT NOT NULL,
    "customerId"    TEXT NOT NULL,
    "transactionId" TEXT,
    "claimedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RewardClaim_pkey" PRIMARY KEY ("id")
);

-- 5. Tambah kolom customerId ke Transaction (opsional)
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

-- 6. Foreign keys (dibungkus DO supaya tidak error kalau sudah ada)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PendingReward_customerId_fkey') THEN
        ALTER TABLE "PendingReward"
            ADD CONSTRAINT "PendingReward_customerId_fkey"
            FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RewardClaim_customerId_fkey') THEN
        ALTER TABLE "RewardClaim"
            ADD CONSTRAINT "RewardClaim_customerId_fkey"
            FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_customerId_fkey') THEN
        ALTER TABLE "Transaction"
            ADD CONSTRAINT "Transaction_customerId_fkey"
            FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

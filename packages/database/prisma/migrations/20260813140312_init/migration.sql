-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StageKey" AS ENUM ('PROFILER', 'DISCOVERY', 'SEMANTIC_DEDUP', 'VERIFIER', 'PRICING', 'FEATURE', 'POSITIONING', 'STRATEGIST', 'CRITIC');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED', 'RETRYING');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "CompetitorType" AS ENUM ('DIRECT', 'INDIRECT', 'SUBSTITUTE');

-- CreateEnum
CREATE TYPE "CompetitorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlanBand" AS ENUM ('FREE', 'GROWTH', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('YES', 'PARTIAL', 'NO', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OpportunityKind" AS ENUM ('PRODUCT', 'MARKETING', 'PRICING', 'POSITIONING');

-- CreateEnum
CREATE TYPE "EvidenceClaimType" AS ENUM ('TARGET_PROFILE', 'CANDIDATE', 'COMPETITOR', 'PRICING_PLAN', 'FEATURE_CLAIM', 'POSITIONING', 'OPPORTUNITY');

-- CreateEnum
CREATE TYPE "TrustTier" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "targets" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "canonicalDomain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faviconUrl" TEXT,
    "context" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_profiles" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "category" TEXT,
    "icp" TEXT,
    "pricingModel" TEXT,
    "valueProps" JSONB,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "confidenceReasons" JSONB,
    "corrected" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "target_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runs" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "cancelRequestedAt" TIMESTAMP(3),
    "retryBudget" INTEGER NOT NULL DEFAULT 3,
    "costUsd" DECIMAL(10,2),
    "previousRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stages" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "key" "StageKey" NOT NULL,
    "status" "StageStatus" NOT NULL DEFAULT 'QUEUED',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "inputArtifact" JSONB,
    "outputArtifact" JSONB,
    "summary" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "canonicalDomain" TEXT NOT NULL,
    "rationale" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "status" "CandidateStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "canonicalDomain" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "logoUrl" TEXT,
    "type" "CompetitorType" NOT NULL,
    "status" "CompetitorStatus" NOT NULL DEFAULT 'ACTIVE',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "confidenceReasons" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "band" "PlanBand" NOT NULL,
    "amount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" "BillingInterval" NOT NULL,
    "limits" JSONB,
    "includedFeatures" JSONB,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_claims" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "competitorId" TEXT,
    "targetId" TEXT,
    "featureId" TEXT NOT NULL,
    "support" "SupportStatus" NOT NULL,
    "detail" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "confidenceReasons" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positionings" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "competitorId" TEXT,
    "targetId" TEXT,
    "icp" TEXT,
    "categoryClaim" TEXT,
    "differentiators" JSONB,
    "tone" TEXT,
    "axes" JSONB,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positionings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "kind" "OpportunityKind" NOT NULL,
    "gap" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "suggestedMove" TEXT NOT NULL,
    "whatToSay" TEXT,
    "impact" INTEGER,
    "effort" INTEGER,
    "defensibility" INTEGER,
    "rank" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidences" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "claimType" "EvidenceClaimType" NOT NULL,
    "claimId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "excerpt" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT NOT NULL,
    "snapshotKey" TEXT,
    "trustTier" "TrustTier" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_reports" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stageKey" "StageKey",
    "score" INTEGER NOT NULL DEFAULT 0,
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "sourcing" INTEGER NOT NULL DEFAULT 0,
    "plausibility" INTEGER NOT NULL DEFAULT 0,
    "issues" JSONB,
    "rerunStage" "StageKey",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diffs" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "fromRunId" TEXT NOT NULL,
    "toRunId" TEXT NOT NULL,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'INACTIVE',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_value_key" ON "verifications"("value");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_identifier_value_key" ON "verifications"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");

-- CreateIndex
CREATE INDEX "workspace_members_workspaceId_role_idx" ON "workspace_members"("workspaceId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "targets_workspaceId_createdAt_idx" ON "targets"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "targets_canonicalDomain_idx" ON "targets"("canonicalDomain");

-- CreateIndex
CREATE UNIQUE INDEX "targets_workspaceId_canonicalDomain_key" ON "targets"("workspaceId", "canonicalDomain");

-- CreateIndex
CREATE INDEX "target_profiles_targetId_idx" ON "target_profiles"("targetId");

-- CreateIndex
CREATE INDEX "target_profiles_runId_idx" ON "target_profiles"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "target_profiles_runId_key" ON "target_profiles"("runId");

-- CreateIndex
CREATE INDEX "runs_targetId_createdAt_idx" ON "runs"("targetId", "createdAt");

-- CreateIndex
CREATE INDEX "runs_status_idx" ON "runs"("status");

-- CreateIndex
CREATE INDEX "runs_previousRunId_idx" ON "runs"("previousRunId");

-- CreateIndex
CREATE INDEX "stages_runId_key_idx" ON "stages"("runId", "key");

-- CreateIndex
CREATE INDEX "stages_status_idx" ON "stages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "stages_runId_key_attempt_key" ON "stages"("runId", "key", "attempt");

-- CreateIndex
CREATE INDEX "candidates_runId_status_idx" ON "candidates"("runId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_runId_canonicalDomain_key" ON "candidates"("runId", "canonicalDomain");

-- CreateIndex
CREATE INDEX "competitors_runId_type_idx" ON "competitors"("runId", "type");

-- CreateIndex
CREATE INDEX "competitors_runId_status_idx" ON "competitors"("runId", "status");

-- CreateIndex
CREATE INDEX "competitors_canonicalDomain_idx" ON "competitors"("canonicalDomain");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_runId_canonicalDomain_key" ON "competitors"("runId", "canonicalDomain");

-- CreateIndex
CREATE INDEX "pricing_plans_competitorId_band_idx" ON "pricing_plans"("competitorId", "band");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plans_competitorId_name_interval_key" ON "pricing_plans"("competitorId", "name", "interval");

-- CreateIndex
CREATE UNIQUE INDEX "features_slug_key" ON "features"("slug");

-- CreateIndex
CREATE INDEX "features_category_idx" ON "features"("category");

-- CreateIndex
CREATE INDEX "features_parentId_idx" ON "features"("parentId");

-- CreateIndex
CREATE INDEX "feature_claims_runId_featureId_idx" ON "feature_claims"("runId", "featureId");

-- CreateIndex
CREATE INDEX "feature_claims_competitorId_idx" ON "feature_claims"("competitorId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_claims_runId_competitorId_featureId_key" ON "feature_claims"("runId", "competitorId", "featureId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_claims_runId_targetId_featureId_key" ON "feature_claims"("runId", "targetId", "featureId");

-- CreateIndex
CREATE INDEX "positionings_runId_idx" ON "positionings"("runId");

-- CreateIndex
CREATE INDEX "positionings_competitorId_idx" ON "positionings"("competitorId");

-- CreateIndex
CREATE UNIQUE INDEX "positionings_runId_competitorId_key" ON "positionings"("runId", "competitorId");

-- CreateIndex
CREATE UNIQUE INDEX "positionings_runId_targetId_key" ON "positionings"("runId", "targetId");

-- CreateIndex
CREATE INDEX "opportunities_runId_kind_idx" ON "opportunities"("runId", "kind");

-- CreateIndex
CREATE INDEX "opportunities_runId_rank_idx" ON "opportunities"("runId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_runId_rank_key" ON "opportunities"("runId", "rank");

-- CreateIndex
CREATE INDEX "evidences_claimType_claimId_idx" ON "evidences"("claimType", "claimId");

-- CreateIndex
CREATE INDEX "evidences_url_idx" ON "evidences"("url");

-- CreateIndex
CREATE INDEX "evidences_contentHash_idx" ON "evidences"("contentHash");

-- CreateIndex
CREATE INDEX "evidences_runId_idx" ON "evidences"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "quality_reports_runId_key" ON "quality_reports"("runId");

-- CreateIndex
CREATE INDEX "quality_reports_runId_stageKey_idx" ON "quality_reports"("runId", "stageKey");

-- CreateIndex
CREATE INDEX "diffs_targetId_createdAt_idx" ON "diffs"("targetId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "diffs_fromRunId_toRunId_key" ON "diffs"("fromRunId", "toRunId");

-- CreateIndex
CREATE INDEX "integrations_workspaceId_status_idx" ON "integrations"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_workspaceId_provider_key" ON "integrations"("workspaceId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_prefix_key" ON "api_keys"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_secretHash_key" ON "api_keys"("secretHash");

-- CreateIndex
CREATE INDEX "api_keys_workspaceId_revokedAt_idx" ON "api_keys"("workspaceId", "revokedAt");

-- CreateIndex
CREATE INDEX "api_keys_prefix_idx" ON "api_keys"("prefix");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "targets" ADD CONSTRAINT "targets_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_profiles" ADD CONSTRAINT "target_profiles_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_profiles" ADD CONSTRAINT "target_profiles_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_previousRunId_fkey" FOREIGN KEY ("previousRunId") REFERENCES "runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_plans" ADD CONSTRAINT "pricing_plans_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_claims" ADD CONSTRAINT "feature_claims_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_claims" ADD CONSTRAINT "feature_claims_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_claims" ADD CONSTRAINT "feature_claims_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_claims" ADD CONSTRAINT "feature_claims_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positionings" ADD CONSTRAINT "positionings_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positionings" ADD CONSTRAINT "positionings_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positionings" ADD CONSTRAINT "positionings_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_competitor_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_pricingPlan_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "pricing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_featureClaim_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "feature_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_positioning_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "positionings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_opportunity_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_reports" ADD CONSTRAINT "quality_reports_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_fromRunId_fkey" FOREIGN KEY ("fromRunId") REFERENCES "runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_toRunId_fkey" FOREIGN KEY ("toRunId") REFERENCES "runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Custom Check Constraints for Unit 05
ALTER TABLE "target_profiles" ADD CONSTRAINT "chk_target_profile_confidence" CHECK (confidence >= 0 AND confidence <= 100);
ALTER TABLE "candidates" ADD CONSTRAINT "chk_candidate_confidence" CHECK (confidence >= 0 AND confidence <= 100);
ALTER TABLE "competitors" ADD CONSTRAINT "chk_competitor_confidence" CHECK (confidence >= 0 AND confidence <= 100);
ALTER TABLE "pricing_plans" ADD CONSTRAINT "chk_pricing_plan_confidence" CHECK (confidence >= 0 AND confidence <= 100);
ALTER TABLE "pricing_plans" ADD CONSTRAINT "chk_pricing_plan_amount" CHECK (amount IS NULL OR amount >= 0);
ALTER TABLE "feature_claims" ADD CONSTRAINT "chk_feature_claim_confidence" CHECK (confidence >= 0 AND confidence <= 100);
ALTER TABLE "positionings" ADD CONSTRAINT "chk_positioning_confidence" CHECK (confidence >= 0 AND confidence <= 100);
ALTER TABLE "opportunities" ADD CONSTRAINT "chk_opportunity_confidence" CHECK (confidence >= 0 AND confidence <= 100);

-- Leaderboard: ORDER BY lmsPoints DESC, updatedAt ASC (+ rank tie-break queries)

CREATE INDEX "UserLmsStats_lmsPoints_updatedAt_idx" ON "UserLmsStats"("lmsPoints" DESC, "updatedAt" ASC);

-- Client hub brand kit (control-plane ClientHub — unused on tenant copies of this table).
ALTER TABLE "ClientHub" ADD COLUMN "brandKit" JSONB;

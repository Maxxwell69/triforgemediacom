-- AlterEnum
-- New enum values cannot be used in the same Postgres transaction they are added.
ALTER TYPE "UserRole" ADD VALUE 'RECRUIT';

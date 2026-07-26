-- CreateTable
CREATE TABLE "TikTokConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "followerCount" INTEGER,
    "followingCount" INTEGER,
    "likesCount" INTEGER,
    "videoCount" INTEGER,
    "statsUpdatedAt" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TikTokConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TikTokConnection_userId_key" ON "TikTokConnection"("userId");

-- AddForeignKey
ALTER TABLE "TikTokConnection" ADD CONSTRAINT "TikTokConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

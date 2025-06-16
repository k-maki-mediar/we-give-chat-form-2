-- Add chat-related models for chat-form integration

-- Create ChatContext table
CREATE TABLE IF NOT EXISTS "ChatContext" (
    "chatId" TEXT NOT NULL,
    "contextData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatContext_pkey" PRIMARY KEY ("chatId"),
    CONSTRAINT "ChatContext_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ChatSession table
CREATE TABLE IF NOT EXISTS "ChatSession" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "anonymousId" TEXT,
    "recoveryToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ChatSession_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique indexes for ChatSession
CREATE UNIQUE INDEX IF NOT EXISTS "ChatSession_chatId_key" ON "ChatSession"("chatId");
CREATE UNIQUE INDEX IF NOT EXISTS "ChatSession_recoveryToken_key" ON "ChatSession"("recoveryToken");

-- Create ChatFlowMaster table
CREATE TABLE IF NOT EXISTS "ChatFlowMaster" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "flow" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    CONSTRAINT "ChatFlowMaster_pkey" PRIMARY KEY ("id")
);

-- Create unique index for ChatFlowMaster version
CREATE UNIQUE INDEX IF NOT EXISTS "ChatFlowMaster_version_key" ON "ChatFlowMaster"("version");
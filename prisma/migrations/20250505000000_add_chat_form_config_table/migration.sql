-- CreateTable
CREATE TABLE "ChatFormConfig" (
  "id" TEXT NOT NULL,
  "organizationId" INTEGER NOT NULL,
  "formId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "primaryColor" TEXT,
  "logoUrl" TEXT,
  "customCss" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "flow" JSONB,
  "allowAnonymous" BOOLEAN NOT NULL DEFAULT true,
  "requireEmail" BOOLEAN NOT NULL DEFAULT false,
  "showBeneficiaries" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" INTEGER,
  "updatedBy" INTEGER,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" INTEGER,

  CONSTRAINT "ChatFormConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatFormConfig_formId_key" ON "ChatFormConfig"("formId");

-- AddForeignKey
ALTER TABLE "ChatFormConfig" ADD CONSTRAINT "ChatFormConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add Chat関連テーブルとDonationRequestのリレーション
DO $$
BEGIN
    -- カラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'DonationRequest' AND column_name = 'chatId'
    ) THEN
        ALTER TABLE "DonationRequest" ADD COLUMN "chatId" TEXT;
    END IF;
    
    -- Chatテーブルが存在し、かつ制約が存在しない場合のみ追加
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Chat'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'DonationRequest_chatId_fkey'
    ) THEN
        ALTER TABLE "DonationRequest" ADD CONSTRAINT "DonationRequest_chatId_fkey" 
        FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

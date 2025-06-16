-- 既存データをクリア
TRUNCATE TABLE "Organization" CASCADE;
TRUNCATE TABLE "User" CASCADE;

-- 管理者ユーザー
INSERT INTO "User" (id, name, email, "passwordHash", "userType", "lineConnected", "createdAt", "updatedAt", "isDeleted")
VALUES (1, '管理者アカウント', 'admin@example.com', '$2b$10$pASrPLk346EoTQ0KbEaskeLOzSmi4TYKk9C.3WDyxoi61c0wSAu/K', 'ADMIN', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);

-- 監理団体1
INSERT INTO "Organization" (
  id, name, "minimumIndirectCost", "indirectCostRatio", "currentIndirectCost", 
  "orgPreferenceType", "acceptanceStatus", "indirectCostUsage", "highDonationThreshold", 
  "isManualHighDonation", "embedScript", code, "orgType", "corporateNumber", 
  "contactPersonName", "contactPersonEmail", "contactPhoneNumber", address, 
  "createdAt", "updatedAt", "createdBy", "isDeleted"
)
VALUES (
  1, 'テスト団体1', 1000000, 10, 200000, 
  'BALANCE', true, '人件費', 5000000, 
  true, 'https://example.com/embed', 'we-give_0001', '一般社団法人', '1234567890123', 
  '山田 太郎', 'taro@example.com', '03-1234-5678', '東京都テスト区1-1-1', 
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, false
);

-- 監理団体2
INSERT INTO "Organization" (
  id, name, "minimumIndirectCost", "indirectCostRatio", "currentIndirectCost", 
  "orgPreferenceType", "acceptanceStatus", "indirectCostUsage", "highDonationThreshold", 
  "isManualHighDonation", "embedScript", code, "orgType", "corporateNumber", 
  "contactPersonName", "contactPersonEmail", "contactPhoneNumber", address, 
  "createdAt", "updatedAt", "createdBy", "isDeleted"
)
VALUES (
  2, 'テスト団体2', 800000, 15, 150000, 
  'PROJECT', true, '運営費', 3000000, 
  true, 'https://example.com/embed2', 'we-give_0002', 'NPO法人', '9876543210123', 
  '佐藤 花子', 'hanako@example.com', '03-9876-5432', '東京都サンプル区2-2-2', 
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, false
);

-- 団体メンバー（団体1の管理者）
INSERT INTO "OrganizationMember" (
  id, "organizationId", "userId", role, "isActive",
  "createdAt", "updatedAt", "createdBy", "isDeleted"
)
VALUES (
  1, 1, 1, 'ADMIN', true,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, false
);

-- 団体2の管理者ユーザー
INSERT INTO "User" (id, name, email, "passwordHash", "userType", "lineConnected", "createdAt", "updatedAt", "isDeleted")
VALUES (2, '団体2管理者', 'org2admin@example.com', '$2b$10$pASrPLk346EoTQ0KbEaskeLOzSmi4TYKk9C.3WDyxoi61c0wSAu/K', 'ORG_MEMBER', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);

-- 団体メンバー（団体2の管理者）
INSERT INTO "OrganizationMember" (
  id, "organizationId", "userId", role, "isActive",
  "createdAt", "updatedAt", "createdBy", "isDeleted"
)
VALUES (
  2, 2, 2, 'ADMIN', true,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, false
);

-- 銀行口座（団体1）
INSERT INTO "BankAccount" (
  id, "organizationId", "bankName", "branchName", "branchCode", 
  "accountType", "accountNumber", "accountHolder", "useForIndirectCost", 
  "createdAt", "updatedAt", "createdBy", "isDeleted"
)
VALUES (
  1, 1, 'テスト銀行', '本店営業部', '001', 
  '普通', '0001111222', 'テストダンタイ', true, 
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, false
);

-- 銀行口座（団体2）
INSERT INTO "BankAccount" (
  id, "organizationId", "bankName", "branchName", "branchCode", 
  "accountType", "accountNumber", "accountHolder", "useForIndirectCost", 
  "createdAt", "updatedAt", "createdBy", "isDeleted"
)
VALUES (
  2, 2, 'サンプル銀行', '渋谷支店', '123', 
  '普通', '1234567890', 'エヌピーオーホウジンテストダンタイニ', true, 
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, false
);

-- 通知サンプル
INSERT INTO "Notification" (
  id, "organizationId", "receiverType", "receiverId", "notificationType",
  title, message, "isRead", "createdAt"
)
VALUES (
  1, 1, 'ORGANIZATION_MEMBER', 1, 'SYSTEM',
  'テストデータ登録完了', 'SQLスクリプトによるテストデータが登録されました。', false, CURRENT_TIMESTAMP
);

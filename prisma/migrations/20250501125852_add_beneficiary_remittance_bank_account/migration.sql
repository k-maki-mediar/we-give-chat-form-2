-- CreateTable
CREATE TABLE "BeneficiaryRemittanceBankAccount" (
    "id" SERIAL NOT NULL,
    "beneficiaryId" INTEGER NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT,
    "branchCode" TEXT,
    "accountType" TEXT,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,

    CONSTRAINT "BeneficiaryRemittanceBankAccount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BeneficiaryRemittanceBankAccount" ADD CONSTRAINT "BeneficiaryRemittanceBankAccount_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

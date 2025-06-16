-- AlterTable
ALTER TABLE "Donor" ADD COLUMN     "birthdate" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "zipcode" TEXT;

-- AddForeignKey
ALTER TABLE "Donor" ADD CONSTRAINT "Donor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

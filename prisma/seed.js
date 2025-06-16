/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1つの団体データ（最初から正しい設定で作成）
const ORG_DATA = {
  code: "admin_only_001",
  orgType: "その他法人",
  corporateNumber: "0000000000000",
  contactPersonName: "管理担当",
  contactPersonEmail: "sysadmin@example.com",
  contactPhoneNumber: "00-0000-0000",
  address: "管理用アドレス",
  name: "管理用団体",
  minimumIndirectCost: 10000,        // 1万円
  indirectCostRatio: 10.0,           // 10%（10.0として明示的に設定）
  indirectCostUsage: "運営費",
  highDonationThreshold: 1000000,
  isManualHighDonation: false,
  currentIndirectCost: 0,
  orgPreferenceType: "GENERAL",
  acceptanceStatus: true,            // 寄付受付ON
  isBeneficiaryFundingOpen: false,   // 直接寄付は計算で決まる
};

async function main() {
  console.log("Seeding for Admin Users and test data...");

  // 既存の組織をチェック
  let organization = await prisma.organization.findFirst({
    where: { code: "admin_only_001" },
  });

  if (!organization) {
    // 1) 団体を作成
    organization = await prisma.organization.create({
      data: ORG_DATA,
    });
    console.log("Created organization:", organization.name);
  } else {
    console.log("Organization already exists, skipping creation...");
  }

  // 2) 管理者ユーザー3名の情報
  const admins = [
    {
      name: "牧花純",
      email: "admin@example.com",
      passwordHash:
        "$2b$10$hLJxm6BME2KJE/VcxhY1zOqc7lomTTLoJbkfJMTf7O6kk6UJ0ORMO",
      userType: "ADMIN",
    },
    {
      name: "濱田顕光",
      email: "admin.mr@example.com",
      passwordHash:
        "$2b$10$/87oLR520Iz1v5eEu8SXD.oUj/XI6Qlxh.9PgGlsPu9qyektl2NVu",
      userType: "ADMIN",
    },
    {
      name: "渡邉文隆",
      email: "admin.we@example.com",
      passwordHash:
        "$2b$10$BkdikJAN8uVf3ry4teWvVOnLQjja3XTxJb8uOSiDEWvN6rrxV4ffO",
      userType: "ADMIN",
    },
  ];

  for (const adminData of admins) {
    // 既存のユーザーをチェック
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (!existingUser) {
      // 2-1) userテーブルへ作成
      const createdUser = await prisma.user.create({ data: adminData });

      // 2-2) organizationMemberテーブルへ作成 (role=ADMIN)
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: createdUser.id,
          role: "ADMIN",
          isActive: true,
        },
      });
      console.log(`Created admin user: ${adminData.name}`);
    } else {
      console.log(`User ${adminData.email} already exists, skipping...`);
    }
  }

  // 3) 寄付者用ユーザーを2名作成
  const userPasswordHash = "$2b$10$hLJxm6BME2KJE/VcxhY1zOqc7lomTTLoJbkfJMTf7O6kk6UJ0ORMO";
  const donorUsersData = [
    {
      name: "テスト寄付者1",
      email: "donor1@example.com",
      passwordHash: userPasswordHash,
      userType: "DONOR",
    },
    {
      name: "テスト寄付者2",
      email: "donor2@example.com",
      passwordHash: userPasswordHash,
      userType: "DONOR",
    },
  ];

  for (const ud of donorUsersData) {
    // 既存のユーザーをチェック
    const existingUser = await prisma.user.findUnique({
      where: { email: ud.email }
    });

    if (!existingUser) {
      // Userを作成
      const createdUser = await prisma.user.create({ data: ud });
      // Donorを作成（userIdに紐づけ）
      await prisma.donor.create({
        data: {
          userId: createdUser.id,
          name: ud.name,
          donorType: "INDIVIDUAL",
          email: ud.email,
        },
      });
      console.log(`Created donor user: ${ud.name}`);
    } else {
      console.log(`Donor user ${ud.email} already exists, skipping...`);
    }
  }

  // 4) 作成したDonorを取得
  const donors = await prisma.donor.findMany({
    where: { email: { in: ["donor1@example.com", "donor2@example.com"] } },
  });

  if (donors.length >= 2) {
    // 5) 受益主体を2つ作成: 人型 / プロジェクト型 (status=AVAILABLE)
    const beneficiaryData = [
      {
        organizationId: organization.id,
        beneficiaryType: "PERSON",
        name: "受益者A(個人)",
        status: "AVAILABLE",
      },
      {
        organizationId: organization.id,
        beneficiaryType: "PROJECT",
        name: "プロジェクトB",
        status: "AVAILABLE",
      },
    ];

    const createdBeneficiaries = [];
    for (const bd of beneficiaryData) {
      const existingBeneficiary = await prisma.beneficiary.findFirst({
        where: { name: bd.name, organizationId: bd.organizationId }
      });
      
      if (!existingBeneficiary) {
        const bene = await prisma.beneficiary.create({ data: bd });
        createdBeneficiaries.push(bene);
        console.log(`Created beneficiary: ${bd.name}`);
      } else {
        createdBeneficiaries.push(existingBeneficiary);
        console.log(`Beneficiary ${bd.name} already exists, skipping...`);
      }
    }

    // 6) PENDINGの寄付申込を2件作成
    const donationRequestsData = [
      {
        donorId: donors[0].id,
        organizationId: organization.id,
        donationDate: new Date(),
        totalAmount: 5000,
        paymentMethod: "BANK_TRANSFER",
        status: "PENDING",
        purposeType: "INDIRECT_COST",
      },
      {
        donorId: donors[1].id,
        organizationId: organization.id,
        donationDate: new Date(),
        totalAmount: 20000,
        paymentMethod: "CREDIT_CARD",
        status: "PENDING",
        purposeType: "PROJECT",
      },
    ];

    const createdRequests = [];
    for (const dr of donationRequestsData) {
      const existingRequest = await prisma.donationRequest.findFirst({
        where: { donorId: dr.donorId, totalAmount: dr.totalAmount }
      });
      
      if (!existingRequest) {
        const req = await prisma.donationRequest.create({ data: dr });
        createdRequests.push(req);
        console.log(`Created donation request: ${dr.totalAmount}円 from donor ${dr.donorId}`);
      } else {
        createdRequests.push(existingRequest);
        console.log(`Donation request already exists, skipping...`);
      }
    }

    // 7) DonationDetail を作成
    if (createdRequests.length >= 2 && createdBeneficiaries.length >= 2) {
      // 間接費寄付
      const existingIndirectDetail = await prisma.donationDetail.findFirst({
        where: { donationRequestId: createdRequests[0].id }
      });
      
      if (!existingIndirectDetail) {
        await prisma.donationDetail.create({
          data: {
            donationRequestId: createdRequests[0].id,
            usageType: "INDIRECT_COST",
            amount: 5000,
          },
        });
        console.log("Created indirect cost donation detail");
      }

      // 直接寄付
      const existingDirectDetail = await prisma.donationDetail.findFirst({
        where: { donationRequestId: createdRequests[1].id }
      });
      
      if (!existingDirectDetail) {
        await prisma.donationDetail.create({
          data: {
            donationRequestId: createdRequests[1].id,
            usageType: "PROJECT",
            beneficiaryId: createdBeneficiaries[1].id,
            amount: 20000,
          },
        });
        console.log("Created direct donation detail");
      }
    }
  }

  // 8) ChatFlowMaster のシード
  await seedChatFlowData(organization);

  console.log("Seeding completed!");
}

// ChatFlowMaster と ChatFormConfig のシード
async function seedChatFlowData(organization) {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // flow-v1.2.json を読み込み
    const flowFilePath = path.join(__dirname, '../data/flow-v1.2.json');
    const flowData = JSON.parse(fs.readFileSync(flowFilePath, 'utf8'));

    // ChatFlowMaster のアップサート
    const chatFlowMaster = await prisma.chatFlowMaster.upsert({
      where: { version: 'v1.2' },
      update: {
        flow: flowData.flow,
        isActive: true,
        description: 'Chat form flow version 1.2 - production',
        updatedAt: new Date()
      },
      create: {
        version: 'v1.2',
        flow: flowData.flow,
        isActive: true,
        description: 'Chat form flow version 1.2 - production'
      }
    });
    
    console.log("Created/updated ChatFlowMaster:", chatFlowMaster.version);

    // testform1 ChatFormConfig のアップサート
    const chatFormConfig = await prisma.chatFormConfig.upsert({
      where: { formId: 'testform1' },
      update: {
        flow: flowData.flow,
        title: 'ういきふ寄付フォーム',
        description: '寄付申し込み用チャットフォーム',
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        id: 'testform1',
        organizationId: organization.id,
        formId: 'testform1',
        title: 'ういきふ寄付フォーム',
        description: '寄付申し込み用チャットフォーム',
        flow: flowData.flow,
        isActive: true,
        allowAnonymous: true,
        requireEmail: false,
        showBeneficiaries: true
      }
    });
    
    console.log("Created/updated ChatFormConfig:", chatFormConfig.formId);
    
  } catch (error) {
    console.error("Error seeding chat flow data:", error);
    // フロー定義がなくても他のシードは継続
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


 
//  /* seed V2 */
// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// // 1つの団体データ
// const ORG_DATA = {
//   code: "admin_only_001",
//   orgType: "その他法人",
//   corporateNumber: "0000000000000",
//   contactPersonName: "管理担当",
//   contactPersonEmail: "sysadmin@example.com",
//   contactPhoneNumber: "00-0000-0000",
//   address: "管理用アドレス",
//   name: "管理用団体",
//   minimumIndirectCost: 0,
//   indirectCostRatio: 0,
//   indirectCostUsage: "なし",
//   highDonationThreshold: 1000000,
//   isManualHighDonation: false,
//   currentIndirectCost: 0,
//   orgPreferenceType: "GENERAL",
//   acceptanceStatus: true,
//   isBeneficiaryFundingOpen: false,
// };

// async function main() {
//   console.log("Seeding (minimal) for Admin Users...");

//   // 1) 団体を作成
//   const organization = await prisma.organization.create({
//     data: ORG_DATA,
//   });

//   // 2) 管理者ユーザー3名の情報
//   const admins = [
//     {
//       name: "牧花純",
//       email: "admin@example.com",
//       passwordHash:
//         "$2b$10$hLJxm6BME2KJE/VcxhY1zOqc7lomTTLoJbkfJMTf7O6kk6UJ0ORMO",
//       userType: "ADMIN",
//     },
//     {
//       name: "濱田顕光",
//       email: "admin.mr@example.com",
//       passwordHash:
//         "$2b$10$/87oLR520Iz1v5eEu8SXD.oUj/XI6Qlxh.9PgGlsPu9qyektl2NVu",
//       userType: "ADMIN",
//     },
//     {
//       name: "渡邉文隆",
//       email: "admin.we@example.com",
//       passwordHash:
//         "$2b$10$BkdikJAN8uVf3ry4teWvVOnLQjja3XTxJb8uOSiDEWvN6rrxV4ffO",
//       userType: "ADMIN",
//     },
//   ];

//   for (const adminData of admins) {
//     // 2-1) userテーブルへ作成
//     const createdUser = await prisma.user.create({ data: adminData });

//     // 2-2) organizationMemberテーブルへ作成 (role=ADMIN)
//     await prisma.organizationMember.create({
//       data: {
//         organizationId: organization.id,
//         userId: createdUser.id,
//         role: "ADMIN",
//         isActive: true,
//       },
//     });
//   }

//   console.log("Seeding completed for Admin users + single organization.");
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   }); 



// /* eslint-disable no-console */
// console.log("Seeding...");
// const { PrismaClient } = require("@prisma/client");
// const fs = require('fs');
// const prisma = new PrismaClient();

// const PASSWORD_HASH =
//   "$2b$10$ngSGiYEGF7e6r92vgAUO.ueCREXWLyToXeVL3DTcIW8M/5vyIRyGe";

// /* ---------- ユーティリティ --------------------------------------- */
// const names = [
//   "佐藤 健太", "鈴木 美咲", "高橋 陽菜", "田中 悠斗", "伊藤 佳奈",
//   "渡辺 智也", "山本 彩花", "中村 海斗", "小林 真央", "加藤 亮介",
//   "吉田 結衣", "山田 拓真", "佐々木 華", "山口 遼", "斎藤 茉莉",
// ];
// const nextName = () => names.shift() ?? `名無し${Date.now()}`;
// const randomInt = (min, max) =>
//   Math.floor(Math.random() * (max - min + 1)) + min;

// function randomBirthDate() {
//   const year = randomInt(1970, 2000);
//   const month = randomInt(1, 12);
//   const day = randomInt(1, 28);
//   return new Date(`${year}-${month}-${day}`);
// }
// function randomGender(i) {
//   return i % 2 === 0 ? "男" : "女";
// }
// function randomZip(i) {
//   return `${100 + i * 10}-${("0000" + i).slice(-4)}`;
// }

// /**
//  * 2024年6月1日から2025年5月31日の範囲でランダムな日付を生成
//  */
// function randomDonationDate() {
//   const start = new Date(2024, 5, 1); // 2024-06-01
//   const end = new Date(2025, 4, 31); // 2025-05-31
//   const diff = end.getTime() - start.getTime();
//   return new Date(start.getTime() + Math.random() * diff);
// }

// async function main() {
//   /* 1) 管理者ユーザー */
//   const adminUser = await prisma.user.create({
//     data: {
//       name: "管理者アカウント",
//       email: "admin@example.com",
//       passwordHash: PASSWORD_HASH,
//       userType: "ADMIN",
//       preferredLanguage: "ja",
//     },
//   });

//   /* 2) 組織 */
//   const organization = await prisma.organization.create({
//     data: {
//       code: "we-give_0001",
//       orgType: "一般社団法人",
//       corporateNumber: "1234567890123",
//       contactPersonName: "山田 太郎",
//       contactPersonEmail: "taro@example.com",
//       contactPhoneNumber: "03-1234-5678",
//       address: "東京都テスト区1-1-1",
//       name: "テスト団体",
//       minimumIndirectCost: 1_000_000,
//       indirectCostRatio: 10,
//       indirectCostUsage: "人件費",
//       highDonationThreshold: 5_000_000,
//       isManualHighDonation: true,
//       currentIndirectCost: 200_000,
//       orgPreferenceType: "BALANCE",
//       acceptanceStatus: true,
//       embedScript: "https://example.com/embed",
//       isBeneficiaryFundingOpen: true,
//       createdBy: adminUser.id,
//     },
//   });

//   /* 3) 団体メンバー（管理者＋5名） */
//   await prisma.organizationMember.create({
//     data: {
//       organizationId: organization.id,
//       userId: adminUser.id,
//       role: "ADMIN",
//       isActive: true,
//       createdBy: adminUser.id,
//     },
//   });
//   for (let i = 0; i < 5; i++) {
//     const u = await prisma.user.create({
//       data: {
//         name: nextName(),
//         email: `member${i + 1}@example.com`,
//         passwordHash: PASSWORD_HASH,
//         userType: "ORG_MEMBER",
//         preferredLanguage: "ja",
//       },
//     });
//     await prisma.organizationMember.create({
//       data: {
//         organizationId: organization.id,
//         userId: u.id,
//         role: "MEMBER",
//         isActive: true,
//         createdBy: adminUser.id,
//       },
//     });
//   }

//   /* 4) Donor（5名: ユーザーを持つドナー） */
//   const donors = [];
//   for (let i = 0; i < 5; i++) {
//     const name = nextName();
//     const du = await prisma.user.create({
//       data: {
//         name,
//         email: `donor${i + 1}@example.com`,
//         passwordHash: PASSWORD_HASH,
//         userType: "DONOR",
//         lineUserId: `lineUser${i + 1}`,
//         lineConnected: true,
//         preferredLanguage: "ja",
//       },
//     });
//     const birthdate = randomBirthDate();
//     const gender = randomGender(i);
//     const zipcode = randomZip(i);

//     const donor = await prisma.donor.create({
//       data: {
//         user: { connect: { id: du.id } },
//         name,
//         donorType: i % 2 === 0 ? "CORPORATE" : "INDIVIDUAL",
//         phone: `0800000${123 + i}`,
//         address: `東京都サンプル区1-1-${i + 1}`,
//         email: `donor${i + 1}@example.com`,
//         birthdate,
//         gender,
//         zipcode,
//         createdBy: du.id,
//       },
//     });
//     donors.push(donor);
//   }

//   /* -- (4-2) ゲストドナーを1名作成: userId=null で emailを指定 -- */
//   const guestDonor = await prisma.donor.create({
//     data: {
//       userId: null,
//       name: "ゲスト寄付者",
//       email: "guest@example.com",
//       donorType: "INDIVIDUAL",
//       phone: "090-1111-2222",
//       address: "東京都ゲスト区1-2-3",
//       createdBy: adminUser.id,
//     },
//   });

//   /* 5) Beneficiary（5件：PERSON/PROJECT 交互） */
//   const beneficiaries = [];
//   for (let i = 0; i < 5; i++) {
//     const isPerson = i % 2 === 0;
//     const baseName = isPerson ? nextName() : `プロジェクト${i + 1}`;
//     const b = await prisma.beneficiary.create({
//       data: {
//         organizationId: organization.id,
//         beneficiaryType: isPerson ? "PERSON" : "PROJECT",
//         name: baseName,
//         status: "REGISTRATION",
//         priority: (i + 1) * 10,
//         isInStock: !isPerson,
//         createdBy: adminUser.id,
//       },
//     });
//     beneficiaries.push(b);
//   }

//   /* 6) 銀行口座（団体2口座 + Beneficiary用3口座） */
//   await prisma.$transaction([
//     prisma.bankAccount.create({
//       data: {
//         organizationId: organization.id,
//         bankName: "テスト銀行",
//         branchName: "本店営業部",
//         branchCode: "001",
//         accountType: "普通",
//         accountNumber: "0001111222",
//         accountHolder: "テストダンタイ",
//         useForIndirectCost: true,
//         createdBy: adminUser.id,
//       },
//     }),
//     prisma.bankAccount.create({
//       data: {
//         organizationId: organization.id,
//         bankName: "みらい銀行",
//         branchName: "新宿支店",
//         branchCode: "202",
//         accountType: "普通",
//         accountNumber: "9876543210",
//         accountHolder: "イッパンシャダンホウジンテストダンタイ",
//         useForIndirectCost: false,
//         createdBy: adminUser.id,
//       },
//     }),
//     ...beneficiaries.slice(0, 3).map((b, idx) =>
//       prisma.bankAccount.create({
//         data: {
//           organizationId: organization.id,
//           bankName: `グリーン銀行${idx + 1}`,
//           branchName: "渋谷支店",
//           branchCode: `3${idx}3`,
//           accountType: "当座",
//           accountNumber: `12345098${idx}6`,
//           accountHolder: b.name,
//           useForIndirectCost: false,
//           createdBy: adminUser.id,
//           bankAccountBeneficiaries: {
//             create: [
//               { beneficiaryId: b.id, createdBy: adminUser.id },
//             ],
//           },
//         },
//       })
//     ),
//   ]);

//   /* 7) DonationRequest 10件（半分高額） - ユーザーを持つドナー */
//   const threshold = organization.highDonationThreshold.toNumber();
//   const donationRequests = [];
//   for (let i = 0; i < 10; i++) {
//     const over = i >= 5;
//     const amount = Math.round(
//       threshold * (over ? randomInt(120, 300) / 100 : randomInt(10, 80) / 100),
//     );

//     const donor = donors[i % donors.length];
//     const donationDate = randomDonationDate();
//     const req = await prisma.donationRequest.create({
//       data: {
//         donorId: donor.id,
//         organizationId: organization.id,
//         donationDate,
//         totalAmount: amount,
//         paymentMethod: i % 2 ? "CREDIT_CARD" : "BANK_TRANSFER",
//         status: "PENDING",
//         isHighDonation: amount > threshold,
//         purposeType: i % 2 ? "PROJECT" : "GENERAL",
//         membershipType: "GUEST",
//         createdBy: donor.userId,
//       },
//     });
//     donationRequests.push(req);

//     await prisma.donationDetail.createMany({
//       data: [
//         {
//           donationRequestId: req.id,
//           usageType: "PROJECT",
//           beneficiaryId: beneficiaries[i % beneficiaries.length].id,
//           amount: Math.round(amount * 0.8),
//           createdBy: donor.userId,
//         },
//         {
//           donationRequestId: req.id,
//           usageType: "INDIRECT_COST",
//           amount: Math.round(amount * 0.2),
//           createdBy: donor.userId,
//         },
//       ],
//     });
//   }

//   /* 8) ゲストドナーによるDonationRequestを1件だけ追加 */
//   const guestDonationAmount = 100000;
//   const guestDonationDate = randomDonationDate();
//   const guestRequest = await prisma.donationRequest.create({
//     data: {
//       donorId: guestDonor.id,
//       organizationId: organization.id,
//       donationDate: guestDonationDate,
//       totalAmount: guestDonationAmount,
//       paymentMethod: "BANK_TRANSFER",
//       status: "PENDING",
//       isHighDonation: false,
//       purposeType: "GENERAL",
//       membershipType: "GUEST",
//       createdBy: adminUser.id,
//     },
//   });
//   await prisma.donationDetail.create({
//     data: {
//       donationRequestId: guestRequest.id,
//       usageType: "GENERAL",
//       amount: guestDonationAmount,
//       createdBy: adminUser.id,
//     },
//   });

//   /* 9) DonationRequestのステータス更新 + transfer */
//   for (let i = 0; i < donationRequests.length; i++) {
//     const dr = donationRequests[i];
//     const transferDate = dr.donationDate;
//     if (i < 2) {
//       continue;
//     } else if (i < 4) {
//       await prisma.donationRequest.update({ where: { id: dr.id }, data: { status: "PAID" } });
//       await prisma.transfer.create({ data: { transferType: "INCOMING", donationRequestId: dr.id, transferDate, amount: dr.totalAmount, status: "PAID", entryMethod: "MANUAL" } });
//     } else if (i < 6) {
//       await prisma.donationRequest.update({ where: { id: dr.id }, data: { status: "ALLOCATED" } });
//       await prisma.transfer.create({ data: { transferType: "INCOMING", donationRequestId: dr.id, transferDate, amount: dr.totalAmount, status: "PAID", entryMethod: "MANUAL" } });
//       await prisma.transfer.create({ data: { transferType: "OUTGOING", donationRequestId: dr.id, transferDate, amount: dr.totalAmount, status: "ALLOCATED", entryMethod: "MANUAL" } });
//     } else if (i < 8) {
//       await prisma.donationRequest.update({ where: { id: dr.id }, data: { status: "TRANSFERRED" } });
//       await prisma.transfer.create({ data: { transferType: "INCOMING", donationRequestId: dr.id, transferDate, amount: dr.totalAmount, status: "PAID", entryMethod: "MANUAL" } });
//       await prisma.transfer.create({ data: { transferType: "OUTGOING", donationRequestId: dr.id, transferDate, amount: dr.totalAmount, status: "TRANSFERRED", entryMethod: "MANUAL" } });
//     } else {
//       await prisma.donationRequest.update({ where: { id: dr.id }, data: { status: "CANCELED" } });
//       await prisma.transfer.create({ data: { transferType: "INCOMING", donationRequestId: dr.id, transferDate, amount: dr.totalAmount, status: "FAILED_INCOME", entryMethod: "MANUAL" } });
//     }
//   }

//   /* 10) 通知 */
//   await prisma.notification.create({
//     data: {
//       organizationId: organization.id,
//       receiverType: "ORGANIZATION_MEMBER",
//       receiverId: adminUser.id,
//       notificationType: "SYSTEM",
//       title: "シード完了",
//       message: "DB にサンプルデータ(ゲストドナー含む)を登録しました。",
//     },
//   });

//   /* 新しい監理団体 */
//   const organization2 = await prisma.organization.create({
//     data: {
//       code: "we-give_0002",
//       orgType: "NPO法人",
//       corporateNumber: "9876543210123",
//       contactPersonName: "佐藤 花子",
//       contactPersonEmail: "hanako@example.com",
//       contactPhoneNumber: "03-9876-5432",
//       address: "東京都サンプル区2-2-2",
//       name: "テスト団体2",
//       minimumIndirectCost: 800_000,
//       indirectCostRatio: 15,
//       indirectCostUsage: "運営費",
//       highDonationThreshold: 3_000_000,
//       isManualHighDonation: true,
//       currentIndirectCost: 150_000,
//       orgPreferenceType: "PROJECT",
//       acceptanceStatus: true,
//       embedScript: "https://example.com/embed2",
//       createdBy: adminUser.id,
//     },
//   });

//   // 団体メンバー追加
//   const org2User = await prisma.user.create({
//     data: {
//       name: nextName(),
//       email: "org2admin@example.com",
//       passwordHash: PASSWORD_HASH,
//       userType: "ORG_MEMBER",
//       preferredLanguage: "ja",
//     },
//   });

//   await prisma.organizationMember.create({
//     data: {
//       organizationId: organization2.id,
//       userId: org2User.id,
//       role: "ADMIN",
//       isActive: true,
//       createdBy: adminUser.id,
//     },
//   });

//   // 銀行口座追加
//   await prisma.bankAccount.create({
//     data: {
//       organizationId: organization2.id,
//       bankName: "サンプル銀行",
//       branchName: "渋谷支店",
//       branchCode: "123",
//       accountType: "普通",
//       accountNumber: "1234567890",
//       accountHolder: "エヌピーオーホウジンテストダンタイニ",
//       useForIndirectCost: true,
//       createdBy: adminUser.id,
//     },
//   });

//   /* 10) チャットフォーム設定 */
//   // 最新バージョン（1.1）のフローデータ
//   const flowData = {
//     version: "1.1",
//     flow: {
//       initialStep: "service_usage_check",
//       steps: {
//         service_usage_check: {
//           id: "1",
//           message: "ういきふチャットフォームを利用して、寄付を行ったことがありますか？",
//           type: "button_select",
//           options: [
//             {label: "はい", value: "yes", nextStep: "auth_check"},
//             {label: "いいえ", value: "no", nextStep: "donation_purpose"}
//           ]
//         },
//         auth_check: {
//           id: "2",
//           type: "system",
//           action: "checkAuthStatus",
//           conditions: [
//             {
//               condition: "isLoggedIn == true",
//               nextStep: "welcome_back"
//             },
//             {
//               condition: "isLoggedIn == false",
//               nextStep: "suggest_login_option"
//             }
//           ]
//         },
//         suggest_login_option: {
//           id: "1.1.0",
//           message: "ういきふに会員登録されていますか？会員登録済みの場合、ログインしていただくことでスムーズに寄付をお申し込みいただけます",
//           type: "button_select",
//           options: [
//             {
//               label: "ログインする",
//               value: "login",
//               action: "showLoginForm"
//             },
//             {
//               label: "ログインせずに続ける",
//               value: "continue",
//               nextStep: "donation_purpose"
//             }
//           ]
//         },
//         welcome_back: {
//           id: "3",
//           message: "お帰りなさい！前回の続きから寄付を行いましょう。",
//           type: "message",
//           nextStep: "donation_purpose"
//         },
//         donation_purpose: {
//           id: "4",
//           message: "どのような目的で寄付をご検討されていますか？",
//           type: "button_select",
//           options: [
//             {label: "一般寄付", value: "general", nextStep: "donation_amount"},
//             {label: "プロジェクト支援", value: "project", nextStep: "select_project"}
//           ]
//         },
//         select_project: {
//           id: "5",
//           message: "支援したいプロジェクトを選択してください",
//           type: "project_select",
//           action: "loadProjects",
//           nextStep: "donation_amount"
//         },
//         donation_amount: {
//           id: "6",
//           message: "寄付金額を入力してください",
//           type: "number_input",
//           placeholder: "例: 10000",
//           validation: "required|min:1000",
//           nextStep: "confirm_donation"
//         },
//         confirm_donation: {
//           id: "7",
//           message: "以下の内容で寄付を確定してよろしいですか？",
//           type: "confirmation",
//           action: "showDonationSummary",
//           options: [
//             {label: "寄付を確定する", value: "confirm", nextStep: "payment_method"},
//             {label: "修正する", value: "edit", nextStep: "donation_purpose"}
//           ]
//         },
//         payment_method: {
//           id: "8",
//           message: "お支払い方法を選択してください",
//           type: "button_select",
//           options: [
//             {label: "クレジットカード", value: "credit_card", nextStep: "process_payment"},
//             {label: "銀行振込", value: "bank_transfer", nextStep: "show_bank_info"}
//           ]
//         },
//         process_payment: {
//           id: "9",
//           type: "system",
//           action: "processPayment",
//           nextStep: "thank_you"
//         },
//         show_bank_info: {
//           id: "10",
//           message: "以下の銀行口座にお振込みください",
//           type: "message",
//           action: "showBankInfo",
//           nextStep: "thank_you"
//         },
//         thank_you: {
//           id: "11",
//           message: "ご寄付いただき、誠にありがとうございます！",
//           type: "message",
//           action: "sendThankYouEmail"
//         }
//       }
//     },
//     metadata: {
//       updatedBy: "system",
//       lastUpdated: new Date().toISOString(),
//       migrationStatus: "seed-data"
//     }
//   };

//   // 団体1用のチャットフォーム設定
//   await prisma.chatFormConfig.create({
//     data: {
//       id: 'cf-1',
//       organizationId: organization.id,
//       formId: 'testform1',
//       title: 'テスト団体の寄付フォーム',
//       description: 'テスト団体への寄付を受け付けるフォームです',
//       primaryColor: '#3b82f6',
//       logoUrl: 'https://example.com/logo1.png',
//       flow: flowData,
//       allowAnonymous: true,
//       requireEmail: false,
//       showBeneficiaries: true,
//       createdBy: adminUser.id,
//     },
//   });

//   // 団体2用のチャットフォーム設定
//   await prisma.chatFormConfig.create({
//     data: {
//       id: 'cf-2',
//       organizationId: organization2.id,
//       formId: 'testform2',
//       title: 'テスト団体2の寄付フォーム',
//       description: 'テスト団体2への寄付を受け付けるフォームです',
//       primaryColor: '#10b981',
//       logoUrl: 'https://example.com/logo2.png',
//       flow: flowData,
//       allowAnonymous: true,
//       requireEmail: false,
//       showBeneficiaries: true,
//       createdBy: adminUser.id,
//     },
//   });

//   console.log("🌱  Seeding finished with varied donation dates.");
// }

// main()
//   .catch((e) => { console.error(e); process.exit(1); })
//   .finally(() => prisma.$disconnect());


import { PromoUsageService } from '../../modules/loging/services/promoUsage.service';
import nodemailer from 'nodemailer';

// ────────── MOCK NODMAILER ──────────
const sendMailMock = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: sendMailMock })),
}));

// ────────── MOCK PRISMA ──────────
jest.mock('../../core/db/client', () => {
  const mockPrisma = {
    promoUsage: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
    promo: {
      findUnique: jest.fn(),
    },
    admin: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { prisma: mockPrisma };
});

// Import prisma setelah jest.mock
import { prisma } from '../../core/db/client';

describe('PromoUsageService', () => {
  let service: PromoUsageService;

  beforeEach(() => {
    service = new PromoUsageService();
    jest.clearAllMocks();
  });

  it('should list promo usages with pagination', async () => {
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      [{ id: '1', usedAt: new Date(), client: { id: 'c1', email: 'a@b.com' } }],
      1,
    ]);

    const result = await service.listByPromo('promo1', { skip: 0, take: 10 });
    expect(result.items.length).toBe(1);
    expect(result.total).toBe(1);
  });

  it('should return summary', async () => {
    (prisma.promo.findUnique as jest.Mock).mockResolvedValue({ globalLimit: 100, usedCount: 10 });
    (prisma.promoUsage.groupBy as jest.Mock).mockResolvedValue([{ clientId: 'c1', _count: { clientId: 1 } }]);

    const summary = await service.summary('promo1');
    expect(summary.usedCount).toBe(10);
    expect(summary.globalLimit).toBe(100);
    expect(summary.remaining).toBe(90);
    expect(summary.uniqueUsers).toBe(1);
  });

  it('should generate CSV log', async () => {
    const csv = await service.generateCsvLog([
      { id: '1', usedAt: new Date('2025-12-16T00:00:00Z'), client: { id: 'c1', email: 'a@b.com' } },
    ]);

    // Sesuaikan dengan output Json2CsvParser (dengan tanda kutip)
    expect(csv).toContain('"id","usedAt","clientId","clientEmail"');
    expect(csv).toContain('"1","2025-12-16T00:00:00.000Z","c1","a@b.com"');
  });

  it('should auto delete old usages and send email to admins', async () => {
    const oldDate = new Date();
    oldDate.setMonth(oldDate.getMonth() - 2);

    (prisma.promoUsage.findMany as jest.Mock).mockResolvedValue([
      { id: '1', promoId: 'promo1', usedAt: oldDate, client: { id: 'c1', email: 'a@b.com' } },
    ]);

    (prisma.admin.findMany as jest.Mock).mockResolvedValue([{ email: 'admin@biz.com' }]);
    (prisma.promoUsage.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await service.autoDeleteOldUsages();

    expect(prisma.promoUsage.findMany).toHaveBeenCalled();
    expect(prisma.promoUsage.deleteMany).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalled();
  });
});

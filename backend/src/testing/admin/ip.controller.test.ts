/* ======================================
   IP CONTROLLER – FULL UNIT TEST (FINAL)
   ====================================== */

import { mockReq, mockRes } from '../helpers/mockExpress';
import { IPStatus, IPType } from '@prisma/client';

describe('IPController - Unit Test', () => {
  let controller: any;
  let serviceMock: any;

  const mockIP = {
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ip: '192.168.1.1',
    gateway: '192.168.1.254',
    netmask: 24,
    dns: '8.8.8.8',
    type: IPType.PUBLIC,
    status: IPStatus.AVAILABLE,
    note: 'Test IP',
    regionId: 'region-1',
  };

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    serviceMock = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      createFromCidr: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    jest.doMock('../../modules/sysadmin/services/ip.service', () => ({
      IPService: jest.fn(() => serviceMock),
    }));

    const { IPController } = await import(
      '../../modules/sysadmin/controllers/ip.controller'
    );

    controller = new IPController();
  });

  // ───────────── GET ALL ─────────────
  it('getAll → success', async () => {
    serviceMock.getAll.mockResolvedValue([mockIP]);

    const req = mockReq({ query: {} }); // 🔥 FIX
    const res = mockRes();

    await controller.getAll(req, res);

    expect(serviceMock.getAll).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [mockIP],
    });
  });

  it('getAll → with regionId', async () => {
    serviceMock.getAll.mockResolvedValue([mockIP]);

    const req = mockReq({ query: { regionId: 'region-1' } });
    const res = mockRes();

    await controller.getAll(req, res);

    expect(serviceMock.getAll).toHaveBeenCalledWith('region-1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [mockIP],
    });
  });

  // ───────────── GET ONE ─────────────
  it('getOne → found', async () => {
    serviceMock.getById.mockResolvedValue(mockIP);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await controller.getOne(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockIP,
    });
  });

  it('getOne → not found', async () => {
    serviceMock.getById.mockResolvedValue(null);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await controller.getOne(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not found',
    });
  });

  // ───────────── CREATE ─────────────
  it('create → success', async () => {
    serviceMock.create.mockResolvedValue(mockIP);

    const req = mockReq({
      body: {
        ip: '192.168.1.1',
        type: IPType.PUBLIC,
        regionId: 'region-1',
      },
    });
    const res = mockRes();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockIP,
    });
  });

  // ───────────── DELETE ─────────────
  it('delete → success', async () => {
    serviceMock.delete.mockResolvedValue(mockIP);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await controller.delete(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'IP deleted',
    });
  });
});

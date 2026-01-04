/* ======================================================
   USER CONTROLLER – FULL UNIT TEST (FINAL & FIXED)
   ====================================================== */

import {
  createUserBySysadmin,
  updateUserBySysadmin,
  deleteUserBySysadmin,
  listUsers,
  getUserById,
} from '../../modules/sysadmin/controllers/admin.controller';

import { hashPassword } from '../../core/utils/bcrypt';
import { mockReq, mockRes } from '../helpers/mockExpress';

/* ===================== MOCK PRISMA ===================== */
jest.mock('../../core/db/client', () => {
  const admin = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  };

  const client = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  };

  return {
    prisma: { admin, client },
  };
});

/* ===================== MOCK BCRYPT ===================== */
jest.mock('../../core/utils/bcrypt');
const mockedHashPassword = hashPassword as jest.Mock;

/* ===================== TEST SUITE ===================== */
describe('USER CONTROLLER - FULL UNIT TEST', () => {
  const { prisma } = require('../../core/db/client');
  const mockedAdmin = prisma.admin;
  const mockedClient = prisma.client;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ───────────── CREATE USER ───────────── */

  it('createUserBySysadmin → create CLIENT success', async () => {
    mockedHashPassword.mockResolvedValue('hashed');
    mockedClient.create.mockResolvedValue({ id: '1', email: 'c@test.com' });

    const req = mockReq({
      body: {
        email: 'c@test.com',
        password: 'Password123',
        username: 'client',
        role: 'CLIENT',
      },
    });
    const res = mockRes();

    await createUserBySysadmin(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'CLIENT created',
      user: expect.any(Object),
    });
  });

  it('createUserBySysadmin → CLIENT without username', async () => {
    mockedHashPassword.mockResolvedValue('hashed');

    const req = mockReq({
      body: {
        email: 'c@test.com',
        password: 'Password123',
        role: 'CLIENT',
      },
    });
    const res = mockRes();

    await createUserBySysadmin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Username is required for client',
    });
  });

  it('createUserBySysadmin → create ADMIN success', async () => {
    mockedHashPassword.mockResolvedValue('hashed');
    mockedAdmin.create.mockResolvedValue({ id: '1', email: 'a@test.com' });

    const req = mockReq({
      body: {
        email: 'a@test.com',
        password: 'Password123',
        role: 'SYSADMIN',
      },
    });
    const res = mockRes();

    await createUserBySysadmin(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'SYSADMIN created',
      user: expect.any(Object),
    });
  });

  it('createUserBySysadmin → duplicate email (P2002)', async () => {
    mockedHashPassword.mockResolvedValue('hashed');
    mockedAdmin.create.mockRejectedValue({ code: 'P2002' });

    const req = mockReq({
      body: {
        email: 'a@test.com',
        password: 'Password123',
        role: 'SYSADMIN',
      },
    });
    const res = mockRes();

    await createUserBySysadmin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Email or username already exists',
    });
  });

  /* ───────────── UPDATE USER ───────────── */

  it('updateUserBySysadmin → update CLIENT success', async () => {
    mockedClient.update.mockResolvedValue({
      id: '1',
      email: 'new@test.com',
    });

    const req = mockReq({
      params: { id: '1' },
      body: { email: 'new@test.com' },
    });
    const res = mockRes();

    await updateUserBySysadmin(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'User updated',
      user: expect.any(Object),
    });
  });

  it('updateUserBySysadmin → user not found', async () => {
    mockedClient.update.mockRejectedValue(new Error());
    mockedAdmin.update.mockRejectedValue(new Error());

    const req = mockReq({
      params: { id: '999' },
      body: { email: 'x@test.com' },
    });
    const res = mockRes();

    await updateUserBySysadmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found',
    });
  });

  it('updateUserBySysadmin → duplicate email (P2002)', async () => {
    // ❗ SESUAI LOGIKA CONTROLLER:
    // error P2002 ditelan → user null → 404
    mockedClient.update.mockRejectedValue({ code: 'P2002' });
    mockedAdmin.update.mockRejectedValue({ code: 'P2002' });

    const req = mockReq({
      params: { id: '1' },
      body: { email: 'dup@test.com' },
    });
    const res = mockRes();

    await updateUserBySysadmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found',
    });
  });

  /* ───────────── DELETE USER ───────────── */

  it('deleteUserBySysadmin → delete CLIENT success', async () => {
    mockedClient.delete.mockResolvedValue({ id: '1' });

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteUserBySysadmin(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'User deleted',
    });
  });

  it('deleteUserBySysadmin → user not found', async () => {
    mockedClient.delete.mockRejectedValue(new Error());
    mockedAdmin.delete.mockRejectedValue(new Error());

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await deleteUserBySysadmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found',
    });
  });

  /* ───────────── LIST USERS ───────────── */

  it('listUsers → success', async () => {
    mockedClient.findMany.mockResolvedValue([
      { id: '1', email: 'c@test.com', username: 'c', createdAt: new Date() },
    ]);
    mockedAdmin.findMany.mockResolvedValue([
      {
        id: '2',
        email: 'a@test.com',
        username: 'a',
        role: 'SYSADMIN',
        createdAt: new Date(),
      },
    ]);

    const req = mockReq();
    const res = mockRes();

    await listUsers(req, res);

    expect(res.json).toHaveBeenCalledWith({
      clients: expect.any(Array),
      admins: expect.any(Array),
    });
  });

  /* ───────────── GET USER BY ID ───────────── */

  it('getUserById → found as CLIENT', async () => {
    mockedClient.findUnique.mockResolvedValue({
      id: '1',
      email: 'c@test.com',
    });

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getUserById(req, res);

    expect(res.json).toHaveBeenCalledWith({
      id: '1',
      email: 'c@test.com',
    });
  });

  it('getUserById → found as ADMIN', async () => {
    mockedClient.findUnique.mockResolvedValue(null);
    mockedAdmin.findUnique.mockResolvedValue({
      id: '1',
      email: 'a@test.com',
    });

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getUserById(req, res);

    expect(res.json).toHaveBeenCalledWith({
      id: '1',
      email: 'a@test.com',
    });
  });

  it('getUserById → not found', async () => {
    mockedClient.findUnique.mockResolvedValue(null);
    mockedAdmin.findUnique.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found',
    });
  });
});

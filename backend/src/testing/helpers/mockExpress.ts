export const mockReq = (data: any = {}) =>
  ({
    body: {},
    cookies: {},
    user: undefined,
    ...data,
  } as any);

export const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

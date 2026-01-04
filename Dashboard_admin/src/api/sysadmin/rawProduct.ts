import apiClient from "@/utils/apiClient";

// ===============================
// CREATE
// ===============================
export const createRawProduct = (data: {
  name: string;
  cpu: number;
  ram: number;
  disk: number;
  bandwidth: number;
  templateCategoryIds: string[]; // Wajib array kategori
  backupPolicyId?: string | null;
}) => apiClient.post("/api/rawProduct", data);

// ===============================
// LIST
// ===============================
export const listRawProducts = () =>
  apiClient.get("/api/rawProduct");

// ===============================
// GET SINGLE
// ===============================
export const getRawProductById = (id: string) =>
  apiClient.get(`/api/rawProduct/${id}`);

// ===============================
// UPDATE
// ===============================
export const updateRawProduct = (
  id: string,
  data: Partial<{
    name: string;
    cpu: number;
    ram: number;
    disk: number;
    bandwidth: number;
    templateCategoryIds: string[]; // tetap array
    backupPolicyId?: string | null;
  }>
) => apiClient.put(`/api/rawProduct/${id}`, data);

// ===============================
// DELETE
// ===============================
export const deleteRawProduct = (id: string) =>
  apiClient.delete(`/api/rawProduct/${id}`);

// import axios from "axios";
// import type { AxiosRequestConfig } from "axios"; // ✅ type-only import
// import https from "https";

// export class BackupStorageSyncService {
//   async validateProxmoxStorage(
//     node: string,
//     hypervisorHost: string,
//     hypervisorToken: string
//   ): Promise<{ success: boolean; data?: any; message?: string }> {
//     try {
//       const url = `https://${hypervisorHost}:8006/api2/json/nodes/${node}/storage`;

//       const config: AxiosRequestConfig = {
//         headers: { Authorization: `PVEAPIToken=${hypervisorToken}` },
//         httpsAgent: new https.Agent({ rejectUnauthorized: false }), // gunakan https agent
//       };

//       // Tipe response ditentukan
//       const res = await axios.get<{ data: any[] }>(url, config);

//       return { success: true, data: res.data.data };
//     } catch (err: any) {
//       console.error(
//         "Proxmox storage validation error:",
//         err.response?.data || err.message
//       );
//       return {
//         success: false,
//         message: err.response?.data?.errors?.[0] || err.message,
//       };
//     }
//   }
// }

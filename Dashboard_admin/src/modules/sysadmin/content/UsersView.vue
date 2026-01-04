<template>
  <div class="page-wrapper">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="title">Manage Users</h1>
        <p class="subtitle">Create, edit, and manage admin accounts</p>
      </div>

      <!-- Toolbar -->
      <div class="header-right">
        <div class="search-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="5.5"/>
            <path d="m11 11 2 2"/>
          </svg>
          <input
            type="text"
            class="search-input"
            v-model="searchQuery"
            placeholder="Search username or email"
          />
        </div>

        <select class="filter-select" v-model="filterRole">
          <option value="">All Roles</option>
          <option value="SYSADMIN">Sysadmin</option>
          <option value="BUSINESS">Business</option>
          <option value="FINANCE">Finance</option>
        </select>

        <button class="add-btn" @click="openModal()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 4v8M4 8h8"/>
          </svg>
          <span class="add-text">Add</span>
        </button>
      </div>
    </div>

    <!-- Loading & Error -->
    <div v-if="loading" class="loading-message">Loading users...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <!-- Table or Empty State -->
    <div v-if="!loading && !errorMessage" class="card">
      <div class="table-wrap">
        <table class="modern-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="filteredUsers.length > 0">
              <tr v-for="(user, index) in paginatedUsers" :key="user.id">
                <td class="muted">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td class="name-cell">{{ user.username || '—' }}</td>
                <td>{{ user.email || '—' }}</td>
                <td>
                  <span class="chip" :class="getRoleClass(user.role)">
                    {{ user.role }}
                  </span>
                </td>
                <td class="muted">{{ formatDate(user.createdAt) }}</td>
                <td class="actions-cell">
                  <button class="action-btn" @click="openModal(user)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M12.5 2.5a1 1 0 0 1 3 3L6.5 14.5l-4 1 1-4L12.5 2.5z"/>
                    </svg>
                  </button>
                  <button class="action-btn danger" @click="openDeleteModal(user)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 5h8M10 5v9H6V5M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="6" class="empty-row">
                <div class="empty-content">
                  <div>No users found</div>
                  <small>Try changing search or filters</small>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-wrap" v-if="!loading && !errorMessage && filteredUsers.length > pageSize">
      <button
        class="pagination-btn"
        :class="{ disabled: currentPage === 1 }"
        @click="currentPage = Math.max(1, currentPage - 1)"
      >
        Prev
      </button>
      <button
        v-for="p in totalPages"
        :key="p"
        class="pagination-btn"
        :class="{ active: currentPage === p }"
        @click="currentPage = p"
      >
        {{ p }}
      </button>
      <button
        class="pagination-btn"
        :class="{ disabled: currentPage === totalPages }"
        @click="currentPage = Math.min(totalPages, currentPage + 1)"
      >
        Next
      </button>
    </div>

    <!-- Add/Edit Modal -->
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <header class="modal-header">
            <h3>{{ editUserData ? 'Edit User' : 'Add User' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </header>
          <form class="modal-body" @submit.prevent="submitForm">
            <div class="form-grid">
              <div class="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="form.username" 
                  @input="clearError('username')"
                />
                <small v-if="errors.username" class="error-text">{{ errors.username }}</small>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  class="form-input" 
                  v-model="form.email" 
                  @input="clearError('email')"
                />
                <small v-if="errors.email" class="error-text">{{ errors.email }}</small>
              </div>
              <div class="form-group">
                <label>
                  Password 
                  <small v-if="editUserData">(Leave empty to keep current password)</small>
                </label>
                <input 
                  type="password" 
                  class="form-input" 
                  v-model="form.password" 
                  @input="clearError('password')"
                />
                <small v-if="errors.password" class="error-text">{{ errors.password }}</small>
                <small 
                  v-if="!editUserData" 
                  class="password-hint"
                >
                  Min. 8 chars, uppercase, lowercase, number
                </small>
              </div>
              <div class="form-group">
                <label>Role</label>
                <select 
                  class="form-input" 
                  v-model="form.role"
                  @change="clearError('role')"
                >
                  <option value="SYSADMIN">Sysadmin</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FINANCE">Finance</option>
                </select>
                <small v-if="errors.role" class="error-text">{{ errors.role }}</small>
              </div>
            </div>
            <footer class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary">{{ editUserData ? 'Update' : 'Create' }}</button>
            </footer>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Delete Modal -->
    <teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-card modal-small">
          <header class="modal-header">
            <h3>Confirm Delete</h3>
            <button class="modal-close" @click="closeDeleteModal">×</button>
          </header>
          <div class="modal-body">
            <p class="confirm-text">
              To confirm deletion of <strong>{{ deleteUserData?.username }}</strong>, 
              please type the exact word below:
            </p>
            <div class="delete-instruction">delete</div>
            <input
              type="text"
              v-model="deleteConfirmation"
              class="form-input delete-input"
              placeholder="Type 'delete'"
              @input="validateDeleteInput"
            />
            <div class="delete-error" v-if="deleteError">
              {{ deleteError }}
            </div>
            <div class="modal-actions">
              <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
              <button 
                class="btn-danger" 
                :disabled="deleteConfirmation !== 'delete'"
                @click="confirmDelete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useUsers, type User } from "@/composables/sysadmin/useUser";

const { 
  users, 
  loading, 
  errorMessage, 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  formatDate 
} = useUsers();

onMounted(fetchUsers);

const searchQuery = ref("");
const filterRole = ref("");
const currentPage = ref(1);
const pageSize = 10;

const showModal = ref(false);
const editUserData = ref<User | null>(null);
const form = ref({ 
  username: "", 
  email: "", 
  password: "", 
  role: "SYSADMIN" 
});

const errors = ref<Record<string, string>>({});
const showDeleteModal = ref(false);
const deleteUserData = ref<User | null>(null);
const deleteConfirmation = ref("");
const deleteError = ref("");

// Filter hanya admin roles
const adminUsers = computed(() => {
  return users.value.filter(u => 
    u.role === 'SYSADMIN' || u.role === 'BUSINESS' || u.role === 'FINANCE'
  );
});

watch([searchQuery, filterRole], () => {
  currentPage.value = 1;
});

const filteredUsers = computed(() => {
  const s = searchQuery.value.trim().toLowerCase();
  return adminUsers.value.filter(u => {
    const username = u.username?.toLowerCase() || "";
    const email = u.email?.toLowerCase() || "";
    const matchesSearch = !s || username.includes(s) || email.includes(s);
    const matchesRole = !filterRole.value || u.role === filterRole.value;
    return matchesSearch && matchesRole;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize)));
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredUsers.value.slice(start, start + pageSize);
});

const getRoleClass = (role?: string) => {
  const safeRole = (role || 'SYSADMIN').toUpperCase();
  if (['SYSADMIN', 'BUSINESS', 'FINANCE'].includes(safeRole)) {
    return `chip-${safeRole.toLowerCase()}`;
  }
  return 'chip-sysadmin';
};

const openModal = (user?: User) => {
  if (user) {
    editUserData.value = user;
    form.value = { 
      username: user.username || "", 
      email: user.email || "", 
      password: "", 
      role: user.role || "SYSADMIN" 
    };
  } else {
    editUserData.value = null;
    form.value = { 
      username: "", 
      email: "", 
      password: "", 
      role: "SYSADMIN" 
    };
  }
  errors.value = {};
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editUserData.value = null;
  errors.value = {};
};

const openDeleteModal = (user: User) => {
  deleteUserData.value = user;
  deleteConfirmation.value = "";
  deleteError.value = "";
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  deleteUserData.value = null;
  showDeleteModal.value = false;
};

const validateDeleteInput = () => {
  const val = deleteConfirmation.value;
  if (val === "") {
    deleteError.value = "";
  } else if (val === "delete") {
    deleteError.value = "";
  } else {
    deleteError.value = "You must type exactly: delete";
  }
};

const clearError = (field: string) => {
  if (errors.value[field]) {
    errors.value = { ...errors.value, [field]: '' };
  }
};

const isValidPassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
};

const isEmailDuplicate = (email: string, excludeId?: string): boolean => {
  return adminUsers.value.some(u => 
    u.email?.toLowerCase() === email.toLowerCase() && u.id !== excludeId
  );
};

const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!form.value.username.trim()) {
    newErrors.username = "Username is required";
  }

  if (!form.value.email.trim()) {
    newErrors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    newErrors.email = "Invalid email format";
  } else if (isEmailDuplicate(form.value.email, editUserData.value?.id)) {
    newErrors.email = "Email already exists";
  }

  if (!editUserData.value) {
    if (!form.value.password.trim()) {
      newErrors.password = "Password is required";
    } else if (!isValidPassword(form.value.password)) {
      newErrors.password = "Password must be at least 8 characters with uppercase, lowercase, and number";
    }
  } else {
    if (form.value.password.trim() && !isValidPassword(form.value.password)) {
      newErrors.password = "Password must be at least 8 characters with uppercase, lowercase, and number";
    }
  }

  if (!form.value.role) {
    newErrors.role = "Role is required";
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const submitForm = async () => {
  if (!validateForm()) return;

  try {
    if (editUserData.value) {
      if (form.value.password) {
        await updateUser(editUserData.value.id, form.value);
      } else {
        const { password, ...updateData } = form.value;
        await updateUser(editUserData.value.id, updateData);
      }
    } else {
      await createUser(form.value);
    }
    await fetchUsers();
    closeModal();
  } catch (err) {
    console.error(err);
  }
};

const confirmDelete = async () => {
  // Pastikan hanya "delete" (exact match, case-sensitive)
  if (deleteConfirmation.value !== "delete" || !deleteUserData.value?.id) {
    return;
  }
  await deleteUser(deleteUserData.value.id);
  await fetchUsers();
  closeDeleteModal();
};
</script>

<style scoped>
/* GLOBAL */
.page-wrapper {
  max-width: 1280px;
  margin: 28px auto;
  padding: 0 18px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
}

/* HEADER */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* MESSAGES */
.loading-message,
.error-message {
  text-align: center;
  padding: 24px;
  font-size: 16px;
}

.error-message {
  color: #ef4444;
}

/* SEARCH & FILTERS */
.search-wrapper {
  position: relative;
  min-width: 220px;
}

.search-wrapper svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #8A7CF0;
  box-shadow: 0 0 0 3px rgba(138, 124, 240, 0.15);
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  min-width: 140px;
  color: #1f2937;
}

.filter-select:focus {
  outline: none;
  border-color: #8A7CF0;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #6A5BEF, #5D4AE5);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: linear-gradient(135deg, #5D4AE5, #4F3FD9);
}

.add-text {
  display: none;
}

@media (min-width: 768px) {
  .add-text {
    display: inline;
  }
}

/* CARD & TABLE */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.modern-table thead th {
  text-align: left;
  padding: 16px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  background: #F7F5FF;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modern-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.modern-table tbody tr:hover {
  background: #faf9ff;
}

.muted {
  color: #6b7280;
  font-size: 13px;
}

.name-cell {
  font-weight: 600;
  color: #111827;
}

/* CHIP */
.chip {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.chip-sysadmin { background: #e0f2fe; color: #0891b2; }
.chip-business { background: #f0fdf4; color: #166534; }
.chip-finance { background: #fef3c7; color: #92400e; }

/* ACTIONS */
.th-actions,
.actions-cell {
  text-align: right;
}

.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f9f8ff;
  color: #6A5BEF;
  border-color: #6A5BEF;
}

.action-btn.danger:hover {
  color: #ef4444;
  border-color: #ef4444;
}

/* EMPTY STATE */
.empty-row .empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #9ca3af;
}

/* PAGINATION */
.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 8px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.disabled):not(.active) {
  background: #f9f8ff;
  color: #6A5BEF;
  border-color: #6A5BEF;
}

.pagination-btn.active {
  background: #6A5BEF;
  color: white;
  border-color: #6A5BEF;
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000;
}

.modal-card {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-small {
  max-width: 420px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 20px;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #111827;
  background: #f3f4f6;
  border-radius: 50%;
}

.modal-body {
  padding: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #8A7CF0;
  box-shadow: 0 0 0 3px rgba(138, 124, 240, 0.15);
}

/* DELETE MODAL SPECIFIC */
.confirm-text {
  margin-bottom: 12px;
  color: #111827;
  font-size: 14px;
  line-height: 1.5;
}

.delete-instruction {
  text-align: center;
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  color: #ef4444;
  margin: 12px 0;
  letter-spacing: 1px;
}

.delete-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
}

.delete-input:focus {
  outline: none;
  border-color: #8A7CF0;
  box-shadow: 0 0 0 3px rgba(138, 124, 240, 0.15);
}

.delete-error {
  color: #ef4444;
  font-size: 13px;
  margin: 8px 0;
  min-height: 18px;
}

/* ERROR & HINT TEXT */
.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.password-hint {
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

/* MODAL ACTIONS */
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #6A5BEF, #5D4AE5);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5D4AE5, #4F3FD9);
}

.btn-danger {
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger:hover {
  background: #dc2626;
}

.text-center {
  text-align: center;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-right {
    width: 100%;
  }
  .search-wrapper {
    min-width: auto;
  }
}
</style>
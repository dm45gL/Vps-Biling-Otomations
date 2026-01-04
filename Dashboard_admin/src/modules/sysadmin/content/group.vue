<template>
  <div class="page-wrapper">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="title">Manage Template Groups</h1>
        <p class="subtitle">Create and manage template groups for your hypervisors</p>
      </div>
      <button class="add-btn" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 4v8M4 8h8"/>
        </svg>
        <span class="add-text">Add Group</span>
      </button>
    </div>

    <!-- Loading & Error -->
    <div v-if="loadingGroups" class="loading-message">Loading template groups...</div>
    <div v-else-if="errorGroups" class="error-message">{{ errorGroups }}</div>

    <!-- Table -->
    <div v-if="!loadingGroups && !errorGroups" class="card">
      <div class="table-wrap">
        <table class="modern-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Created</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(group, i) in templateGroups" :key="group.id">
              <td class="muted">{{ i + 1 }}</td>
              <td class="name-cell">{{ group.name }}</td>
              <td class="muted">{{ formatDate(group.createdAt) }}</td>
              <td class="actions-cell">
                <button class="action-btn danger" @click="openDeleteModal(group)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 5h8M10 5v9H6V5M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="templateGroups.length === 0">
              <td colspan="4" class="empty-row">
                <div class="empty-content">
                  <div>No template groups found</div>
                  <small>Create your first group to get started</small>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Group Modal -->
    <teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
        <div class="modal-card">
          <header class="modal-header">
            <h3>Add Template Group</h3>
            <button class="modal-close" @click="closeAddModal">×</button>
          </header>
          <form class="modal-body" @submit.prevent="submitAddForm">
            <div class="form-group">
              <label>Group Name</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="newGroupName"
                @input="clearAddError"
              />
              <small v-if="addGroupError" class="error-text">{{ addGroupError }}</small>
            </div>
            <footer class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeAddModal">Cancel</button>
              <button type="submit" class="btn-primary">Create</button>
            </footer>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Delete Group Modal -->
    <teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-card modal-small">
          <header class="modal-header">
            <h3>Confirm Delete</h3>
            <button class="modal-close" @click="closeDeleteModal">×</button>
          </header>
          <div class="modal-body">
            <p class="confirm-text">
              To confirm deletion of group <strong>{{ selectedGroup?.name }}</strong>, 
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
import { ref, onMounted } from "vue";
import { useHypervisors } from "@/composables/sysadmin/useHypervisors";

const {
  templateGroups,
  loadingGroups,
  errorGroups,
  fetchTemplateGroups,
  createTemplateGroup,
  deleteTemplateGroup
} = useHypervisors();

onMounted(fetchTemplateGroups);

// Add modal
const showAddModal = ref(false);
const newGroupName = ref("");
const addGroupError = ref("");

// Delete modal
const showDeleteModal = ref(false);
const selectedGroup = ref<{ id: string; name: string } | null>(null);
const deleteConfirmation = ref("");
const deleteError = ref("");

const openAddModal = () => {
  newGroupName.value = "";
  addGroupError.value = "";
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
};

const clearAddError = () => {
  addGroupError.value = "";
};

const submitAddForm = async () => {
  if (!newGroupName.value.trim()) {
    addGroupError.value = "Group name is required";
    return;
  }
  try {
    await createTemplateGroup(newGroupName.value.trim());
    await fetchTemplateGroups();
    closeAddModal();
  } catch (err: any) {
    addGroupError.value = err.message || "Failed to create group";
  }
};

const openDeleteModal = (group: { id: string; name: string }) => {
  selectedGroup.value = group;
  deleteConfirmation.value = "";
  deleteError.value = "";
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedGroup.value = null;
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

const confirmDelete = async () => {
  if (deleteConfirmation.value !== "delete" || !selectedGroup.value?.id) return;
  try {
    await deleteTemplateGroup(selectedGroup.value.id);
    await fetchTemplateGroups();
    closeDeleteModal();
  } catch (err: any) {
    deleteError.value = err.message || "Failed to delete group";
  }
};

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—");
</script>

<style scoped>
/* Gunakan semua style dari ManageHypervisorsView.vue */
/* Tambahkan hanya yang spesifik di sini */

.page-wrapper {
  max-width: 1000px;
  margin: 28px auto;
  padding: 0 18px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
}

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

.loading-message,
.error-message {
  text-align: center;
  padding: 24px;
  font-size: 16px;
}

.error-message {
  color: #ef4444;
}

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
  min-width: 600px;
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

.empty-row .empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #9ca3af;
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
  max-width: 500px;
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

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

/* DELETE MODAL */
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
<template>
  <div class="workspace">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-left">
        <h1 class="page-title">Template Management</h1>
        <p class="page-subtitle">Organize infrastructure templates with categories & groups</p>
      </div>
      <div class="top-controls">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="5.5"/>
            <path d="m11 11 2 2"/>
          </svg>
          <input
            type="text"
            class="search-input"
            v-model="searchQuery"
            placeholder="Search templates (name, OS)..."
          />
        </div>
        <button 
          class="btn-primary" 
          @click="openAddGroupModal"
          :disabled="templateCategories.length === 0"
          :title="templateCategories.length === 0 ? 'Create a category first' : ''"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 4v8M4 8h8"/>
          </svg>
          New Group
        </button>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="main-layout">
      <!-- Groups Sidebar with Categories -->
      <div class="groups-pane">
        <div class="pane-header">
          <h2>Categories</h2>
          <span class="badge">{{ templateCategories.length }} categories</span>
        </div>
        <div class="categories-list">
          <!-- NEW CATEGORY BUTTON -->
          <div class="new-category-item">
            <button class="btn-tertiary" @click="openAddCategoryModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 4v8M4 8h8"/>
              </svg>
              New Category
            </button>
          </div>

          <!-- CATEGORIZED GROUPS ONLY -->
          <div v-for="category in templateCategories" :key="category.id" class="category-section">
            <div class="category-header">
              <div class="category-name">{{ category.name }}</div>
              <button 
                class="icon-btn delete-category-btn"
                @click="openDeleteCategoryModal(category)"
                title="Delete category"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 5h8M10 5v9H6V5M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
            <div class="groups-list">
              <div 
                v-for="group in category.groups || []" 
                :key="group.id"
                class="group-item"
                :class="{ 'active': selectedGroup?.id === group.id }"
                @click="selectGroup(group)"
              >
                <div class="group-icon">📁</div>
                <div class="group-info">
                  <div class="group-name">{{ group.name }}</div>
                  <div class="group-count">{{ getTemplateCountInGroup(group.id) }} templates</div>
                </div>
                <div class="group-actions">
                  <button 
                    class="icon-btn" 
                    @click.stop="openDeleteGroupModal(group)"
                    title="Delete group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 5h8M10 5v9H6V5M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div v-if="!(category.groups || []).length" class="empty-in-category">
                No groups
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="templateCategories.length === 0" class="empty-groups">
            <p>Create a category first to add groups.</p>
          </div>
        </div>
      </div>

      <!-- Templates Side-by-Side -->
      <div class="templates-side-by-side">
        <!-- Group Templates -->
        <div class="table-section narrow-section">
          <div class="section-header">
            <h2>
              {{ selectedGroup 
                  ? `${selectedGroup.name} (${getTemplateCountInGroup(selectedGroup.id)})`
                  : 'Select a Group'
              }}
            </h2>
          </div>
          <div 
            class="table-container group-table-area"
            @dragover.prevent
            @drop="onDropToGroup($event)"
          >
            <table class="templates-table">
              <thead>
                <tr>
                  <th>Template Name</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="selectedGroup">
                  <tr 
                    v-for="tpl in getTemplatesInGroup(selectedGroup.id)" 
                    :key="tpl.id"
                    draggable="true"
                    @dragstart="onDragStart($event, tpl)"
                  >
                    <td>{{ tpl.name }}</td>
                  </tr>
                  <tr v-if="getTemplateCountInGroup(selectedGroup.id) === 0">
                    <td class="empty-group-row">
                      Drag templates here
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td class="empty-group-row">
                    Select a group
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- All Templates -->
        <div class="table-section">
          <div class="section-header">
            <h2>All Templates</h2>
            <div class="sync-controls">
              <select v-model="selectedHypervisorId" class="form-select">
                <option value="">Sync All</option>
                <option v-for="h in hypervisors" :key="h.id" :value="h.id">
                  {{ h.name }}
                </option>
              </select>
              <button 
                class="btn-sync" 
                @click="syncTemplates"
                :disabled="syncing"
              >
                <span v-if="syncing" class="spinner"></span>
                <span v-else>Sync</span>
              </button>
            </div>
          </div>
          <div 
            class="table-container"
            @dragover.prevent
            @drop="onDropToAvailable($event)"
          >
            <table class="templates-table">
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>OS</th>
                  <th>Hypervisor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="tpl in filteredAllTemplates" 
                  :key="tpl.id"
                  draggable="true"
                  @dragstart="onDragStart($event, tpl)"
                  :class="{ 'assigned-row': !!tpl.groupId }"
                >
                  <td>{{ tpl.name }}</td>
                  <td>{{ tpl.os }}</td>
                  <td>{{ getHypervisorName(tpl.hypervisorId) }}</td>
                  <td>
                    <span v-if="tpl.groupId" class="status-badge assigned">Assigned</span>
                    <span v-else class="status-badge">Available</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredAllTemplates.length === 0" class="empty-table">
              No templates found.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- === MODALS === -->
    <!-- Add Group -->
    <teleport to="body">
      <div v-if="showAddGroupModal" class="modal-overlay" @click.self="closeAddGroupModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Create Template Group</h3>
            <button class="modal-close" @click="closeAddGroupModal">×</button>
          </div>
          <form class="modal-body" @submit.prevent="submitAddGroup">
            <div class="form-field">
              <label>Category <span class="required">*</span></label>
              <select 
                v-model="selectedCategoryId" 
                class="form-select"
                :class="{ 'form-error-border': !selectedCategoryId }"
              >
                <option value="">— Select a category —</option>
                <option v-for="cat in templateCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
              <p v-if="!selectedCategoryId && groupCategoryTouched" class="form-error">Category is required</p>
            </div>
            <div class="form-field">
              <label>Group Name <span class="required">*</span></label>
              <input 
                type="text" 
                class="form-input"
                v-model="newGroupName"
                placeholder="e.g. Web Servers"
                @input="clearGroupError"
              />
              <p v-if="groupError" class="form-error">{{ groupError }}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-tertiary" @click="closeAddGroupModal">Cancel</button>
              <button type="submit" class="btn-primary">Create Group</button>
            </div>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Add Category -->
    <teleport to="body">
      <div v-if="showAddCategoryModal" class="modal-overlay" @click.self="closeAddCategoryModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Create Template Category</h3>
            <button class="modal-close" @click="closeAddCategoryModal">×</button>
          </div>
          <form class="modal-body" @submit.prevent="submitAddCategory">
            <div class="form-field">
              <label>Category Name</label>
              <input 
                type="text" 
                class="form-input"
                v-model="newCategoryName"
                placeholder="e.g. Operating Systems"
                @input="categoryError = ''"
              />
              <p v-if="categoryError" class="form-error">{{ categoryError }}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-tertiary" @click="closeAddCategoryModal">Cancel</button>
              <button type="submit" class="btn-primary">Create Category</button>
            </div>
          </form>
        </div>
      </div>
    </teleport>

    <!-- Delete Group -->
    <teleport to="body">
      <div v-if="deleteGroupModal.group" class="modal-overlay" @click.self="closeDeleteGroupModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Delete Group?</h3>
            <button class="modal-close" @click="closeDeleteGroupModal">×</button>
          </div>
          <div class="modal-body">
            <p>Deleting <strong>{{ deleteGroupModal.group.name }}</strong> will not delete templates.</p>
            <p v-if="getTemplateCountInGroup(deleteGroupModal.group.id) > 0" class="text-warning">
              ⚠️ Contains {{ getTemplateCountInGroup(deleteGroupModal.group.id) }} templates.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-tertiary" @click="closeDeleteGroupModal">Cancel</button>
            <button class="btn-danger" @click="confirmDeleteGroup">Delete Group</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Delete Category -->
    <teleport to="body">
      <div v-if="deleteCategoryModal.category" class="modal-overlay" @click.self="closeDeleteCategoryModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Delete Category?</h3>
            <button class="modal-close" @click="closeDeleteCategoryModal">×</button>
          </div>
          <div class="modal-body">
            <p>Deleting <strong>{{ deleteCategoryModal.category.name }}</strong> will unassign its groups, but not delete them.</p>
            <p v-if="(deleteCategoryModal.category.groups || []).length > 0" class="text-warning">
              ⚠️ Contains {{ deleteCategoryModal.category.groups?.length }} groups.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-tertiary" @click="closeDeleteCategoryModal">Cancel</button>
            <button class="btn-danger" @click="confirmDeleteCategory">Delete Category</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useHypervisors } from "@/composables/sysadmin/useHypervisors";
import type { TemplateCategory } from "@/composables/sysadmin/useHypervisors";

interface ExtendedTemplate {
  id: string;
  name: string;
  os: string;
  hypervisorId: string;
  groupId?: string | null;
}

const {
  hypervisors,
  fetchHypervisors,
  fetchTemplates,
  syncHypervisorTemplates,
  templateGroups,
  fetchTemplateGroups,
  createTemplateGroup,
  assignTemplateToGroup,
  unassignTemplateFromGroup,
  deleteTemplateGroup,
  templateCategories,
  fetchTemplateCategories,
  createTemplateCategory,
  deleteTemplateCategory,
} = useHypervisors();

// State
const selectedHypervisorId = ref<string | null>(null);
const allTemplates = ref<ExtendedTemplate[]>([]);
const syncing = ref(false);
const searchQuery = ref("");
const selectedGroup = ref<{ id: string; name: string } | null>(null);
const draggedTemplate = ref<ExtendedTemplate | null>(null);

// Modal states
const showAddGroupModal = ref(false);
const newGroupName = ref("");
const groupError = ref("");
const selectedCategoryId = ref<string | null>(null);
const groupCategoryTouched = ref(false); // untuk validasi UX

const showAddCategoryModal = ref(false);
const newCategoryName = ref("");
const categoryError = ref("");

const deleteGroupModal = ref<{ group: { id: string; name: string } | null }>({ group: null });
const deleteCategoryModal = ref<{ category: TemplateCategory | null }>({ category: null });

onMounted(async () => {
  await fetchHypervisors();
  await fetchTemplateGroups();
  await fetchTemplateCategories();
  await fetchAllTemplates();
});

const fetchAllTemplates = async () => {
  const templates: ExtendedTemplate[] = [];
  for (const h of hypervisors.value) {
    const res = await fetchTemplates(h.id);
    templates.push(...res.map((t: any) => ({
      id: t.id,
      name: t.name,
      os: t.os || '—',
      hypervisorId: h.id,
      groupId: t.groupId || null
    })));
  }
  allTemplates.value = templates;
};

// Add Group
const openAddGroupModal = () => {
  if (templateCategories.value.length === 0) return;
  newGroupName.value = "";
  selectedCategoryId.value = null;
  groupError.value = "";
  groupCategoryTouched.value = false;
  showAddGroupModal.value = true;
};

const closeAddGroupModal = () => {
  showAddGroupModal.value = false;
};

const clearGroupError = () => {
  groupError.value = "";
};

const submitAddGroup = async () => {
  const name = newGroupName.value.trim();
  const catId = selectedCategoryId.value;

  if (!catId) {
    groupCategoryTouched.value = true;
    return;
  }
  if (!name) {
    groupError.value = "Group name is required";
    return;
  }

  const exists = templateGroups.value.some(g => g.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    groupError.value = "A group with this name already exists";
    return;
  }

  try {
    await createTemplateGroup(name, catId);
    await fetchTemplateGroups();
    await fetchTemplateCategories(); // refresh category → group mapping
    closeAddGroupModal();
  } catch (err: any) {
    groupError.value = err.message || "Failed to create group";
  }
};

// Add Category
const openAddCategoryModal = () => {
  newCategoryName.value = "";
  categoryError.value = "";
  showAddCategoryModal.value = true;
};

const closeAddCategoryModal = () => {
  showAddCategoryModal.value = false;
};

const submitAddCategory = async () => {
  const name = newCategoryName.value.trim();
  if (!name) {
    categoryError.value = "Category name is required";
    return;
  }
  const exists = templateCategories.value.some(c => c.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    categoryError.value = "A category with this name already exists";
    return;
  }
  try {
    await createTemplateCategory(name);
    await fetchTemplateCategories();
    closeAddCategoryModal();
  } catch (err: any) {
    categoryError.value = err.message || "Failed to create category";
  }
};

// Delete Group
const openDeleteGroupModal = (group: { id: string; name: string }) => {
  deleteGroupModal.value = { group };
};

const closeDeleteGroupModal = () => {
  deleteGroupModal.value = { group: null };
};

const confirmDeleteGroup = async () => {
  if (!deleteGroupModal.value.group) return;
  try {
    await deleteTemplateGroup(deleteGroupModal.value.group.id);
    await fetchTemplateGroups();
    await fetchTemplateCategories();
    // Update local template assignments
    allTemplates.value.forEach(tpl => {
      if (tpl.groupId === deleteGroupModal.value.group?.id) {
        tpl.groupId = null;
      }
    });
    if (selectedGroup.value?.id === deleteGroupModal.value.group.id) {
      selectedGroup.value = null;
    }
    closeDeleteGroupModal();
  } catch (err: any) {
    // handle silently or notify
  }
};

// Delete Category
const openDeleteCategoryModal = (category: TemplateCategory) => {
  deleteCategoryModal.value = { category };
};

const closeDeleteCategoryModal = () => {
  deleteCategoryModal.value = { category: null };
};

const confirmDeleteCategory = async () => {
  if (!deleteCategoryModal.value.category) return;
  try {
    await deleteTemplateCategory(deleteCategoryModal.value.category.id);
    await fetchTemplateCategories();
    closeDeleteCategoryModal();
  } catch (err: any) {
    // handle silently or notify
  }
};

// Drag & Drop
const onDragStart = (event: DragEvent, tpl: ExtendedTemplate) => {
  draggedTemplate.value = tpl;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

const onDropToGroup = async (event: DragEvent) => {
  event.preventDefault();
  if (!draggedTemplate.value || !selectedGroup.value) return;
  if (draggedTemplate.value.groupId === selectedGroup.value.id) return;
  try {
    await assignTemplateToGroup(draggedTemplate.value.id, selectedGroup.value.id);
    draggedTemplate.value.groupId = selectedGroup.value.id;
  } catch (err) {
    // handle error
  }
};

const onDropToAvailable = async (event: DragEvent) => {
  event.preventDefault();
  if (!draggedTemplate.value || !draggedTemplate.value.groupId) return;
  try {
    await unassignTemplateFromGroup(draggedTemplate.value.id);
    draggedTemplate.value.groupId = null;
  } catch (err) {
    // handle error
  }
};

// Helpers
const selectGroup = (g: { id: string; name: string }) => {
  selectedGroup.value = g;
};

const getTemplateCountInGroup = (groupId: string) => {
  return allTemplates.value.filter(t => t.groupId === groupId).length;
};

const getTemplatesInGroup = (groupId: string) => {
  return allTemplates.value.filter(t => t.groupId === groupId);
};

const getHypervisorName = (id: string) => {
  const h = hypervisors.value.find(h => h.id === id);
  return h ? h.name : "Unknown";
};

const filteredAllTemplates = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  return allTemplates.value.filter(t => 
    t.name.toLowerCase().includes(q) || 
    (t.os && t.os.toLowerCase().includes(q))
  );
});

const syncTemplates = async () => {
  syncing.value = true;
  try {
    if (selectedHypervisorId.value) {
      await syncHypervisorTemplates(selectedHypervisorId.value);
    } else {
      await Promise.all(hypervisors.value.map(h => syncHypervisorTemplates(h.id)));
    }
    await fetchAllTemplates();
  } finally {
    syncing.value = false;
  }
};
</script>

<style scoped>
/* === FOUNDATION === */
.workspace {
  height: 93vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
  overflow: hidden;
}

/* === TOP BAR === */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 32px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}
.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0;
}
.top-controls {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.search-box {
  position: relative;
  min-width: 280px;
}
.search-box svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
}
.search-input:focus {
  outline: none;
  border-color: #7e57c2;
  box-shadow: 0 0 0 3px rgba(126, 87, 194, 0.1);
}

/* === MAIN LAYOUT === */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* === GROUPS PANE === */
.groups-pane {
  width: 240px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.pane-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.badge {
  background: #f1f5f9;
  color: #64748b;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.categories-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}
.new-category-item {
  padding: 12px 16px;
}
.category-section {
  margin-top: 16px;
}
.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  background: #f8fafc;
  border-radius: 8px;
}
.category-name {
  flex: 1;
}
.delete-category-btn {
  opacity: 0;
  transition: opacity 0.2s;
}
.category-section:hover .delete-category-btn {
  opacity: 1;
}
.groups-list {
  margin-top: 8px;
}
.group-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  margin: 8px 0;
  border-radius: 12px;
  cursor: pointer;
  background: #f8fafc;
}
.group-item:hover {
  background: #f1f5f9;
}
.group-item.active {
  background: #ede9ff;
  border-left: 3px solid #7e57c2;
}
.group-icon {
  font-size: 20px;
  margin-right: 12px;
}
.group-info {
  flex: 1;
}
.group-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}
.group-count {
  font-size: 12px;
  color: #64748b;
}
.group-actions {
  opacity: 0;
  transition: opacity 0.2s;
}
.group-item:hover .group-actions {
  opacity: 1;
}
.empty-in-category {
  padding: 10px 16px;
  color: #94a3b8;
  font-size: 12px;
}
.empty-groups {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

/* === TEMPLATES SIDE-BY-SIDE === */
.templates-side-by-side {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 24px;
  overflow: hidden;
}
.table-section {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
  overflow: hidden;
}
.narrow-section {
  width: 280px;
  flex: none;
}
.table-section:not(.narrow-section) {
  flex: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}
.sync-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}
.form-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  min-width: 120px;
}
.btn-sync {
  padding: 6px 12px;
  background: linear-gradient(135deg, #6A5BEF, #5D4AE5);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-sync:disabled {
  opacity: 0.6;
}

/* === TABLES === */
.table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.templates-table {
  width: 100%;
  border-collapse: collapse;
}
.templates-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}
.templates-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  white-space: nowrap;
}
.templates-table tr:last-child td {
  border-bottom: none;
}
.assigned-row {
  background: #f0e9ff;
}
.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.assigned {
  background: #ede9ff;
  color: #7e57c2;
}
.status-badge {
  background: #f1f5f9;
  color: #475569;
}
.empty-table,
.empty-group-row {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
  font-style: italic;
}
.group-table-area {
  background: #fcfafd;
}

/* === BUTTONS === */
.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #6A5BEF, #5D4AE5);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5D4AE5, #4F3FD9);
}
.btn-primary:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}
.btn-tertiary {
  padding: 10px 20px;
  background: #f1f5f9;
  color: #334155;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
}
.btn-tertiary:hover {
  background: #e2e8f0;
}
.btn-danger {
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
}
.btn-danger:hover {
  background: #dc2626;
}
.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: #f1f5f9;
  color: #7e57c2;
}

/* === MODALS === */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
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
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
}
.modal-body {
  padding: 24px;
}
.form-field {
  margin-bottom: 20px;
}
.form-field label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1e293b;
}
.required {
  color: #ef4444;
}
.form-input,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
}
.form-error-border {
  border-color: #ef4444 !important;
}
.form-error {
  color: #ef4444;
  font-size: 13px;
  margin-top: 8px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #f1f5f9;
}
.text-warning {
  color: #d97706;
  font-weight: 500;
}

/* === SPINNER === */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* === RESPONSIVE === */
@media (max-width: 1200px) {
  .templates-side-by-side {
    flex-direction: column;
    gap: 24px;
  }
  .narrow-section {
    width: 100%;
  }
}
@media (max-width: 900px) {
  .groups-pane {
    width: 200px;
  }
  .search-box {
    min-width: 200px;
  }
}
</style>
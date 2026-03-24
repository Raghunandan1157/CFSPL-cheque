/**
 * app.js - Main application logic for Dashboard
 */

const App = {
    currentFilter: 'all',

    init() {
        this.renderTasks();
        this.setupEventListeners();
    },

    setupEventListeners() {
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        document.getElementById('toggleSidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
    },

    renderTasks() {
        const tasks = DataStore.getTasks();
        const grid = document.getElementById('taskGrid');
        grid.innerHTML = '';

        let filteredTasks = tasks;
        if (this.currentFilter === 'progress') {
            filteredTasks = tasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = tasks.filter(t => t.completed);
        }

        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(t => 
                t.issueDescription.toLowerCase().includes(searchQuery) ||
                t.id.toLowerCase().includes(searchQuery) ||
                t.branch.toLowerCase().includes(searchQuery) ||
                t.staffName?.toLowerCase().includes(searchQuery)
            );
        }

        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${task.completed ? 'completed' : ''}`;
            card.onclick = () => this.openModal(task.id);
            
            card.innerHTML = `
                <div class="task-meta">
                    <span>${task.id}</span> • <span>${task.timestamp}</span>
                </div>
                <h3>${task.issueDescription}</h3>
                <div class="task-meta">
                    <span>${task.branch}</span> • <span>${task.hoco}</span>
                </div>
                <div>
                    <span class="badge badge-${task.issueType.toLowerCase()}">${task.issueType}</span>
                    ${task.completed ? '<span class="badge" style="background: #22c55e22; color: #16a34a;">Completed</span>' : ''}
                </div>
            `;
            grid.appendChild(card);
        });

        if (filteredTasks.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No tasks found.</p>';
        }
    },

    filterTasks(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        event.target.classList.add('active');
        
        const titles = { all: 'All Tasks', progress: 'In Progress', completed: 'Completed Tasks' };
        document.getElementById('pageTitle').textContent = titles[filter];
        
        this.renderTasks();
    },

    searchTasks() {
        this.renderTasks();
    },

    openModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        form.reset();
        
        document.getElementById('staffFields').classList.add('hidden');
        document.getElementById('completionTimeGroup').classList.add('hidden');
        document.getElementById('deleteBtn').classList.add('hidden');
        document.getElementById('completeBtn').classList.remove('hidden');
        document.getElementById('saveBtn').disabled = false;
        
        if (taskId) {
            // Edit Mode
            const task = DataStore.getTasks().find(t => t.id === taskId);
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('displayTaskId').value = task.id;
            document.getElementById('taskTimestamp').value = task.timestamp;
            document.getElementById('branch').value = task.branch;
            document.getElementById('hoco').value = task.hoco;
            document.getElementById('issueType').value = task.issueType;
            document.getElementById('issueDescription').value = task.issueDescription;
            document.getElementById('solution').value = task.solution;
            document.getElementById('detailedDescription').value = task.detailedDescription;
            document.getElementById('amount').value = task.amount;
            document.getElementById('deleteBtn').classList.remove('hidden');

            if (task.hoco !== 'None') {
                document.getElementById('staffFields').classList.remove('hidden');
                document.getElementById('staffName').value = task.staffName;
                document.getElementById('staffId').value = task.staffId;
            }

            if (task.completed) {
                document.getElementById('completionTimeGroup').classList.remove('hidden');
                document.getElementById('completionTimestamp').value = task.completionTimestamp;
                document.getElementById('completeBtn').classList.add('hidden');
                document.getElementById('saveBtn').disabled = true;
                // Lock fields
                this.toggleFormFields(true);
            } else {
                this.toggleFormFields(false);
            }
        } else {
            // Add Mode
            document.getElementById('modalTitle').textContent = 'Add New Task';
            const newId = DataStore.generateTaskId();
            document.getElementById('taskId').value = newId;
            document.getElementById('displayTaskId').value = newId;
            document.getElementById('taskTimestamp').value = new Date().toLocaleString();
            this.toggleFormFields(false);
        }

        modal.style.display = 'flex';
    },

    closeModal() {
        document.getElementById('taskModal').style.display = 'none';
    },

    toggleStaffFields() {
        const hoco = document.getElementById('hoco').value;
        const fields = document.getElementById('staffFields');
        if (hoco === 'HO' || hoco === 'CO') {
            fields.classList.remove('hidden');
        } else {
            fields.classList.add('hidden');
        }
    },

    toggleFormFields(disabled) {
        const form = document.getElementById('taskForm');
        const elements = form.querySelectorAll('input, select, textarea');
        elements.forEach(el => {
            if (el.id !== 'displayTaskId' && el.id !== 'taskTimestamp' && el.id !== 'completionTimestamp') {
                el.disabled = disabled;
            }
        });
    },

    saveTask() {
        const taskData = this.getFormData();
        const existingTask = DataStore.getTasks().find(t => t.id === taskData.id);

        if (existingTask) {
            DataStore.updateTask({...existingTask, ...taskData});
        } else {
            DataStore.addTask(taskData);
        }

        this.closeModal();
        this.renderTasks();
    },

    getFormData() {
        return {
            id: document.getElementById('taskId').value,
            timestamp: document.getElementById('taskTimestamp').value,
            branch: document.getElementById('branch').value,
            hoco: document.getElementById('hoco').value,
            staffName: document.getElementById('staffName').value,
            staffId: document.getElementById('staffId').value,
            issueType: document.getElementById('issueType').value,
            issueDescription: document.getElementById('issueDescription').value,
            solution: document.getElementById('solution').value,
            detailedDescription: document.getElementById('detailedDescription').value,
            amount: document.getElementById('amount').value,
            completed: false
        };
    },

    completeTask() {
        if (confirm('Are you sure you want to mark this task as completed? This will lock the task for further edits.')) {
            const taskId = document.getElementById('taskId').value;
            const tasks = DataStore.getTasks();
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            
            if (taskIndex !== -1) {
                // Get current form data first to ensure latest changes are saved
                const formData = this.getFormData();
                tasks[taskIndex] = {
                    ...tasks[taskIndex],
                    ...formData,
                    completed: true,
                    completionTimestamp: new Date().toLocaleString()
                };
                DataStore.saveTasks(tasks);
                this.closeModal();
                this.renderTasks();
            } else {
                // If it's a new task being completed immediately
                const taskData = this.getFormData();
                taskData.completed = true;
                taskData.completionTimestamp = new Date().toLocaleString();
                DataStore.addTask(taskData);
                this.closeModal();
                this.renderTasks();
            }
        }
    },

    deleteTask() {
        if (confirm('Are you sure you want to delete this task?')) {
            const taskId = document.getElementById('taskId').value;
            DataStore.deleteTask(taskId);
            this.closeModal();
            this.renderTasks();
        }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;

/**
 * data.js - Handles localStorage and task data structure
 */

const STORAGE_KEY = 'nlpl_it_tasks';

const DataStore = {
    getTasks() {
        const tasks = localStorage.getItem(STORAGE_KEY);
        return tasks ? JSON.parse(tasks) : [];
    },

    saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    },

    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        this.saveTasks(tasks);
        return task;
    },

    updateTask(updatedTask) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            tasks[index] = updatedTask;
            this.saveTasks(tasks);
        }
    },

    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(t => t.id !== taskId);
        this.saveTasks(filtered);
    },

    generateTaskId() {
        return 'TASK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
};

window.DataStore = DataStore;

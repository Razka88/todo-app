// Get references to DOM elements
const taskInputText = document.getElementById('taskText');
const taskInputDate = document.getElementById('taskDate');
const addTaskButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');
const filterButtons = document.querySelectorAll('.filter-button');
const sortButton = document.getElementById('sortButton');
const undoBtn = document.getElementById('undoButton');

let tasks = [];
let currentFilter = 'all';
let lastDeletedTask = null;
let undoTimeout = null;

// Get tasks from localStorage
function getTasks() {
    const tasksJSON = localStorage.getItem('tasks');
    if (tasksJSON) {
        return JSON.parse(tasksJSON);
    }
    return [];
}

// Save tasks to localStorage
function saveTasks(tasksArray) {
    localStorage.setItem('tasks', JSON.stringify(tasksArray));
}

// Filter tasks by current filter
function filterTasks(tasksArray, filter) {
    switch (filter) {
        case 'completed':
            return tasksArray.filter(task => task.completed);
        case 'active':
            return tasksArray.filter(task => !task.completed);
        case 'all':
        default:
            return tasksArray;
    }
}

// Sort tasks by dueDate ascending (tasks without dueDate go last)
function sortTasks(tasksArray) {
    return tasksArray.slice().sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
        const dateB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
        return dateA - dateB;
    });
}

// Render the tasks list
function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = filterTasks(tasks, currentFilter);

    filteredTasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';

        li.innerHTML = `
            <span>${task.text} ${task.dueDate ? `(Due: ${task.dueDate})` : ''}</span>
            <div>
                <button class="complete-btn" data-id="${index}">${task.completed ? 'Undo' : 'Complete'}</button>
                <button class="delete-btn" data-id="${index}">Delete</button>
            </div>
        `;

        // Toggle completion
        li.querySelector('.complete-btn').addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            tasks[id].completed = !tasks[id].completed;
            saveTasks(tasks);
            renderTasks();
        });

        // Delete with undo
        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            lastDeletedTask = { ...tasks[id], index: id };
            tasks.splice(id, 1);
            saveTasks(tasks);
            renderTasks();
            showUndoButton();
        });

        taskList.appendChild(li);
    });
}

// Show undo button temporarily
function showUndoButton() {
    undoBtn.classList.add('show');

    clearTimeout(undoTimeout);

    undoTimeout = setTimeout(() => {
        lastDeletedTask = null;
        undoBtn.classList.remove('show');
    }, 5000);
}

// Undo last deleted task
undoBtn.addEventListener('click', () => {
    if (lastDeletedTask !== null) {
        tasks.splice(lastDeletedTask.index, 0, {
            text: lastDeletedTask.text,
            dueDate: lastDeletedTask.dueDate,
            completed: lastDeletedTask.completed
        });
        saveTasks(tasks);
        renderTasks();
        lastDeletedTask = null;
        undoBtn.classList.remove('show');
        clearTimeout(undoTimeout);
    }
});

// Add new task
function addTask() {
    const text = taskInputText.value.trim();
    const dueDate = taskInputDate.value;

    if (!text) {
        alert('Please enter a task description.');
        return;
    }

    const newTask = {
        text,
        dueDate,
        completed: false
    };

    tasks.push(newTask);
    saveTasks(tasks);
    renderTasks();

    taskInputText.value = '';
    taskInputDate.value = '';
}

// Filter buttons event listeners
filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        currentFilter = e.target.dataset.filter;
        renderTasks();
    });
});

// Sort button event listener
sortButton.addEventListener('click', () => {
    tasks = sortTasks(tasks);
    saveTasks(tasks);
    renderTasks();
});

// Load tasks from API if none in storage
async function fetchInitialTasks() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        data.forEach(item => {
            tasks.push({
                text: item.title,
                dueDate: '',
                completed: item.completed
            });
        });

        saveTasks(tasks);
        renderTasks();
    } catch (error) {
        console.error('Failed to fetch initial tasks:', error);
    }
}

// On page load
window.addEventListener('DOMContentLoaded', () => {
    tasks = getTasks();
    if (tasks.length === 0) {
        fetchInitialTasks();
    } else {
        renderTasks();
    }
});

// Add task button event listener
addTaskButton.addEventListener('click', addTask);

// Dark mode toggle logic
const toggleBtn = document.getElementById('toggleDarkMode');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const userPref = localStorage.getItem('darkMode');

if (userPref === 'true' || (userPref === null && prefersDark)) {
    document.body.classList.add('dark-mode');
    toggleBtn.textContent = '☀️ Light Mode';
}

toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    toggleBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
});

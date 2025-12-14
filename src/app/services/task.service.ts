import { Injectable, signal, computed } from '@angular/core';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  tasks = signal<Task[]>([]);
  newTaskTitle = signal('');
  newTaskLinks = signal<string[]>([]);
  currentLink = signal('');

  editingTask = signal<Task | null>(null);
  editTitle = signal('');
  editLinks = signal<string[]>([]);
  currentEditLink = signal('');

  linkSettings = signal({
    validateUrls: true,
    showLinkIcons: true,
    maxLinksPerTask: 10
  });

  tasksCount = computed(() => this.tasks().length);
  completedCount = computed(() => this.tasks().filter(task => task.completed).length);
  pendingCount = computed(() => this.tasksCount() - this.completedCount());
  totalLinksCount = computed(() =>
    this.tasks().reduce((total, task) => total + task.links.length, 0)
  );

  constructor() {
    this.loadTasksFromStorage();
  }

  addTask() {
    const title = this.newTaskTitle().trim();
    if (!title) return;

    const newTask: Task = {
      id: Date.now(),
      title,
      links: [...this.newTaskLinks()],
      completed: false,
      createdAt: new Date()
    };

    this.tasks.update(tasks => {
      const updatedTasks = [newTask, ...tasks];
      this.saveTasksToStorage(updatedTasks);
      return updatedTasks;
    });

    this.newTaskTitle.set('');
    this.newTaskLinks.set([]);
    this.currentLink.set('');
  }

  addLinkToNewTask() {
    const link = this.currentLink().trim();
    if (!link) return;

    if (this.isValidUrl(link) || !this.linkSettings().validateUrls) {
      const currentLinks = this.newTaskLinks();
      if (currentLinks.length < this.linkSettings().maxLinksPerTask) {
        this.newTaskLinks.update(links => [...links, link]);
        this.currentLink.set('');
      } else {
        alert(`Максимальное количество ссылок: ${this.linkSettings().maxLinksPerTask}`);
      }
    } else {
      alert('Пожалуйста, введите корректный URL (начинается с http:// или https://)');
    }
  }

  removeLinkFromNewTask(index: number) {
    this.newTaskLinks.update(links => {
      const updatedLinks = [...links];
      updatedLinks.splice(index, 1);
      return updatedLinks;
    });
  }

  addLinkToEditTask() {
    const link = this.currentEditLink().trim();
    if (!link) return;

    if (this.isValidUrl(link) || !this.linkSettings().validateUrls) {
      const currentLinks = this.editLinks();
      if (currentLinks.length < this.linkSettings().maxLinksPerTask) {
        this.editLinks.update(links => [...links, link]);
        this.currentEditLink.set('');
      } else {
        alert(`Максимальное количество ссылок: ${this.linkSettings().maxLinksPerTask}`);
      }
    } else {
      alert('Пожалуйста, введите корректный URL');
    }
  }

  removeLinkFromEditTask(index: number) {
    this.editLinks.update(links => {
      const updatedLinks = [...links];
      updatedLinks.splice(index, 1);
      return updatedLinks;
    });
  }

  deleteTask(taskId: number) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      this.tasks.update(tasks => {
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        this.saveTasksToStorage(updatedTasks);
        return updatedTasks;
      });
    }
  }

  startEdit(task: Task) {
    this.editingTask.set({ ...task });
    this.editTitle.set(task.title);
    this.editLinks.set([...task.links]);
    this.currentEditLink.set('');
  }

  saveEdit() {
    const editingTask = this.editingTask();
    const title = this.editTitle().trim();
    if (!editingTask || !title) return;

    this.tasks.update(tasks => {
      const index = tasks.findIndex(t => t.id === editingTask.id);
      if (index !== -1) {
        const updatedTasks = [...tasks];
        updatedTasks[index] = {
          ...updatedTasks[index],
          title,
          links: [...this.editLinks()]
        };
        this.saveTasksToStorage(updatedTasks);
        return updatedTasks;
      }
      return tasks;
    });

    this.cancelEdit();
  }

  cancelEdit() {
    this.editingTask.set(null);
    this.editTitle.set('');
    this.editLinks.set([]);
    this.currentEditLink.set('');
  }

  toggleComplete(taskId: number) {
    this.tasks.update(tasks => {
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      this.saveTasksToStorage(updatedTasks);
      return updatedTasks;
    });
  }

  clearCompleted() {
    if (confirm('Удалить все выполненные задачи?')) {
      this.tasks.update(tasks => {
        const updatedTasks = tasks.filter(task => !task.completed);
        this.saveTasksToStorage(updatedTasks);
        return updatedTasks;
      });
    }
  }

  isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  getDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  getFaviconUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return 'assets/link-icon.png';
    }
  }

  private saveTasksToStorage(tasks: Task[]) {
    localStorage.setItem('todo-tasks', JSON.stringify(tasks));
    this.sortTasks();
  }

  private loadTasksFromStorage() {
    const savedTasks = localStorage.getItem('todo-tasks');
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks);
      tasks.forEach((task: Task) => {
        task.createdAt = new Date(task.createdAt);
      });
      this.tasks.set(tasks);
      this.sortTasks();
    }
  }

  private sortTasks() {
    this.tasks.update(tasks => {
      return [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return b.id - a.id;
      });
    });
  }
}

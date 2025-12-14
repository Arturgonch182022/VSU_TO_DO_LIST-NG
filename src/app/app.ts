import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { ThemeService } from './services/theme.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  taskService = inject(TaskService);
  themeService = inject(ThemeService);

  get tasks() { return this.taskService.tasks(); }
  get newTaskTitle() { return this.taskService.newTaskTitle(); }
  get newTaskLinks() { return this.taskService.newTaskLinks(); }
  get currentLink() { return this.taskService.currentLink(); }
  get editingTask() { return this.taskService.editingTask(); }
  get editTitle() { return this.taskService.editTitle(); }
  get editLinks() { return this.taskService.editLinks(); }
  get currentEditLink() { return this.taskService.currentEditLink(); }
  get linkSettings() { return this.taskService.linkSettings(); }
  get isDarkMode() { return this.themeService.isDarkMode(); }

  get tasksCount() { return this.taskService.tasksCount(); }
  get completedCount() { return this.taskService.completedCount(); }
  get pendingCount() { return this.taskService.pendingCount(); }
  get totalLinksCount() { return this.taskService.totalLinksCount(); }

  addTask() { this.taskService.addTask(); }
  addLinkToNewTask() { this.taskService.addLinkToNewTask(); }
  removeLinkFromNewTask(index: number) { this.taskService.removeLinkFromNewTask(index); }
  addLinkToEditTask() { this.taskService.addLinkToEditTask(); }
  removeLinkFromEditTask(index: number) { this.taskService.removeLinkFromEditTask(index); }
  deleteTask(taskId: number) { this.taskService.deleteTask(taskId); }
  startEdit(task: any) { this.taskService.startEdit(task); }
  saveEdit() { this.taskService.saveEdit(); }
  cancelEdit() { this.taskService.cancelEdit(); }
  toggleComplete(taskId: number) { this.taskService.toggleComplete(taskId); }
  clearCompleted() { this.taskService.clearCompleted(); }

  getDomain(url: string) { return this.taskService.getDomain(url); }
  getFaviconUrl(url: string) { return this.taskService.getFaviconUrl(url); }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  updateNewTaskTitle(value: string) {
    this.taskService.newTaskTitle.set(value);
  }

  updateCurrentLink(value: string) {
    this.taskService.currentLink.set(value);
  }

  updateEditTitle(value: string) {
    this.taskService.editTitle.set(value);
  }

  updateCurrentEditLink(value: string) {
    this.taskService.currentEditLink.set(value);
  }
}

import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.loadThemeFromStorage();

    effect(() => {
      this.applyTheme();
      this.saveThemeToStorage();
    });
  }

  toggleTheme() {
    this.isDarkMode.update(mode => !mode);
  }

  private applyTheme() {
    if (this.isDarkMode()) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  private saveThemeToStorage() {
    localStorage.setItem('todo-theme', this.isDarkMode() ? 'dark' : 'light');
  }

  private loadThemeFromStorage() {
    const savedTheme = localStorage.getItem('todo-theme');
    const isDark = savedTheme === 'dark';
    this.isDarkMode.set(isDark);
  }
}

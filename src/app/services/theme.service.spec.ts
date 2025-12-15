import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockLocalStorage: { [key: string]: string };
  let originalLocalStorage: Storage;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;

    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => mockLocalStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockLocalStorage[key] = value;
        },
        clear: () => {
          mockLocalStorage = {};
        },
        length: 0,
        key: (index: number) => null,
        removeItem: (key: string) => {
          delete mockLocalStorage[key];
        }
      },
      writable: true
    });

    TestBed.configureTestingModule({
      providers: [ThemeService]
    });

    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });

  describe('Инициализация', () => {
    it('должен быть создан', () => {
      expect(service).toBeTruthy();
    });

    it('должен загружать темную тему из localStorage', () => {
      mockLocalStorage['todo-theme'] = 'dark';

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ThemeService]
      });

      const newService = TestBed.inject(ThemeService);
      expect(newService.isDarkMode()).toBe(true);
    });

    it('должен загружать светлую тему из localStorage', () => {
      mockLocalStorage['todo-theme'] = 'light';

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ThemeService]
      });

      const newService = TestBed.inject(ThemeService);
      expect(newService.isDarkMode()).toBe(false);
    });

    it('должен использовать светлую тему по умолчанию', () => {
      mockLocalStorage['todo-theme'] = null as any;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ThemeService]
      });

      const newService = TestBed.inject(ThemeService);
      expect(newService.isDarkMode()).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    it('должен переключать тему с светлой на темную', () => {
      service.isDarkMode.set(false);
      service.toggleTheme();
      expect(service.isDarkMode()).toBe(true);
    });

    it('должен переключать тему с темной на светлую', () => {
      service.isDarkMode.set(true);
      service.toggleTheme();
      expect(service.isDarkMode()).toBe(false);
    });
  });

  describe('Работа с localStorage', () => {

    it('должен сохранять тему в localStorage при переключении', () => {
      service.isDarkMode.set(false);

      service.toggleTheme();
      (service as any).saveThemeToStorage();

      expect(mockLocalStorage['todo-theme']).toBe('dark');
    });

    it('должен сохранять dark при темной теме', () => {
      service.isDarkMode.set(true);
      (service as any).saveThemeToStorage();
      expect(mockLocalStorage['todo-theme']).toBe('dark');
    });

    it('должен сохранять light при светлой теме', () => {
      service.isDarkMode.set(false);
      (service as any).saveThemeToStorage();
      expect(mockLocalStorage['todo-theme']).toBe('light');
    });
  });

  describe('Методы темы', () => {
    it('applyTheme должен добавлять класс dark-theme', () => {
      let addCalled = false;
      let addValue = '';
      const originalAdd = document.body.classList.add;
      document.body.classList.add = (className: string) => {
        addCalled = true;
        addValue = className;
        return originalAdd.call(document.body.classList, className);
      };

      service.isDarkMode.set(true);
      (service as any).applyTheme();

      expect(addCalled).toBe(true);
      expect(addValue).toBe('dark-theme');

      document.body.classList.add = originalAdd;
    });

    it('applyTheme должен удалять класс dark-theme', () => {
      let removeCalled = false;
      let removeValue = '';
      const originalRemove = document.body.classList.remove;
      document.body.classList.remove = (className: string) => {
        removeCalled = true;
        removeValue = className;
        return originalRemove.call(document.body.classList, className);
      };

      service.isDarkMode.set(false);
      (service as any).applyTheme();

      expect(removeCalled).toBe(true);
      expect(removeValue).toBe('dark-theme');

      document.body.classList.remove = originalRemove;
    });

    it('loadThemeFromStorage должен загружать dark тему', () => {
      mockLocalStorage['todo-theme'] = 'dark';
      let setCalled = false;
      let setValue: boolean | undefined;
      const originalSet = service.isDarkMode.set;
      service.isDarkMode.set = (value: boolean) => {
        setCalled = true;
        setValue = value;
        return originalSet.call(service.isDarkMode, value);
      };

      (service as any).loadThemeFromStorage();

      expect(setCalled).toBe(true);
      expect(setValue).toBe(true);

      service.isDarkMode.set = originalSet;
    });

    it('должен загружать светлую тему из localStorage', () => {
      mockLocalStorage['todo-theme'] = 'light';

      TestBed.resetTestingModule();

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: (key: string) => mockLocalStorage[key] || null,
          setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
          clear: () => { mockLocalStorage = {}; },
          length: 0,
          key: (index: number) => null,
          removeItem: (key: string) => { delete mockLocalStorage[key]; }
        },
        writable: true
      });

      TestBed.configureTestingModule({
        providers: [ThemeService]
      });

      const newService = TestBed.inject(ThemeService);
      expect(newService.isDarkMode()).toBe(false);
    });

  });
});

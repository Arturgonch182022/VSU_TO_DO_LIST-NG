import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { Task } from '../models/task.model';

describe('TaskService', () => {
  let service: TaskService;
  let mockLocalStorage: { [key: string]: string };
  let alertMessages: string[] = [];
  let confirmReturnValue = true;
  let originalAlert: (message?: any) => void;
  let originalConfirm: (message?: string) => boolean;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    originalAlert = window.alert;
    originalConfirm = window.confirm;
    originalLocalStorage = window.localStorage;

    window.alert = (message: string) => {
      alertMessages.push(message);
    };

    window.confirm = () => {
      return confirmReturnValue;
    };

    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => {
          return mockLocalStorage[key] || null;
        },
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
      providers: [TaskService]
    });

    service = TestBed.inject(TaskService);
  });

  afterEach(() => {
    window.alert = originalAlert;
    window.confirm = originalConfirm;
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });

    alertMessages = [];
    confirmReturnValue = true;
  });

  describe('Инициализация', () => {
    it('должен быть создан', () => {
      expect(service).toBeTruthy();
    });

    it('должен загружать задачи из localStorage при инициализации', () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'Сохраненная задача',
          links: ['https://example.com'],
          completed: false,
          createdAt: new Date('2024-01-01')
        }
      ];

      mockLocalStorage['todo-tasks'] = JSON.stringify(mockTasks);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [TaskService]
      });

      const newService = TestBed.inject(TaskService);
      expect(newService.tasks().length).toBe(1);
      expect(newService.tasks()[0].title).toBe('Сохраненная задача');
    });

    it('должен инициализироваться с пустым списком задач если localStorage пуст', () => {
      expect(service.tasks()).toEqual([]);
    });
  });

  describe('Методы работы с задачами', () => {
    it('должен добавлять новую задачу', () => {
      service.newTaskTitle.set('Новая задача');
      service.newTaskLinks.set(['https://test.com']);

      service.addTask();

      expect(service.tasks().length).toBe(1);
      expect(service.tasks()[0].title).toBe('Новая задача');
      expect(service.tasks()[0].links).toEqual(['https://test.com']);
      expect(service.tasks()[0].completed).toBe(false);
      expect(service.tasks()[0].createdAt instanceof Date).toBe(true);
    });

    it('не должен добавлять пустую задачу', () => {
      service.newTaskTitle.set('');
      service.addTask();

      expect(service.tasks().length).toBe(0);
    });

    it('должен очищать поля после добавления задачи', () => {
      service.newTaskTitle.set('Новая задача');
      service.newTaskLinks.set(['https://test.com']);
      service.currentLink.set('https://link.com');

      service.addTask();

      expect(service.newTaskTitle()).toBe('');
      expect(service.newTaskLinks()).toEqual([]);
      expect(service.currentLink()).toBe('');
    });

    it('должен добавлять задачу в начало списка', () => {
      service.newTaskTitle.set('Первая задача');
      service.addTask();

      const firstTaskId = service.tasks()[0].id;

      service.newTaskTitle.set('Вторая задача');
      service.addTask();

      expect(service.tasks().length).toBe(2);
      expect(service.tasks()[0].title).toBe('Вторая задача');
      expect(service.tasks()[1].title).toBe('Первая задача');
      expect(service.tasks()[1].id).toBe(firstTaskId);
    });
  });

  describe('Методы работы со ссылками', () => {
    it('должен добавлять ссылку к новой задаче', () => {
      service.currentLink.set('https://valid.com');
      service.addLinkToNewTask();

      expect(service.newTaskLinks()).toEqual(['https://valid.com']);
      expect(service.currentLink()).toBe('');
    });

    it('не должен добавлять пустую ссылку', () => {
      service.currentLink.set('');
      service.addLinkToNewTask();

      expect(service.newTaskLinks()).toEqual([]);
    });

    it('должен показывать alert при невалидном URL', () => {
      service.currentLink.set('invalid-url');
      service.addLinkToNewTask();

      expect(alertMessages.length).toBe(1);
      expect(service.newTaskLinks()).toEqual([]);
    });

    it('не должен валидировать URL если validateUrls отключен', () => {
      service.linkSettings.set({ ...service.linkSettings(), validateUrls: false });
      service.currentLink.set('invalid-url');
      service.addLinkToNewTask();

      expect(alertMessages.length).toBe(0);
      expect(service.newTaskLinks()).toEqual(['invalid-url']);
    });

    it('должен показывать alert при превышении лимита ссылок', () => {
      for (let i = 0; i < 10; i++) {
        service.newTaskLinks.update(links => [...links, `https://link${i}.com`]);
      }

      service.currentLink.set('https://extra.com');
      service.addLinkToNewTask();

      expect(alertMessages.length).toBe(1);
      expect(service.newTaskLinks().length).toBe(10);
    });

    it('должен удалять ссылку по индексу', () => {
      service.newTaskLinks.set(['link1', 'link2', 'link3']);

      service.removeLinkFromNewTask(1);

      expect(service.newTaskLinks()).toEqual(['link1', 'link3']);
    });
  });

  describe('Методы редактирования задач', () => {
    let testTask: Task;

    beforeEach(() => {
      testTask = {
        id: 123,
        title: 'Тестовая задача',
        links: ['https://original.com'],
        completed: false,
        createdAt: new Date()
      };

      service.tasks.set([testTask]);
    });

    it('должен начинать редактирование задачи', () => {
      service.startEdit(testTask);

      expect(service.editingTask()).toEqual(testTask);
      expect(service.editTitle()).toBe('Тестовая задача');
      expect(service.editLinks()).toEqual(['https://original.com']);
      expect(service.currentEditLink()).toBe('');
    });

    it('должен сохранять изменения задачи', () => {
      service.startEdit(testTask);
      service.editTitle.set('Измененная задача');
      service.editLinks.set(['https://new.com']);

      service.saveEdit();

      expect(service.tasks()[0].title).toBe('Измененная задача');
      expect(service.tasks()[0].links).toEqual(['https://new.com']);
      expect(service.editingTask()).toBeNull();
    });

    it('не должен сохранять пустой заголовок', () => {
      service.startEdit(testTask);
      service.editTitle.set('');

      service.saveEdit();

      expect(service.tasks()[0].title).toBe('Тестовая задача');
    });

    it('должен отменять редактирование', () => {
      service.startEdit(testTask);
      service.editTitle.set('Несохраненное изменение');

      service.cancelEdit();

      expect(service.editingTask()).toBeNull();
      expect(service.editTitle()).toBe('');
      expect(service.editLinks()).toEqual([]);
      expect(service.currentEditLink()).toBe('');
    });
  });

  describe('Управление состоянием задач', () => {
    let tasks: Task[];

    beforeEach(() => {
      tasks = [
        { id: 1, title: 'Задача 1', links: [], completed: false, createdAt: new Date() },
        { id: 2, title: 'Задача 2', links: [], completed: false, createdAt: new Date() },
        { id: 3, title: 'Задача 3', links: [], completed: false, createdAt: new Date() }
      ];

      service.tasks.set(tasks);
    });

    it('должен переключать статус выполнения задачи', () => {
      expect(service.tasks()[0].completed).toBe(false);

      service.toggleComplete(1);

      expect(service.tasks()[0].completed).toBe(true);

      service.toggleComplete(1);

      expect(service.tasks()[0].completed).toBe(false);
    });

    it('должен удалять задачу', () => {
      service.deleteTask(2);

      expect(service.tasks().length).toBe(2);
      expect(service.tasks()[0].id).toBe(1);
      expect(service.tasks()[1].id).toBe(3);
    });

    it('не должен удалять задачу без подтверждения', () => {
      confirmReturnValue = false;

      service.deleteTask(2);

      expect(service.tasks().length).toBe(3);
    });

    it('должен удалять все выполненные задачи', () => {
      service.toggleComplete(1);
      service.toggleComplete(2);

      service.clearCompleted();

      expect(service.tasks().length).toBe(1);
      expect(service.tasks()[0].id).toBe(3);
      expect(service.tasks()[0].completed).toBe(false);
    });

    it('не должен удалять выполненные задачи без подтверждения', () => {
      service.toggleComplete(1);
      confirmReturnValue = false;

      service.clearCompleted();

      expect(service.tasks().length).toBe(3);
    });
  });

  describe('Вспомогательные методы', () => {
    describe('isValidUrl', () => {
      it('должен возвращать true для валидных HTTP URL', () => {
        expect(service.isValidUrl('http://example.com')).toBe(true);
        expect(service.isValidUrl('http://www.example.com/path?query=1')).toBe(true);
      });

      it('должен возвращать true для валидных HTTPS URL', () => {
        expect(service.isValidUrl('https://example.com')).toBe(true);
        expect(service.isValidUrl('https://sub.example.com:8080/path')).toBe(true);
      });

      it('должен возвращать false для невалидных URL', () => {
        expect(service.isValidUrl('not-a-url')).toBe(false);
        expect(service.isValidUrl('ftp://example.com')).toBe(false);
        expect(service.isValidUrl('mailto:test@example.com')).toBe(false);
        expect(service.isValidUrl('')).toBe(false);
      });
    });

    describe('getDomain', () => {
      it('должен извлекать домен из URL', () => {
        expect(service.getDomain('https://example.com')).toBe('example.com');
        expect(service.getDomain('https://www.example.com')).toBe('example.com');
        expect(service.getDomain('http://sub.domain.example.com/path')).toBe('sub.domain.example.com');
        expect(service.getDomain('https://example.com:8080')).toBe('example.com');
      });

      it('должен возвращать исходную строку для невалидного URL', () => {
        expect(service.getDomain('invalid-url')).toBe('invalid-url');
        expect(service.getDomain('')).toBe('');
      });
    });

    describe('getFaviconUrl', () => {
      it('должен возвращать URL фавиконки для валидного домена', () => {
        const result = service.getFaviconUrl('https://example.com');
        expect(result).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=32');
      });

      it('должен возвращать дефолтную иконку для невалидного URL', () => {
        const result = service.getFaviconUrl('invalid-url');
        expect(result).toBe('assets/link-icon.png');
      });
    });
  });

  describe('Вычисляемые свойства', () => {
    beforeEach(() => {
      const tasks: Task[] = [
        { id: 1, title: 'Задача 1', links: ['link1', 'link2'], completed: true, createdAt: new Date() },
        { id: 2, title: 'Задача 2', links: ['link3'], completed: false, createdAt: new Date() },
        { id: 3, title: 'Задача 3', links: [], completed: false, createdAt: new Date() }
      ];

      service.tasks.set(tasks);
    });

    it('должен вычислять общее количество задач', () => {
      expect(service.tasksCount()).toBe(3);
    });

    it('должен вычислять количество выполненных задач', () => {
      expect(service.completedCount()).toBe(1);
    });

    it('должен вычислять количество невыполненных задач', () => {
      expect(service.pendingCount()).toBe(2);
    });

    it('должен вычислять общее количество ссылок', () => {
      expect(service.totalLinksCount()).toBe(3);
    });

    it('должен обновлять вычисляемые свойства при изменении задач', () => {
      service.newTaskTitle.set('Новая задача');
      service.newTaskLinks.set(['link4', 'link5']);
      service.addTask();

      expect(service.tasksCount()).toBe(4);
      expect(service.completedCount()).toBe(1);
      expect(service.pendingCount()).toBe(3);
      expect(service.totalLinksCount()).toBe(5);
    });
  });

  describe('Сортировка задач', () => {
    it('должен сортировать задачи: невыполненные первыми, затем по убыванию id', () => {
      const tasks: Task[] = [
        { id: 1, title: 'Старая невыполненная', links: [], completed: false, createdAt: new Date() },
        { id: 5, title: 'Новая выполненная', links: [], completed: true, createdAt: new Date() },
        { id: 3, title: 'Средняя выполненная', links: [], completed: true, createdAt: new Date() },
        { id: 10, title: 'Самая новая невыполненная', links: [], completed: false, createdAt: new Date() }
      ];

      service.tasks.set(tasks);
      service['sortTasks']();
      const sortedTasks = service.tasks();

      expect(sortedTasks[0].id).toBe(10);
      expect(sortedTasks[0].completed).toBe(false);
      expect(sortedTasks[1].id).toBe(1);
      expect(sortedTasks[1].completed).toBe(false);
      expect(sortedTasks[2].id).toBe(5);
      expect(sortedTasks[2].completed).toBe(true);
      expect(sortedTasks[3].id).toBe(3);
      expect(sortedTasks[3].completed).toBe(true);
    });
  });

  describe('Работа с localStorage', () => {
    it('должен сохранять задачи в localStorage при добавлении', () => {
      service.newTaskTitle.set('Тестовая задача');
      service.addTask();

      expect(mockLocalStorage['todo-tasks']).toBeDefined();
      const savedData = JSON.parse(mockLocalStorage['todo-tasks']);
      expect(savedData.length).toBe(1);
      expect(savedData[0].title).toBe('Тестовая задача');
    });

    it('должен сохранять изменения в localStorage при редактировании', () => {
      const task: Task = {
        id: 999,
        title: 'Исходная задача',
        links: [],
        completed: false,
        createdAt: new Date()
      };

      service.tasks.set([task]);
      service.startEdit(task);
      service.editTitle.set('Измененная задача');
      service.saveEdit();

      const savedData = JSON.parse(mockLocalStorage['todo-tasks']);
      expect(savedData[0].title).toBe('Измененная задача');
    });

    it('должен сохранять изменения в localStorage при удалении', () => {
      const tasks: Task[] = [
        { id: 1, title: 'Задача 1', links: [], completed: false, createdAt: new Date() },
        { id: 2, title: 'Задача 2', links: [], completed: false, createdAt: new Date() }
      ];

      service.tasks.set(tasks);
      service.deleteTask(1);

      const savedData = JSON.parse(mockLocalStorage['todo-tasks']);
      expect(savedData.length).toBe(1);
      expect(savedData[0].id).toBe(2);
    });
  });

  describe('Методы редактирования ссылок', () => {
    let testTask: Task;

    beforeEach(() => {
      testTask = {
        id: 123,
        title: 'Тестовая задача',
        links: ['https://original.com'],
        completed: false,
        createdAt: new Date()
      };

      service.tasks.set([testTask]);
      service.startEdit(testTask);
    });

    describe('addLinkToEditTask', () => {
      it('должен добавлять ссылку к редактируемой задаче', () => {
        service.currentEditLink.set('https://new-link.com');
        service.addLinkToEditTask();

        expect(service.editLinks()).toEqual(['https://original.com', 'https://new-link.com']);
        expect(service.currentEditLink()).toBe('');
      });

      it('не должен добавлять пустую ссылку', () => {
        service.currentEditLink.set('');
        service.addLinkToEditTask();

        expect(service.editLinks()).toEqual(['https://original.com']);
      });

      it('должен показывать alert при невалидном URL', () => {
        service.currentEditLink.set('invalid-url');
        service.addLinkToEditTask();

        expect(alertMessages.length).toBe(1);
        expect(alertMessages[0]).toBe('Пожалуйста, введите корректный URL');
        expect(service.editLinks()).toEqual(['https://original.com']);
      });

      it('не должен валидировать URL если validateUrls отключен', () => {
        service.linkSettings.set({ ...service.linkSettings(), validateUrls: false });
        service.currentEditLink.set('invalid-url');
        service.addLinkToEditTask();

        expect(alertMessages.length).toBe(0);
        expect(service.editLinks()).toEqual(['https://original.com', 'invalid-url']);
      });

      it('должен показывать alert при превышении лимита ссылок', () => {
        const maxLinks = service.linkSettings().maxLinksPerTask;
        const existingLinks = [];
        for (let i = 0; i < maxLinks; i++) {
          existingLinks.push(`https://link${i}.com`);
        }

        service.editLinks.set(existingLinks);
        service.currentEditLink.set('https://extra.com');
        service.addLinkToEditTask();

        expect(alertMessages.length).toBe(1);
        expect(alertMessages[0]).toBe(`Максимальное количество ссылок: ${maxLinks}`);
        expect(service.editLinks().length).toBe(maxLinks);
      });

      it('должен добавлять валидные HTTP ссылки', () => {
        service.currentEditLink.set('http://example.com');
        service.addLinkToEditTask();

        expect(service.editLinks()).toEqual(['https://original.com', 'http://example.com']);
        expect(service.currentEditLink()).toBe('');
      });

      it('должен добавлять валидные HTTPS ссылки', () => {
        service.currentEditLink.set('https://secure.example.com');
        service.addLinkToEditTask();

        expect(service.editLinks()).toEqual(['https://original.com', 'https://secure.example.com']);
        expect(service.currentEditLink()).toBe('');
      });

      it('должен сохранять порядок ссылок при добавлении', () => {
        service.editLinks.set(['link1', 'link2']);
        service.currentEditLink.set('http://link3.com');
        service.addLinkToEditTask();

        expect(service.editLinks()).toEqual(['link1', 'link2', 'http://link3.com']);
      });
    });

    describe('removeLinkFromEditTask', () => {
      it('должен удалять ссылку по индексу', () => {
        service.editLinks.set(['link1', 'link2', 'link3']);

        service.removeLinkFromEditTask(1);

        expect(service.editLinks()).toEqual(['link1', 'link3']);
      });

      it('должен корректно удалять первую ссылку', () => {
        service.editLinks.set(['first', 'second', 'third']);

        service.removeLinkFromEditTask(0);

        expect(service.editLinks()).toEqual(['second', 'third']);
      });

      it('должен корректно удалять последнюю ссылку', () => {
        service.editLinks.set(['first', 'second', 'last']);

        service.removeLinkFromEditTask(2);

        expect(service.editLinks()).toEqual(['first', 'second']);
      });

      it('не должен падать при удалении несуществующего индекса', () => {
        service.editLinks.set(['link1', 'link2']);

        expect(() => {
          service.removeLinkFromEditTask(5);
        }).not.toThrow();

        expect(service.editLinks()).toEqual(['link1', 'link2']);
      });

      it('должен корректно работать с пустым списком ссылок', () => {
        service.editLinks.set([]);

        expect(() => {
          service.removeLinkFromEditTask(0);
        }).not.toThrow();

        expect(service.editLinks()).toEqual([]);
      });
    });

    describe('Интеграция методов редактирования ссылок', () => {
      it('должен корректно добавлять и удалять ссылки', () => {
        expect(service.editLinks()).toEqual(['https://original.com']);

        service.currentEditLink.set('https://added.com');
        service.addLinkToEditTask();
        expect(service.editLinks()).toEqual(['https://original.com', 'https://added.com']);

        service.removeLinkFromEditTask(0);
        expect(service.editLinks()).toEqual(['https://added.com']);

        service.currentEditLink.set('https://another.com');
        service.addLinkToEditTask();
        expect(service.editLinks()).toEqual(['https://added.com', 'https://another.com']);
      });

      it('должен сохранять изменения ссылок при сохранении задачи', () => {
        service.currentEditLink.set('https://new.com');
        service.addLinkToEditTask();
        service.removeLinkFromEditTask(0);
        service.saveEdit();

        expect(service.tasks()[0].links).toEqual(['https://new.com']);
      });
    });
  });
});

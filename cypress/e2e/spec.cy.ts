describe('To-Do List Pro - Полные E2E тесты', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('http://localhost:4200');
    cy.get('h1').should('contain', 'To-Do List Pro');
  });

  describe('1. Основные функции приложения', () => {
    it('1.1. Приложение загружается корректно', () => {
      cy.get('h1').should('contain', 'To-Do List Pro');
      cy.contains('Список задач пуст').should('be.visible');
      cy.get('#title').should('be.visible');
      cy.get('.btn-primary').should('be.disabled');
    });

    it('1.2. Добавление простой задачи', () => {
      const taskTitle = 'Купить продукты';

      cy.get('#title').type(taskTitle);
      cy.get('.btn-primary').should('be.enabled').click();

      cy.get('.task-item').should('have.length', 1);
      cy.get('.task-title').should('contain', taskTitle);
      cy.get('.stat-value').first().should('contain', '1');
      cy.get('.task-status').should('contain', 'В процессе');
    });

    it('1.3. Добавление задачи со ссылкой', () => {
      cy.get('#title').type('Изучить Angular');
      cy.get('.link-input').type('https://angular.io');
      cy.get('.btn-secondary').click();

      cy.get('.links-preview').should('be.visible');
      cy.get('.link-url').should('contain', 'angular.io');
      cy.get('.link-counter').should('contain', 'Ссылок: 1/10');

      cy.get('.btn-primary').click();

      cy.get('.task-badge').should('contain', '1');
      cy.get('.task-link').should('contain', 'angular.io');
      cy.get('.link-favicon').should('exist');
    });

    it('1.4. Добавление задачи с несколькими ссылками', () => {
      cy.get('#title').type('Изучить веб-разработку');

      const links = [
        'https://angular.io',
        'https://react.dev',
        'https://vuejs.org'
      ];

      links.forEach(link => {
        cy.get('.link-input').type(link);
        cy.get('.btn-secondary').click();
      });

      cy.get('.links-list .link-item').should('have.length', 3);
      cy.get('.btn-primary').click();

      cy.get('.task-badge').should('contain', '3');
      cy.get('.links-grid .task-link-item').should('have.length', 3);
    });

    it('1.5. Валидация URL при добавлении ссылок', () => {
      cy.get('#title').type('Задача с невалидной ссылкой');
      cy.get('.link-input').type('неправильный-url');

      const stub = cy.stub();
      cy.on('window:alert', stub);

      cy.get('.btn-secondary').click().then(() => {
        expect(stub.getCall(0)).to.be.calledWith('Пожалуйста, введите корректный URL (начинается с http:// или https://)');
      });
    });

    it('1.6. Удаление ссылки из превью при создании', () => {
      cy.get('#title').type('Тест удаления ссылки');
      cy.get('.link-input').type('https://example.com');
      cy.get('.btn-secondary').click();

      cy.get('.links-list .link-item').should('have.length', 1);
      cy.get('.btn-link-remove').click();
      cy.get('.links-preview').should('not.exist');
    });
  });

  describe('2. Управление задачами', () => {
    beforeEach(() => {
      cy.get('#title').type('Задача 1');
      cy.get('.btn-primary').click();

      cy.get('#title').type('Задача 2 со ссылкой');
      cy.get('.link-input').type('https://google.com');
      cy.get('.btn-secondary').click();
      cy.get('.btn-primary').click();

      cy.get('#title').type('Задача 3');
      cy.get('.btn-primary').click();
    });

    it('2.1. Отметка задачи как выполненной', () => {
      cy.get('.task-checkbox').first().check();

      cy.get('.task-item').first().should('have.class', 'completed');
      cy.get('.task-status').first().should('contain', 'Выполнено');
      cy.get('.stat-item:nth-child(2) .stat-value').should('contain', '1');
      cy.get('.stat-item:nth-child(3) .stat-value').should('contain', '2');
    });

    it('2.2. Редактирование задачи', () => {
      cy.get('.btn-edit').first().click();
      cy.get('.edit-form').should('be.visible');

      cy.get('.edit-form .form-control').first().clear().type('Отредактированная задача');

      cy.get('.edit-form .link-input').type('https://github.com');
      cy.get('.edit-form .btn-secondary').click();

      cy.get('.btn-success').click();

      cy.get('.task-title').first().should('contain', 'Отредактированная задача');
      cy.get('.task-badge').first().should('contain', '1');
      cy.get('.task-link').should('contain', 'github.com');
    });

    it('2.3. Редактирование - удаление ссылки', () => {
      cy.get('.btn-edit').eq(1).click();

      cy.get('.edit-form .btn-link-remove').click();
      cy.get('.edit-form .links-list').should('not.exist');

      cy.get('.btn-success').click();

      cy.get('.task-item').eq(1).within(() => {
        cy.get('.task-badge').should('not.exist');
      });
    });

    it('2.4. Отмена редактирования', () => {
      const originalTitle = 'Задача 2 со ссылкой';

      cy.get('.btn-edit').eq(1).click();
      cy.get('.edit-form .form-control').first().clear().type('Новое название');
      cy.get('.btn-warning').click();

      cy.get('.edit-form').should('not.exist');
      cy.get('.task-title').eq(1).should('contain', originalTitle);
    });

    it('2.5. Удаление задачи', () => {
      cy.get('.task-item').should('have.length', 3);

      cy.on('window:confirm', () => true);

      cy.get('.btn-delete').first().click();

      cy.get('.task-item').should('have.length', 2);
      cy.get('.stat-item:first-child .stat-value').should('contain', '2');
    });

    it('2.6. Отмена удаления задачи', () => {
      cy.on('window:confirm', () => false);

      cy.get('.btn-delete').first().click();
      cy.get('.task-item').should('have.length', 3);
    });
  });

  describe('3. Статистика и массовые операции', () => {
    beforeEach(() => {
      cy.get('#title').type('Задача 1');
      cy.get('.link-input').type('https://link1.com');
      cy.get('.btn-secondary').click();
      cy.get('.btn-primary').click();

      cy.get('#title').type('Задача 2');
      cy.get('.link-input').type('https://link2.com');
      cy.get('.btn-secondary').click();
      cy.get('.link-input').type('https://link3.com');
      cy.get('.btn-secondary').click();
      cy.get('.btn-primary').click();

      cy.get('#title').type('Задача 3');
      cy.get('.btn-primary').click();

      cy.get('.task-checkbox').first().check();
    });

    it('3.1. Корректное отображение статистики', () => {
      cy.get('.stats-grid').should('exist');

      cy.get('.stat-item:nth-child(1) .stat-value').should('contain', '3');
      cy.get('.stat-item:nth-child(2) .stat-value').should('contain', '1');
      cy.get('.stat-item:nth-child(3) .stat-value').should('contain', '2');
      cy.get('.stat-item:nth-child(4) .stat-value').should('contain', '3');
    });

    it('3.2. Очистка выполненных задач', () => {
      cy.get('.btn-clear').should('exist').click();

      cy.on('window:confirm', () => true);

      cy.get('.task-item').should('have.length', 2);
      cy.get('.btn-clear').should('not.exist');
      cy.get('.stat-item:nth-child(2) .stat-value').should('contain', '0');
    });

    it('3.3. Отмена очистки выполненных задач', () => {
      cy.on('window:confirm', () => false);

      cy.get('.btn-clear').click();
      cy.get('.task-item').should('have.length', 3);
    });

    it('3.4. Кнопка очистки скрывается когда нет выполненных задач', () => {
      cy.get('.task-checkbox:checked').uncheck();
      cy.get('.btn-clear').should('not.exist');

      cy.get('.task-checkbox').first().check();
      cy.get('.btn-clear').should('exist');
    });
  });

  describe('4. Тема и внешний вид', () => {
    it('4.1. Переключение темы', () => {
      cy.get('body').should('not.have.class', 'dark-theme');
      cy.get('.btn-theme').should('contain', '🌙 Тёмная тема');

      cy.get('.btn-theme').click();
      cy.get('body').should('have.class', 'dark-theme');
      cy.get('.btn-theme').should('contain', '☀️ Светлая тема');

      cy.get('.btn-theme').click();
      cy.get('body').should('not.have.class', 'dark-theme');
    });

    it('4.2. Сохранение темы после перезагрузки', () => {
      cy.get('.btn-theme').click();
      cy.get('body').should('have.class', 'dark-theme');

      cy.reload();

      cy.get('body').should('have.class', 'dark-theme');
      cy.get('.btn-theme').should('contain', '☀️ Светлая тема');
    });

    it('4.3. Иконки ссылок отображаются/скрываются', () => {
      cy.get('#title').type('Задача с иконкой');
      cy.get('.link-input').type('https://angular.io');
      cy.get('.btn-secondary').click();
      cy.get('.btn-primary').click();

      cy.get('.link-favicon').should('be.visible');
    });
  });

  describe('5. Сохранение данных', () => {
    it('5.1. Задачи сохраняются после перезагрузки', () => {
      cy.get('#title').type('Сохраненная задача');
      cy.get('.btn-primary').click();

      cy.reload();

      cy.get('.task-item').should('have.length', 1);
      cy.get('.task-title').should('contain', 'Сохраненная задача');
    });

    it('5.2. Изменения в задачах сохраняются', () => {
      cy.get('#title').type('Задача для изменений');
      cy.get('.btn-primary').click();

      cy.get('.task-checkbox').check();

      cy.reload();

      cy.get('.task-item').should('have.class', 'completed');
      cy.get('.task-status').should('contain', 'Выполнено');
    });

    it('5.3. Редактирование сохраняется после перезагрузки', () => {
      cy.get('#title').type('Исходная задача');
      cy.get('.btn-primary').click();

      cy.get('.btn-edit').click();

      cy.get('.edit-form .form-control').first().clear().type('Отредактированная');
      cy.get('.btn-success').click();

      cy.reload();

      cy.get('.task-title').should('contain', 'Отредактированная');
    });
  });

  describe('6. Граничные случаи и валидация', () => {
    it('6.1. Максимальное количество ссылок', () => {
      cy.get('#title').type('Задача с максимальным количеством ссылок');

      for (let i = 1; i <= 10; i++) {
        cy.get('.link-input').type(`https://example${i}.com`);
        cy.get('.btn-secondary').click();
      }

      cy.get('.link-counter').should('contain', 'Ссылок: 10/10');

      cy.get('.link-input').type('https://example11.com');

      const stub = cy.stub();
      cy.on('window:alert', stub);

      cy.get('.btn-secondary').click().then(() => {
        expect(stub.getCall(0)).to.be.calledWith('Максимальное количество ссылок: 10');
      });
    });

    it('6.2. Пустая задача не добавляется', () => {
      cy.get('#title').type('   ');
      cy.get('.btn-primary').should('be.disabled');

      cy.get('#title').type('   test   ');
      cy.get('.btn-primary').should('be.enabled');

      cy.get('#title').clear();
      cy.get('.btn-primary').should('be.disabled');
    });

    it('6.3. Длинный текст задачи', () => {
      const longText = 'Очень длинное название задачи, которое должно корректно обрабатываться приложением без каких-либо проблем или обрезаний текста. '.repeat(5);

      cy.get('#title').type(longText);
      cy.get('.btn-primary').click();

      cy.get('.task-title').should('contain', longText.substring(0, 100));
    });

    it('6.4. Специальные символы в задаче', () => {
      const specialTitle = 'Задача с спецсимволами: !@#$%^&*()_+{}[]|;:,.<>?`~';

      cy.get('#title').type(specialTitle);
      cy.get('.btn-primary').click();

      cy.get('.task-title').should('contain', specialTitle);
    });

    it('6.5. Несколько задач подряд', () => {
      const tasks = ['Задача 1', 'Задача 2', 'Задача 3', 'Задача 4', 'Задача 5'];

      tasks.forEach(task => {
        cy.get('#title').type(task);
        cy.get('.btn-primary').click();
      });

      cy.get('.task-item').should('have.length', tasks.length);
      cy.get('.stat-value').first().should('contain', tasks.length.toString());
    });
  });

  describe('7. Клавиатурные сокращения', () => {
    it('7.1. Добавление задачи по Enter', () => {
      cy.get('#title').type('Задача по Enter{enter}');
      cy.get('.task-item').should('have.length', 1);
      cy.get('.task-title').should('contain', 'Задача по Enter');
    });

    it('7.2. Добавление ссылки по Enter', () => {
      cy.get('#title').type('Задача');
      cy.get('.link-input').type('https://enter-test.com{enter}');

      cy.get('.links-preview').should('exist');
      cy.get('.link-url').should('contain', 'enter-test.com');
    });

    it('7.3. Сохранение редактирования по Enter', () => {
      cy.get('#title').type('Исходная');
      cy.get('.btn-primary').click();

      cy.get('.btn-edit').click();

      cy.get('.edit-form .form-control').first().clear().type('Измененная{enter}');

      cy.get('.edit-form').should('not.exist');
      cy.get('.task-title').should('contain', 'Измененная');
    });
  });

  describe('8. Адаптивность', () => {
    it('8.1. Отображение на мобильном экране', () => {
      cy.viewport('iphone-8');

      cy.get('h1').should('be.visible');
      cy.get('#title').should('be.visible');
      cy.get('.btn-primary').should('be.visible');

      cy.screenshot('mobile-view');
    });

    it('8.2. Отображение на планшете', () => {
      cy.viewport('ipad-2');

      cy.get('.container').should('be.visible');
      cy.get('.task-form').should('be.visible');
      cy.get('.tasks-container').should('be.visible');

      cy.screenshot('tablet-view');
    });

    it('8.3. Отображение на десктопе', () => {
      cy.viewport(1920, 1080);

      cy.get('.container').should('be.visible');
      cy.get('.tasks-container').should('be.visible');

      cy.screenshot('desktop-view');
    });
  });
});

# Портал

Витрина дверей и фурнитуры с каталогом, избранным, сравнением и расчётом корзины. Данные корзины и списков хранятся в браузере. Корзина формирует расчёт для скачивания.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/77de26cd-53aa-439f-8c35-822379d36acb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
cd screenshot-precision-main
npm i
npm run dev
```

## Заявки и публикация

Пробные контакты, тарифы и каталог отмечены на витрине как примеры. Подтверждённые контакты и тарифы задаются в `src/lib/store-config.ts`, ассортимент и наличие — в `src/data/catalog.ts`.

- `ORDER_DEMO_ENABLED=true` включает тестовые заявки, если рабочий получатель ещё не настроен. Тестовый режим проверяет форму и возвращает номер для демонстрации без сохранения или отправки.
- `ORDER_WEBHOOK_URL` задаёт HTTPS-адрес, который принимает JSON и подтверждает приём ответом 2xx. Если задан `ORDER_WEBHOOK_SECRET`, сервер отправит его как Bearer-токен. Храните оба значения в настройках окружения сервера.
- Получатель должен сохранять идентификатор заявки и обрабатывать повторный `Idempotency-Key` как ту же заявку. Подтверждение в интерфейсе означает, что получатель принял заявку для обработки.
- Для сборки Worker для Sites выполните `npm run build`, затем `node scripts/package-sites.mjs`. Точка входа — `dist/server/index.js`.

## Вход через Supabase Auth

Страница `/login` использует вход по электронной почте и паролю. Включите Email в настройках Authentication проекта Supabase и создайте подтверждённого пользователя для проверки.

- `SUPABASE_URL` — HTTPS-адрес проекта Supabase.
- `SUPABASE_PUBLISHABLE_KEY` — публичный ключ `sb_publishable_…` или устаревший ключ `anon`.

Задайте значения в окружении Worker в Sites или перед локальным запуском. При пустых настройках страница сообщает, что вход ещё не настроен. Сервер отдаёт браузеру только проверенную публичную конфигурацию. Ключи `service_role` и `sb_secret_…` не подходят.

Страница `/register` создаёт аккаунт по почте и паролю. В Supabase Auth → URL Configuration добавьте точный URL страницы входа (`https://gapy-portal.leftshore4.chatgpt.site/login`) в Redirect URLs. Для локальной проверки добавьте URL локальной страницы входа. Если включено подтверждение адреса, Supabase отправляет письмо со ссылкой. Ссылка открывает страницу входа и завершает PKCE в том браузере, где началась регистрация.

# Architecture review

> Аналіз виконано до реалізації change request. Для кожної проблеми вказано конкретний код, практичний ризик і напрям виправлення.

| Principle| Evidence (file:line) | Practical risk | Fix |
| --------- | --------- | --------- | -------- |
| **Information hiding** | `src/checkout/CheckoutController.ts:3,22-28` — Checkout імпортує `StripePayload` з `payments/internal` і сам формує Stripe-specific payload | Checkout залежить від внутрішньої структури Stripe. При додаванні другого provider доведеться змінювати Checkout, хоча сам checkout-сценарій не змінився | Створити provider-neutral контракт Payments. Формування Stripe payload перенести всередину Payments |
| **Dependency direction** | `src/orders/OrderService.ts:3-5` — Orders напряму імпортує `StripeClient`, `StripePayload` та mapping із provider response | Orders залежить від конкретної реалізації Payments. Заміна або додавання provider поширить зміни в Orders  | Orders має працювати тільки з публічним контрактом Payments, а конкретний Stripe adapter залишити всередині Payments  |
| **High cohesion** | `src/orders/mapPaymentStatus.ts:1-6`, `src/notifications/mapPaymentStatus.ts:1-6`, `src/reports/mapPaymentStatus.ts:1-6` — однакова логіка mapping дублюється у трьох модулях | Одна бізнес-правила існує в декількох місцях. При появі `processing` або нового provider один модуль можна оновити, а інший забути | Перемістити нормалізацію provider status у Payments і зробити Payments єдиним власником цієї логіки |
| **Explicit contracts** | `src/payments/internal/StripeClient.ts:4-14` — зовнішні модулі використовують `StripePayload` і `StripeResponse` замість стабільного системного контракту | Provider-specific поля `state`, `charge_id` та структура payload можуть поширитися по всій системі | Визначити публічний Payments API зі стабільними статусами `paid`, `processing`, `failed` |
| **Ownership** | `src/orders/OrderService.ts:15-25` — Orders напряму читає та змінює `database.stock`| Inventory не контролює власний invariant `available >= 0`. Інші модулі можуть змінювати залишки без правил Inventory | Додати в Inventory операцію `reserve`, яка сама перевіряє залишок і виконує атомарну логіку резервування |
| **Dependency direction / Ownership** | `src/payments/internal/StripeClient.ts:1-2,20` — Payments імпортує `orders/internal/orderMutations.ts` і сам змінює стан Orders | Payments залежить від внутрішньої реалізації Orders, через що виникає цикл Orders ↔ Payments і складно локально змінювати payment flow | Payments повинно повертати результат платежу, а Orders має самостійно оновлювати свій стан після отримання результату |
| **Local reasoning** | `src/shared/calculateTotal.ts:1,11-22` — `calculateTotal` читає глобальний `runtimeConfig`, змінює `lines` і пише в `auditLog` | Щоб зрозуміти результат функції, потрібно знати глобальний стан і побічні ефекти. Це ускладнює тестування та майбутні зміни tax/discount rules | Передавати tax і discount inputs явно, не змінювати `lines` і прибрати audit logging із чистого розрахунку |
| **Design for change** | `src/checkout/CheckoutController.ts:23-28` та `src/orders/OrderService.ts:29-30` — Stripe-specific структура проходить через Checkout → Orders | Додавання другого payment provider вимагатиме змін у кількох модулях замість зміни лише Payments | Використати adapter всередині Payments та єдиний provider-neutral API для consumers |
| **Information hiding** | `src/notifications/mapPaymentStatus.ts:1` і `src/reports/mapPaymentStatus.ts:1` — обидва модулі імпортують `payments/internal/StripeClient.ts` | Notifications і Reports знають про внутрішній Stripe API. Будь-яка зміна provider змусить змінювати ці модулі | Заборонити imports із `payments/internal` поза Payments |

## Change impact prediction (заповнити до реалізації change request)

**Requirement:**

Система повинна підтримати другий навчальний payment provider та нормалізований статус `processing`. Існуючий Checkout API та поведінка `paid` і `failed` повинні залишитися без змін. Provider-specific payload, response та status names не повинні виходити за межі Payments.

**Expected files:**

* `src/payments/` — новий provider-neutral контракт, нормалізація статусів та adapters.
* `src/payments/internal/StripeClient.ts` — перенесення Stripe-specific логіки всередину Payments.
* `src/payments/internal/` — новий adapter другого provider.
* `src/orders/OrderService.ts` — перехід на публічний Payments API.
* `src/orders/mapPaymentStatus.ts` — очікується видалення після перенесення mapping у Payments.
* `src/notifications/mapPaymentStatus.ts` — очікується видалення.
* `src/reports/mapPaymentStatus.ts` — очікується видалення.
* `src/checkout/CheckoutController.ts` — очікується зміна для використання provider-neutral Payments API.
* `src/inventory/StockRepository.ts` — для захисту ownership залишків.
* `src/shared/calculateTotal.ts` — для забезпечення детермінованого розрахунку.
* `tests/checkout.functional.test.ts` — розширення перевірок.
* нові unit/architecture tests — для status normalization, providers та architectural rules.

**Modules that should not change:**

* Публічний формат відповіді Checkout.
* Provider-specific код не повинен потрапити в `Notifications` та `Reports`.
* `database.ts` не повинен використовуватися зовнішніми модулями для обходу ownership Inventory.
* Поведінка існуючих сценаріїв `paid` і `failed` не повинна змінитися.

## Actual impact (заповнити після реалізації)

**Actual files changed:**

**Difference from prediction and explanation:**
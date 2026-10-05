# Decision log

Для кожної суттєвої зміни скопіюйте секцію нижче. Обсяг одного рішення: 80–120 слів.

## Decision N: коротка назва

**Problem:**

**Evidence:**

**Decision:**

**Why:**

**Alternative:**

**Why rejected:**

**Trade-off:**

**Verification:**

## Decision 1: Нормалізація payment status у Payments

**Problem:**
Однакова логіка перетворення Stripe status на системний status знаходиться в Orders, Notifications і Reports. Це створює дублювання та поширює знання про Stripe за межі Payments.

**Evidence:**
`src/orders/mapPaymentStatus.ts:1-6`, `src/notifications/mapPaymentStatus.ts:1-6` і `src/reports/mapPaymentStatus.ts:1-6` містять практично однаковий mapping `succeeded → paid`, `requires_action → pending`, інші значення → failed.

**Decision:**
Перенести normalization у Payments і зробити його єдиним власником provider-specific mapping. Додати стабільні системні статуси `paid`, `processing`, `failed`.

**Why:**
Новий provider зможе мати власні назви status, але consumers отримуватимуть однаковий результат.

**Alternative:**
Залишити mapping у кожному модулі.

**Why rejected:**
Дублювання продовжуватиме зростати.

**Trade-off:**
Payments стане відповідальнішим за status contract.

**Verification:**
Додати unit tests для `paid`, `processing`, `failed` та невідомого status.

## Decision 2: Provider-neutral public API Payments

**Problem:**
Checkout і Orders напряму залежать від `StripePayload`, `StripeResponse` та `StripeClient`, хоча ці типи є внутрішньою реалізацією Payments.

**Evidence:**
`src/checkout/CheckoutController.ts:3,22-28` імпортує `StripePayload`, а `src/orders/OrderService.ts:4,8,14,29` залежить від `StripeClient` і `StripePayload`.

**Decision:**
Створити публічний контракт Payments, який приймає provider-neutral дані для авторизації платежу та повертає нормалізований payment result. Stripe payload і response залишити всередині Payments.

**Why:**
Checkout і Orders не повинні змінюватися при додаванні нового provider.

**Alternative:**
Передавати `StripePayload` через Orders.

**Why rejected:**
Це зберігає coupling до Stripe.

**Trade-off:**
Потрібно додати adapter layer і трохи більше коду.

**Verification:**
Додати перевірку, що зовнішні модулі не імпортують `payments/internal`.

## Decision 2: Provider-neutral public API Payments

**Problem:**
Checkout і Orders напряму залежать від `StripePayload`, `StripeResponse` та `StripeClient`, хоча ці типи є внутрішньою реалізацією Payments.

**Evidence:**
`src/checkout/CheckoutController.ts:3,22-28` імпортує `StripePayload`, а `src/orders/OrderService.ts:4,8,14,29` залежить від `StripeClient` і `StripePayload`.

**Decision:**
Створити публічний контракт Payments, який приймає provider-neutral дані для авторизації платежу та повертає нормалізований payment result. Stripe payload і response залишити всередині Payments.

**Why:**
Checkout і Orders не повинні змінюватися при додаванні нового provider.

**Alternative:**
Передавати `StripePayload` через Orders.

**Why rejected:**
Це зберігає coupling до Stripe.

**Trade-off:**
Потрібно додати adapter layer і трохи більше коду.

**Verification:**
Додати перевірку, що зовнішні модулі не імпортують `payments/internal`.

## Decision 3: Inventory володіє залишками

**Problem:**
Orders напряму читає і змінює `database.stock`. Через це Inventory не контролює власний invariant `available >= 0`.

**Evidence:**
У `src/orders/OrderService.ts:15-25` Orders сам перевіряє `available`, а потім записує нове значення в `database.stock`.

**Decision:**
Перенести операцію резервування в Inventory. Створити операцію на кшталт `reserve(lines)`, яка спочатку перевіряє всі позиції, а потім змінює залишки тільки якщо весь запит може бути виконаний.

**Why:**
Правила залишків повинні належати Inventory, а Orders має знати тільки публічний результат операції.

**Alternative:**
Залишити прямий доступ Orders до `database.stock`.

**Why rejected:**
Це дозволяє обходити правила Inventory.

**Trade-off:**
Inventory API стане трохи складнішим, але ownership буде чітким.

**Verification:**
Додати тест, де одна з позицій відсутня, і перевірити, що жоден stock не змінився.

## Decision 4: Зробити calculateTotal чистою функцією

**Problem:**
`calculateTotal` залежить від глобального `runtimeConfig`, змінює вхідні `lines` і записує повідомлення в глобальний `auditLog`. Через це результат і поведінка функції залежать не тільки від її аргументів.

**Evidence:**
`src/shared/calculateTotal.ts:1,11-22` читає `runtimeConfig`, записує `line.lineTotal` та додає запис до `auditLog`.

**Decision:**
Передавати tax rate і discount явно, не змінювати вхідний масив та не виконувати logging усередині розрахунку.

**Why:**
Функцію можна буде перевірити лише за її inputs і результатом, що спрощує local reasoning та тестування.

**Alternative:**
Залишити глобальний config і mutation.

**Why rejected:**
Будь-яка зміна глобального стану може змінити результат тесту або іншої операції.

**Trade-off:**
Виклики функції стануть трохи довшими через явні параметри.

**Verification:**
Додати тести на незмінність `lines`, однаковий результат для однакових inputs і відсутність side effects.

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


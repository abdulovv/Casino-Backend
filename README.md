# 🎰 Pet Casino Backend

Учебный backend-проект казино на вымышленную валюту — звёзды ⭐  
Проект строится на микросервисной архитектуре и постепенно расширяется новыми игровыми механиками.

## 🚀 Что уже работает

- регистрация пользователя;
- вход и JWT-аутентификация;
- профиль текущего пользователя;
- кошелёк;
- инвентарь;
- получение списка кейсов;
- получение кейса по ID.

## 🧩 Микросервисы

- `user-service` — пользователи, кошелёк, инвентарь;
- `cases-service` — предметы, кейсы, награды;
- `gateway` — единая точка входа;
- `upgrade-service` — улучшение предметов;
- `crash-service` — игровая механика Crash.

Сейчас активно разрабатываются `user-service` и `cases-service`.

## 🛠 Стек

- Java 21+
- Spring Boot 4
- Spring Security
- JWT + RSA
- Spring Data JPA
- PostgreSQL
- Flyway
- Maven
- Docker
- Kafka и Redis — позже

## 🗂 Основная модель

```text
User → Wallet
User → InventoryItem → itemId

GameCase ← CaseItem → Item
```

`Item` — общий тип предмета.  
`InventoryItem` — конкретный экземпляр предмета у игрока.  
`CaseItem` — связь предмета с кейсом и его шанс выпадения.

## 🔗 Текущие API

```http
POST /api/auth/register
POST /api/auth/login

GET  /api/users/me
GET  /api/wallet
GET  /api/inventory

GET  /api/cases
GET  /api/cases/{id}
```

## 📌 Ближайшая задача

Добавить в ответ `GET /api/cases/{id}` список возможных наград кейса:

```json
{
  "id": 1,
  "name": "Starter Case",
  "price": 100,
  "items": [
    {
      "itemId": 10,
      "name": "Нож",
      "price": 500,
      "weight": 5
    }
  ]
}
```

После этого:

1. добавить тестовые данные через Flyway;
2. реализовать открытие кейса;
3. списывать звёзды с кошелька;
4. добавлять выпавший предмет в инвентарь;
5. подключить API Gateway;
6. перейти к frontend.

---

Проект создаётся в учебных целях, чтобы разобраться в Spring Boot, безопасности, базах данных и взаимодействии микросервисов.

# Chappy

Chappy är en **fullstack chattapplikation** där användare kan registrera sig, logga in, skicka privata meddelanden och chatta i öppna eller privata kanaler.  
Applikationen är byggd med **React**, **TypeScript**, **Express** och **AWS DynamoDB**, och använder **JWT-token** för autentisering.

---

## Base URL
`http://localhost:3000`

---

## Endpoints

| Resurs | Beskrivning |
| ------- | ------------ |
| `/api/users` | Hanterar registrering, inloggning och gästanvändare |
| `/api/chats` | Skickar och hämtar privata meddelanden mellan användare |
| `/api/channels` | Hanterar chattkanaler (öppna och låsta) samt kanalmeddelanden |

---

## Hur du använder User-endpoints

| Metod | Endpoint | Beskrivning |
| ------ | ---------- | ------------ |
| `GET` | `/api/users/all` | Hämta alla användare (för inloggade och gäster) |
| `POST` | `/api/users/register` | Registrera en ny användare |
| `POST` | `/api/users/login` | Logga in som användare |
| `POST` | `/api/users/guest` | Logga in som gäst |

---

### Exempel – Registrera användare

**Request**
POST http://localhost:10000/api/users/register

**Body**
```json
{
  "name": "Mikaela",
  "email": "mikaela@example.com",
  "password": "hemligt123"
}

Response
{
  "message": "Användare skapad!"
}
```

### Exempel – Logga in användare

**Request**
POST http://localhost:10000/api/users/login

**Body**
```json
{
  "email": "mikaela@example.com",
  "password": "hemligt123"
}
Response
{
  "token": "jwt-token-här",
  "name": "Mikaela",
  "userId": "USER#1234",
  "role": "user"
}
```

### Exempel – Logga in gäst

**Request**
POST http://localhost:10000/api/users/guest

**Body**
```json
{
  "name": "Gäst Användare"
}

Response
{
  "token": "jwt-token-här",
  "name": "Gäst Användare",
  "userId": "guest-1731254000000",
  "role": "guest"
}

```

### Exempel – Hämta alla användare

**Request**
GET http://localhost:10000/api/users/all

**Headers**
Authorization: Bearer <jwt-token>

Response
```json
[
  {
    "PK": "USER#1",
    "name": "Mikaela",
    "email": "mikaela@example.com"
  },
  {
    "PK": "USER#2",
    "name": "Anna",
    "email": "anna@example.com"
  }
]

```
---
## Hur du använder Chat-endpoints

| Metod | Endpoint | Beskrivning |
| ------ | ---------- | ------------ |
| `GET` | `/api/chats/messages` | Hämtar alla privata meddelanden för den inloggade användaren |
| `POST` | `/api/chats/messages` | Skickar ett privat meddelande till en annan användare |

### Exempel – Skicka meddelande

**Request**  
POST http://localhost:10000/api/chats/messages  

**Body**
```json
{
  "receiverId": "USER#2",
  "text": "Hej, hur mår du?"
}

Response
{
  "success": true,
  "message": {
    "senderId": "USER#1",
    "receiverId": "USER#2",
    "text": "Hej, hur mår du?",
    "timestamp": 1731265000000
  }
}
```

### Exempel – Hämta meddelanden

**Request**
GET http://localhost:10000/api/chats/messages

**Headers**
Authorization: Bearer <jwt-token>

**Response**
```json
[
  {
    "senderId": "USER#2",
    "receiverId": "USER#1",
    "text": "Hej!",
    "timestamp": 1731264900000
  },
  {
    "senderId": "USER#1",
    "receiverId": "USER#2",
    "text": "Hej, hur mår du?",
    "timestamp": 1731265000000
  }
]
```
---

## Installation & körning lokalt

git clone https://github.com/mickan10/chappy.git

cd chappy

npm install

npm run restart-server


## Resources

**Express.js** – Backend-ramverk för att bygga REST API:er  
**React** – Frontend-bibliotek för att skapa användargränssnitt  
**TypeScript** – Typstöd för JavaScript i både frontend och backend  
**AWS SDK** – För att kommunicera med DynamoDB  
**DynamoDB** – NoSQL-databas för att lagra användare, kanaler och meddelanden  
**JWT (Json Web Token)** – För autentisering och inloggning  
**Zustand** – Enkel state-hantering i React  
**Vite** – Snabb utvecklingsmiljö och byggverktyg för frontend  
**bcrypt** – Hashning av lösenord för säkerhet  

---
### Utvecklare 
Mikaela 


# Skin Minimal AI

## Overview
**Skin Minimal AI** — это веб-приложение, использующее элементы искусственного интеллекта для анализа ухода за кожей и минимизации риска её перегрузки.

Основная идея продукта — не рекомендовать больше средств, а **сокращать уход до минимально необходимого**, особенно для чувствительной и реактивной кожи.

---

## Problem Statement

Многие пользователи:
- используют слишком много активных компонентов (кислоты, ретиноиды)
- не могут определить причину ухудшения кожи
- сталкиваются с циклом: *улучшение → ухудшение*

Существующие решения:
- рекомендуют добавлять новые продукты
- не учитывают перегрузку ухода
- не анализируют причинно-следственные связи

---

## Solution

Skin Minimal AI:
- анализирует текущий уход пользователя
- выявляет перегрузку активами
- предлагает **минималистичную рутину**
- адаптируется на основе обратной связи

---

## Tech Stack

### Backend
- Python
- FastAPI
- Pydantic
- (позже) scikit-learn / PyTorch

### Frontend
- React / Next.js

### Database (в будущем)
- PostgreSQL

### Storage (опционально)
- AWS S3 / Firebase

---

## MVP Scope

### Включено:
- ввод данных пользователем
- анализ ухода
- определение перегрузки
- выдача рекомендаций

### Исключено:
- авторизация
- загрузка фото
- сложные ML-модели
- база данных

---

## User Flow

1. Пользователь открывает приложение  
2. Вводит:
   - тип кожи  
   - продукты  
   - симптомы  
3. Нажимает "Analyze"  
4. Получает результат:
   - уровень риска  
   - рекомендацию  

---

## API Design

### Endpoint
`POST /analyze`

### Request

```json
{
  "skin_type": "sensitive",
  "products": [
    { "type": "acid", "frequency": "daily" },
    { "type": "moisturizer" }
  ],
  "symptoms": ["irritation"]
}
````

### Response

```json
{
  "overload_risk": "high",
  "recommendation": "remove all actives"
}
```

---

## Core Logic

### Rule-Based Engine (MVP)

Базовые правила:

* если есть раздражение + активы → высокая перегрузка
* если >2 активов → средний/высокий риск
* если минимальный уход → низкий риск

---

## Data Model

```json
{
  "skin_type": "string",
  "products": [
    {
      "type": "string",
      "frequency": "string"
    }
  ],
  "symptoms": ["string"]
}
```

---

## Project Structure

### Backend

```
backend/
├── main.py
├── routes/
│   └── analyze.py
├── models/
│   └── schemas.py
├── services/
│   └── analyzer.py
```

---

### Frontend

```
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── api/
│   └── App.js
```

---

## Development Plan

### Phase 1 — MVP

* реализовать FastAPI сервер
* создать endpoint `/analyze`
* добавить rule-based логику
* создать React-форму
* связать frontend и backend

---

### Phase 2 — Улучшения

* добавить историю изменений
* расширить правила
* улучшить UX

---

### Phase 3 — AI Integration

* собрать dataset
* обучить модель классификации
* заменить часть логики

---

### Phase 4 — Advanced AI

* персонализация
* reinforcement learning
* прогнозирование состояния кожи

---

## Metrics of Success

* уменьшение симптомов
* снижение количества продуктов
* стабильность кожи
* удержание пользователей

---

## Future Enhancements

* анализ состава (NLP)
* фото-анализ (CV)
* персональные рекомендации (ML)
* система похожих пользователей

---

## Key Differentiator

В отличие от большинства skincare-приложений:

> Skin Minimal AI оптимизирует уход через **удаление лишнего**, а не добавление нового.

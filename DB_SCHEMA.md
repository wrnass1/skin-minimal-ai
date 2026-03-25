# Skin Minimal AI — схемы БД

Документ описывает проектную схему PostgreSQL для текущего направления из `README.md`.
Сейчас в MVP база исключена, поэтому ниже — рекомендуемая структура для внедрения в следующих фазах.

## 1) Логическая модель

Основные сущности:

- `analysis_sessions` — одна попытка анализа ухода (аналог одного запроса `POST /analyze`).
- `session_products` — продукты, переданные в рамках сессии анализа.
- `session_symptoms` — симптомы, переданные в рамках сессии анализа.
- `analysis_results` — результат rule-based анализа для сессии.

Для Phase 2 (история изменений) добавляется:

- `routine_snapshots` — сохраненные версии рутины пользователя во времени.
- `snapshot_products` — состав каждого snapshot.

## 2) ER-диаграмма (MVP + история)

```mermaid
erDiagram
    analysis_sessions ||--o{ session_products : contains
    analysis_sessions ||--o{ session_symptoms : contains
    analysis_sessions ||--|| analysis_results : produces

    routine_snapshots ||--o{ snapshot_products : contains

    analysis_sessions {
      uuid id PK
      text skin_type
      timestamptz created_at
    }

    session_products {
      uuid id PK
      uuid session_id FK
      text type
      text frequency
      smallint sort_order
    }

    session_symptoms {
      uuid id PK
      uuid session_id FK
      text symptom
    }

    analysis_results {
      uuid id PK
      uuid session_id FK UNIQUE
      text overload_risk
      text recommendation
      jsonb rule_hits
      timestamptz created_at
    }

    routine_snapshots {
      uuid id PK
      text profile_key
      text skin_type
      text note
      timestamptz created_at
    }

    snapshot_products {
      uuid id PK
      uuid snapshot_id FK
      text type
      text frequency
      smallint sort_order
    }
```

## 3) Физическая схема (PostgreSQL DDL)

```sql
-- Требуется для gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Сессия анализа (1 запрос /analyze = 1 запись)
CREATE TABLE analysis_sessions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    skin_type     text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Продукты, переданные в сессии
CREATE TABLE session_products (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    uuid NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    type          text NOT NULL,
    frequency     text,
    sort_order    smallint NOT NULL DEFAULT 0
);

CREATE INDEX idx_session_products_session_id ON session_products(session_id);

-- 3. Симптомы, переданные в сессии
CREATE TABLE session_symptoms (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    uuid NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    symptom       text NOT NULL
);

CREATE INDEX idx_session_symptoms_session_id ON session_symptoms(session_id);

-- 4. Результат анализа
CREATE TABLE analysis_results (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    uuid NOT NULL UNIQUE REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    overload_risk text NOT NULL CHECK (overload_risk IN ('low', 'medium', 'high')),
    recommendation text NOT NULL,
    rule_hits     jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_results_risk ON analysis_results(overload_risk);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);

-- 5. История изменений рутины (Phase 2)
CREATE TABLE routine_snapshots (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_key   text NOT NULL,
    skin_type     text NOT NULL,
    note          text,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_routine_snapshots_profile_key ON routine_snapshots(profile_key);
CREATE INDEX idx_routine_snapshots_created_at ON routine_snapshots(created_at DESC);

CREATE TABLE snapshot_products (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id   uuid NOT NULL REFERENCES routine_snapshots(id) ON DELETE CASCADE,
    type          text NOT NULL,
    frequency     text,
    sort_order    smallint NOT NULL DEFAULT 0
);

CREATE INDEX idx_snapshot_products_snapshot_id ON snapshot_products(snapshot_id);
```

## 4) Комментарии по внедрению

- `profile_key` в `routine_snapshots` — временный идентификатор пользователя/устройства до появления полноценной авторизации.
- `rule_hits` хранит сработавшие правила движка (например, `["irritation_plus_actives", "too_many_actives"]`) и помогает дебагу/аналитике.
- `sort_order` позволяет сохранять порядок продуктов как в UI.
- При появлении auth можно добавить таблицу `users` и заменить `profile_key` на `user_id`.

## 5) Минимальный набор таблиц для старта

Если нужна только фиксация факта анализа без истории:

- `analysis_sessions`
- `session_products`
- `session_symptoms`
- `analysis_results`

Этого достаточно, чтобы хранить входные данные и ответ API для последующего анализа качества рекомендаций.

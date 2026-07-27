CREATE TABLE cases
(
    id        BIGSERIAL PRIMARY KEY,
    name      VARCHAR(255) NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    price     BIGINT       NOT NULL CHECK (price >= 0),
    active    BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE case_items
(
    id      BIGSERIAL PRIMARY KEY,
    case_id BIGINT  NOT NULL,
    item_id BIGINT  NOT NULL,
    weight  INTEGER NOT NULL CHECK (weight > 0),

    CONSTRAINT fk_case_items_case
        FOREIGN KEY (case_id)
            REFERENCES cases (id)
            ON DELETE CASCADE,

    CONSTRAINT uk_case_items_case_item
        UNIQUE (case_id, item_id)
);

CREATE INDEX idx_case_items_case_id
    ON case_items (case_id);

CREATE INDEX idx_case_items_item_id
    ON case_items (item_id);

CREATE TABLE case_open_history
(
    id         BIGSERIAL PRIMARY KEY,
    item_id    BIGINT        NOT NULL,
    item_name  VARCHAR(255)  NOT NULL,
    image_url  VARCHAR(1000) NOT NULL,
    price      BIGINT        NOT NULL CHECK (price >= 0),
    opened_at  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_case_open_history_opened_at
    ON case_open_history (opened_at DESC);

WITH new_cases AS (
    INSERT INTO cases (name, image_url, price, active)
    VALUES
        ('Starter Case', 'https://placehold.co/512x512/png?text=Starter+Case', 100, TRUE),
        ('Premium Case', 'https://placehold.co/512x512/png?text=Premium+Case', 500, TRUE)
    RETURNING id, name
),
rewards (case_name, item_id, weight) AS (
    VALUES
        ('Starter Case', 1, 60),
        ('Starter Case', 2, 30),
        ('Starter Case', 3, 9),
        ('Starter Case', 4, 1),
        ('Premium Case', 1, 20),
        ('Premium Case', 2, 35),
        ('Premium Case', 3, 35),
        ('Premium Case', 4, 10)
)
INSERT INTO case_items (case_id, item_id, weight)
SELECT game_case.id, reward.item_id, reward.weight
FROM rewards reward
JOIN new_cases game_case ON game_case.name = reward.case_name;

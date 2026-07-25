CREATE TABLE items
(
    id        BIGSERIAL PRIMARY KEY,
    name      VARCHAR(255) NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    price     BIGINT       NOT NULL CHECK (price >= 0)
);

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

    CONSTRAINT fk_case_items_item
        FOREIGN KEY (item_id)
            REFERENCES items (id)
            ON DELETE CASCADE,

    CONSTRAINT uk_case_items_case_item
        UNIQUE (case_id, item_id)
);

CREATE INDEX idx_case_items_case_id
    ON case_items (case_id);

CREATE INDEX idx_case_items_item_id
    ON case_items (item_id);
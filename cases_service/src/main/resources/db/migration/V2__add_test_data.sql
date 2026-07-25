WITH new_items AS (
    INSERT INTO items (name, image_url, price)
    VALUES
        ('Bronze Coin', 'https://placehold.co/512x512/png?text=Bronze+Coin', 50),
        ('Silver Ring', 'https://placehold.co/512x512/png?text=Silver+Ring', 150),
        ('Golden Knife', 'https://placehold.co/512x512/png?text=Golden+Knife', 500),
        ('Diamond Crown', 'https://placehold.co/512x512/png?text=Diamond+Crown', 1500)
    RETURNING id, name
),
new_cases AS (
    INSERT INTO cases (name, image_url, price, active)
    VALUES
        ('Starter Case', 'https://placehold.co/512x512/png?text=Starter+Case', 100, TRUE),
        ('Premium Case', 'https://placehold.co/512x512/png?text=Premium+Case', 500, TRUE)
    RETURNING id, name
),
rewards (case_name, item_name, weight) AS (
    VALUES
        ('Starter Case', 'Bronze Coin', 60),
        ('Starter Case', 'Silver Ring', 30),
        ('Starter Case', 'Golden Knife', 9),
        ('Starter Case', 'Diamond Crown', 1),
        ('Premium Case', 'Bronze Coin', 20),
        ('Premium Case', 'Silver Ring', 35),
        ('Premium Case', 'Golden Knife', 35),
        ('Premium Case', 'Diamond Crown', 10)
)
INSERT INTO case_items (case_id, item_id, weight)
SELECT game_case.id, item.id, reward.weight
FROM rewards reward
JOIN new_cases game_case ON game_case.name = reward.case_name
JOIN new_items item ON item.name = reward.item_name;

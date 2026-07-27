CREATE TABLE items
(
    id        BIGSERIAL PRIMARY KEY,
    name      VARCHAR(255)  NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    price     BIGINT        NOT NULL CHECK (price >= 0)
);

INSERT INTO items (name, image_url, price)
VALUES
    ('Snake Box', '/api/items/images/Snake Box.png', 369),
    ('Light Sword', '/api/items/images/Light Sword.png', 648),
    ('Chill Flame', '/api/items/images/Chill Flame.png', 356),
    ('Candy Cane', '/api/items/images/352d4610-6933-404e-8f9a-6ece046a65ed.png', 372),
    ('Xmas Stocking', '/api/items/images/Xmas Stocking.png', 369),
    ('Westside Sign', '/api/items/images/Westside Sign.png', 9346),
    ('Heroic Helmet', '/api/items/images/Heroic Helmet.png', 19571),
    ('Sharp Tongue', '/api/items/images/Sharp Tongue.png', 4198),
    ('Swiss Watch', '/api/items/images/Swiss Watch.png', 4894),
    ('Iternal Candle', '/api/items/images/Iternal Candle.png', 535),
    ('Input Key', '/api/items/images/Input Key.png', 614),
    ('Lunar Snake', '/api/items/images/Lunar Snake.png', 371),
    ('Clover Pin', '/api/items/images/Clover Pin.png', 516),
    ('Devil Eye', '/api/items/images/Devil Eye.png', 751),
    ('Cupid Charm', '/api/items/images/Cupid Charm.png', 2204),
    ('Durov''s Cap', '/api/items/images/Durov''s Cap.png', 51686),
    ('Electric Skull', '/api/items/images/Electric Skull.png', 2450),
    ('Iternal Rose', '/api/items/images/Iternal Rose.png', 2353),
    ('Voodoo Doll', '/api/items/images/Voodoo Doll.png', 3530),
    ('Diamond Ring', '/api/items/images/Diamond Ring.png', 2959),
    ('Sakura Flower', '/api/items/images/Sakura Flower.png', 918),
    ('Nail Bracelet', '/api/items/images/Nail Bracelet.png', 11458),
    ('Surge Board', '/api/items/images/Surge Board.webp', 711),
    ('Loot Bag', '/api/items/images/Loot Bag.png', 11425),
    ('Genie Lamp', '/api/items/images/Genie Lamp.png', 3397),
    ('Perfume Bottle', '/api/items/images/Perfume Bottle.png', 6491),
    ('Astral Shard', '/api/items/images/Ion Gem.png', 13187),
    ('Snoop Sigar', '/api/items/images/Snoop Sigar.png', 1364),
    ('Ionic Dryer', '/api/items/images/Ionic Dryer.png', 1524),
    ('Hex Pot', '/api/items/images/Hex Pot.png', 438),
    ('Neko Helmet', '/api/items/images/Neko Helmet.png', 3748),
    ('Instant Ramen', '/api/items/images/Instant Ramen.png', 383),
    ('Crystal Ball', '/api/items/images/Crystal Ball.png', 1241),
    ('Sky Stilettos', '/api/items/images/Sky Stilettos.png', 1799),
    ('Toy Bear', '/api/items/images/Toy Bear.png', 3810),
    ('Flying Broom', '/api/items/images/Flying Broom.png', 1118),
    ('Vice Cream', '/api/items/images/Vice Cream.png', 368),
    ('Jester Hat', '/api/items/images/Jester Hat.png', 406),
    ('Signet Ring', '/api/items/images/Signet Ring.png', 3239),
    ('Scared Cat', '/api/items/images/Scared Cat.png', 18780),
    ('Love Potion', '/api/items/images/Love Potion.png', 1454),
    ('Swag Bag', '/api/items/images/Swag Bag.png', 567),
    ('Star Notepad', '/api/items/images/Star Notepad.png', 479);

SELECT setval(
    pg_get_serial_sequence('items', 'id'),
    (SELECT MAX(id) FROM items)
);

create table users (
    id bigserial primary key,
    email varchar(255) not null unique,
    password varchar(255) not null
);

create table wallets (
    id bigserial primary key,
    user_id bigint not null unique references users(id),
    balance bigint not null default 0,
    check (balance >= 0)
);

create table inventory_items (
    id bigserial primary key,
    item_id bigint not null,
    user_id bigint not null references users(id)
);
create table users (
    id bigserial primary key,
    email varchar(255) not null unique,
    password varchar(255) not null,
    role varchar(20) not null default 'USER',
    constraint chk_users_role check (role in ('USER', 'ADMIN'))
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

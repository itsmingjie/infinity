create table if not exists teams (
    id uuid not null constraint users_pkey primary key,
    name char(64),
    password varchar(64),
    display_name char(64),
    admin boolean,
    affiliation char(64),
    score integer default 0 not null,
    banned boolean default false
);

create unique index if not exists teams_name_uindex on teams (name);

create table if not exists logs (
    id uuid not null constraint attempts_pk primary key,
    uid uuid not null,
    puzzle text not null,
    timestamp timestamp default CURRENT_TIMESTAMP not null,
    attempt text not null,
    action text default 'solve' :: text not null,
    value integer default 0
);

create unique index if not exists attempts_id_uindex on logs (id);
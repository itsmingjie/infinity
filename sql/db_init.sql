CREATE TABLE teams (
    id uuid NOT NULL CONSTRAINT users_pkey PRIMARY KEY,
    name char(64),
    password varchar(64),
    "displayName" char(64),
    admin boolean,
    affiliation char(64),
    score integer DEFAULT 0 NOT NULL,
    banned boolean DEFAULT FALSE
);

CREATE UNIQUE INDEX teams_name_uindex ON teams (name);

CREATE TABLE logs (
    id uuid NOT NULL CONSTRAINT attempts_pk PRIMARY KEY,
    uid uuid NOT NULL,
    puzzle text NOT NULL,
    timestamp timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attempt text NOT NULL,
    action text DEFAULT 'solve' ::text NOT NULL,
    value integer DEFAULT 0
);

CREATE UNIQUE INDEX attempts_id_uindex ON logs (id);
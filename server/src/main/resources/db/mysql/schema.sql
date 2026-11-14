-- E-Library tables for MySQL. Runs on every API start; IF NOT EXISTS / INSERT IGNORE make it safe to repeat.

CREATE TABLE IF NOT EXISTS admin_login_tbl (
    username   VARCHAR(50)  NOT NULL PRIMARY KEY,
    password   VARCHAR(100) NOT NULL,
    full_name  VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS author_master_tbl (
    author_id   VARCHAR(50)  NOT NULL PRIMARY KEY,
    author_name VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS publisher_master_tbl (
    publisher_id   VARCHAR(50)  NOT NULL PRIMARY KEY,
    publisher_name VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS member_master_tbl (
    member_id      VARCHAR(50)  NOT NULL PRIMARY KEY,
    full_name      VARCHAR(100),
    dob            VARCHAR(20),
    contact_no     VARCHAR(20),
    email          VARCHAR(100),
    state          VARCHAR(50),
    city           VARCHAR(50),
    pincode        VARCHAR(10),
    full_address   VARCHAR(500),
    password       VARCHAR(100),
    account_status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS book_master_tbl (
    book_id          VARCHAR(50) NOT NULL PRIMARY KEY,
    book_name        VARCHAR(300),
    genre            VARCHAR(500),
    author_name      VARCHAR(200),
    publisher_name   VARCHAR(200),
    publish_date     VARCHAR(20),
    language         VARCHAR(50),
    edition          VARCHAR(50),
    book_cost        INT DEFAULT 0,
    no_of_pages      INT DEFAULT 0,
    book_description TEXT,
    actual_stock     INT DEFAULT 0,
    current_stock    INT DEFAULT 0,
    book_img_link    VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS book_issue_tbl (
    member_id   VARCHAR(50) NOT NULL,
    member_name VARCHAR(100),
    book_id     VARCHAR(50) NOT NULL,
    book_name   VARCHAR(300),
    issue_date  VARCHAR(20),
    due_date    VARCHAR(20),
    PRIMARY KEY (member_id, book_id)
);

-- Starter admin: username "admin", password "admin123".
-- The API replaces it with a bcrypt hash on first sign-in. Change it after you log in.
INSERT IGNORE INTO admin_login_tbl (username, password, full_name) VALUES ('admin', 'admin123', 'Library Admin');

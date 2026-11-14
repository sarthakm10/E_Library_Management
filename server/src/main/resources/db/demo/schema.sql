-- Mirrors the tables used by the original Web Forms app (column names taken from its queries).
CREATE TABLE admin_login_tbl (
    username   NVARCHAR(50)  NOT NULL PRIMARY KEY,
    password   NVARCHAR(100) NOT NULL,
    full_name  NVARCHAR(100)
);

CREATE TABLE author_master_tbl (
    author_id   NVARCHAR(50)  NOT NULL PRIMARY KEY,
    author_name NVARCHAR(200) NOT NULL
);

CREATE TABLE publisher_master_tbl (
    publisher_id   NVARCHAR(50)  NOT NULL PRIMARY KEY,
    publisher_name NVARCHAR(200) NOT NULL
);

CREATE TABLE member_master_tbl (
    full_name      NVARCHAR(100),
    dob            NVARCHAR(50),
    contact_no     NVARCHAR(50),
    email          NVARCHAR(100),
    state          NVARCHAR(50),
    city           NVARCHAR(50),
    pincode        NVARCHAR(20),
    full_address   NVARCHAR(500),
    member_id      NVARCHAR(50) NOT NULL PRIMARY KEY,
    password       NVARCHAR(100),
    account_status NVARCHAR(20)
);

CREATE TABLE book_master_tbl (
    book_id          NVARCHAR(50) NOT NULL PRIMARY KEY,
    book_name        NVARCHAR(300),
    genre            NVARCHAR(500),
    author_name      NVARCHAR(200),
    publisher_name   NVARCHAR(200),
    publish_date     NVARCHAR(50),
    language         NVARCHAR(50),
    edition          NVARCHAR(50),
    book_cost        NVARCHAR(50),
    no_of_pages      NVARCHAR(50),
    book_description NVARCHAR(2000),
    actual_stock     NVARCHAR(50),
    current_stock    NVARCHAR(50),
    book_img_link    NVARCHAR(500)
);

CREATE TABLE book_issue_tbl (
    member_id   NVARCHAR(50),
    member_name NVARCHAR(100),
    book_id     NVARCHAR(50),
    book_name   NVARCHAR(300),
    issue_date  NVARCHAR(50),
    due_date    NVARCHAR(50)
);

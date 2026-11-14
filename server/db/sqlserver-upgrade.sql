-- One-time upgrade for your existing elibraryDB so the new API can store bcrypt password hashes.
-- Safe to run more than once. Run it in SQL Server Management Studio (or sqlcmd) against elibraryDB.
-- Existing plain-text passwords keep working; each one is replaced by a hash the next time that account signs in.

USE elibraryDB;
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_NAME = 'member_master_tbl' AND COLUMN_NAME = 'password'
             AND CHARACTER_MAXIMUM_LENGTH BETWEEN 1 AND 99)
    ALTER TABLE member_master_tbl ALTER COLUMN password NVARCHAR(100);
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_NAME = 'admin_login_tbl' AND COLUMN_NAME = 'password'
             AND CHARACTER_MAXIMUM_LENGTH BETWEEN 1 AND 99)
    ALTER TABLE admin_login_tbl ALTER COLUMN password NVARCHAR(100) NOT NULL;
GO

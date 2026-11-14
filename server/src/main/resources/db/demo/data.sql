-- Demo data. Passwords are stored in plain text on purpose, like the legacy database;
-- the API upgrades each one to a bcrypt hash the first time that account logs in.
-- Demo logins:  admin / admin123   |   member: rahul01 / demo123 (active), priya02 / demo123 (pending)

INSERT INTO admin_login_tbl (username, password, full_name) VALUES ('admin', 'admin123', 'Library Admin');

INSERT INTO author_master_tbl (author_id, author_name) VALUES
 ('A1', 'Joseph Murphy'), ('A2', 'Dale Carnegie'), ('A3', 'Napoleon Hill'),
 ('A4', 'Agatha Christie'), ('A5', 'Yuval Noah Harari'), ('A6', 'Chetan Bhagat');

INSERT INTO publisher_master_tbl (publisher_id, publisher_name) VALUES
 ('P1', 'Penguin Random House'), ('P2', 'HarperCollins'), ('P3', 'Bloomsbury');

INSERT INTO book_master_tbl (book_id, book_name, genre, author_name, publisher_name, publish_date, language, edition,
                             book_cost, no_of_pages, book_description, actual_stock, current_stock, book_img_link) VALUES
 ('B101', 'The Power of Your Subconscious Mind', 'Self Help,Personal Development', 'Joseph Murphy', 'Penguin Random House', '1963-01-01', 'English', '1', '199', '312',
  'A classic guide to using the power of the subconscious mind to change habits, health and relationships.', '5', '3', '~/book_inventory/b1.jpg'),
 ('B102', 'How to Win Friends and Influence People', 'Self Help,Personal Development', 'Dale Carnegie', 'HarperCollins', '1936-10-01', 'English', '3', '250', '288',
  'Timeless advice on handling people, making friends and persuading others without arousing resentment.', '4', '4', '~/book_inventory/b2.jpg'),
 ('B103', 'Think and Grow Rich', 'Motivation,Self Help', 'Napoleon Hill', 'Bloomsbury', '1937-03-01', 'English', '2', '225', '320',
  'Lessons drawn from studying hundreds of successful people, distilled into principles for achieving your goals.', '6', '5', '~/book_inventory/b3.jpg'),
 ('B104', 'Murder on the Orient Express', 'Crime,Suspense,Thriller', 'Agatha Christie', 'HarperCollins', '1934-01-01', 'English', '3', '299', '256',
  'Hercule Poirot investigates a murder aboard the snowbound Orient Express.', '3', '3', '~/book_inventory/books1.png'),
 ('B105', 'Sapiens', 'History,Science', 'Yuval Noah Harari', 'Penguin Random House', '2011-01-01', 'English', '2', '650', '498',
  'A brief history of humankind, from the Stone Age to the twenty-first century.', '4', '3', '~/book_inventory/books1.png'),
 ('B106', 'Five Point Someone', 'Drama,Romance', 'Chetan Bhagat', 'Penguin Random House', '2004-01-01', 'Hindi', '1', '199', '270',
  'Three friends navigate the pressures of life at an elite engineering college.', '2', '2', '~/book_inventory/books1.png');

INSERT INTO member_master_tbl (full_name, dob, contact_no, email, state, city, pincode, full_address, member_id, password, account_status) VALUES
 ('Rahul Sharma', '2000-04-12', '9876543210', 'rahul@example.com', 'Maharashtra', 'Pune', '411001', '12 MG Road', 'rahul01', 'demo123', 'active'),
 ('Priya Verma', '2001-09-03', '9123456780', 'priya@example.com', 'Karnataka', 'Bengaluru', '560001', '45 Brigade Road', 'priya02', 'demo123', 'pending'),
 ('Amit Kumar', '1998-12-20', '9988776655', 'amit@example.com', 'Delhi', 'New Delhi', '110001', '7 Connaught Place', 'amit03', 'demo123', 'active'),
 ('Sneha Iyer', '1999-07-15', '9090909090', 'sneha@example.com', 'Tamil Nadu', 'Chennai', '600001', '3 Anna Salai', 'sneha04', 'demo123', 'deactive');

INSERT INTO book_issue_tbl (member_id, member_name, book_id, book_name, issue_date, due_date) VALUES
 ('rahul01', 'Rahul Sharma', 'B101', 'The Power of Your Subconscious Mind',
  FORMATDATETIME(DATEADD('DAY', -20, CURRENT_DATE), 'yyyy-MM-dd'), FORMATDATETIME(DATEADD('DAY', -6, CURRENT_DATE), 'yyyy-MM-dd')),
 ('rahul01', 'Rahul Sharma', 'B103', 'Think and Grow Rich',
  FORMATDATETIME(DATEADD('DAY', -3, CURRENT_DATE), 'yyyy-MM-dd'), FORMATDATETIME(DATEADD('DAY', 11, CURRENT_DATE), 'yyyy-MM-dd')),
 ('amit03', 'Amit Kumar', 'B101', 'The Power of Your Subconscious Mind',
  FORMATDATETIME(DATEADD('DAY', -10, CURRENT_DATE), 'yyyy-MM-dd'), FORMATDATETIME(DATEADD('DAY', 2, CURRENT_DATE), 'yyyy-MM-dd')),
 ('amit03', 'Amit Kumar', 'B105', 'Sapiens',
  FORMATDATETIME(DATEADD('DAY', -30, CURRENT_DATE), 'yyyy-MM-dd'), FORMATDATETIME(DATEADD('DAY', -16, CURRENT_DATE), 'yyyy-MM-dd'));

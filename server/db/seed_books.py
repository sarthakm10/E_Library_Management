"""
Builds the ~300-book catalog the API loads into an empty database.

  python server/db/seed_books.py            # download covers + write the catalog SQL
  python server/db/seed_books.py --no-covers

Covers come from Open Library (covers.openlibrary.org) and are saved to
server/book_inventory/<bookId>.jpg, the folder the API serves at /book_inventory.
Books with no cover found keep the app's generated cover. Re-running skips covers already on disk.

Output: server/src/main/resources/db/seed/catalog.sql (plain INSERTs that work on MySQL, H2 and SQL Server).
The API runs it automatically on startup when the books, authors and publishers tables are all empty
(see com.elibrary.db.DataSeeder), so you never need to load it by hand.
"""
import json
import random
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COVERS = ROOT / "server" / "book_inventory"
OUT_SQL = ROOT / "server" / "src" / "main" / "resources" / "db" / "seed" / "catalog.sql"
UA = {"User-Agent": "ShelfwiseCatalogSeeder/1.0"}

# Title | Author | Year | Genres | Pages | Language (default English)
BOOKS = """
The Power of Your Subconscious Mind|Joseph Murphy|1963|Self Help,Personal Development|312
How to Win Friends and Influence People|Dale Carnegie|1936|Self Help,Personal Development|288
Think and Grow Rich|Napoleon Hill|1937|Motivation,Self Help|320
How to Stop Worrying and Start Living|Dale Carnegie|1948|Self Help|306
Atomic Habits|James Clear|2018|Self Help,Personal Development|320
The 7 Habits of Highly Effective People|Stephen R. Covey|1989|Self Help,Personal Development|381
The Power of Now|Eckhart Tolle|1997|Self Help,Wellness|236
Ikigai|Héctor García|2016|Healthy Living,Wellness|208
Man's Search for Meaning|Viktor E. Frankl|1946|Personal Development,Autobiography|184
Deep Work|Cal Newport|2016|Personal Development|296
Mindset|Carol S. Dweck|2006|Personal Development|320
Grit|Angela Duckworth|2016|Personal Development|352
The Four Agreements|Don Miguel Ruiz|1997|Self Help|163
Rich Dad Poor Dad|Robert T. Kiyosaki|1997|Self Help,Personal Development|336
The Psychology of Money|Morgan Housel|2020|Self Help|256
The 5 AM Club|Robin Sharma|2018|Motivation,Self Help|336
The Monk Who Sold His Ferrari|Robin Sharma|1997|Motivation,Self Help|198
You Can Win|Shiv Khera|1998|Motivation|240
The Magic of Thinking Big|David J. Schwartz|1959|Motivation|240
The Power of Positive Thinking|Norman Vincent Peale|1952|Motivation,Self Help|276
Awaken the Giant Within|Tony Robbins|1991|Motivation,Personal Development|544
Can't Hurt Me|David Goggins|2018|Motivation,Autobiography|364
Start with Why|Simon Sinek|2009|Personal Development|256
Thinking, Fast and Slow|Daniel Kahneman|2011|Science,Personal Development|499
The Power of Habit|Charles Duhigg|2012|Personal Development|371
Essentialism|Greg McKeown|2014|Personal Development|272
Ego Is the Enemy|Ryan Holiday|2016|Personal Development|226
The Obstacle Is the Way|Ryan Holiday|2014|Personal Development,Motivation|224
Who Moved My Cheese?|Spencer Johnson|1998|Self Help|96
Wings of Fire|A. P. J. Abdul Kalam|1999|Autobiography,Motivation|196
Ignited Minds|A. P. J. Abdul Kalam|2002|Motivation|208
Quiet|Susan Cain|2012|Personal Development|333
Daring Greatly|Brené Brown|2012|Self Help|287
Getting Things Done|David Allen|2001|Personal Development|267
Make Your Bed|William H. McRaven|2017|Motivation|144
Why We Sleep|Matthew Walker|2017|Health,Science|368
Breath|James Nestor|2020|Health,Wellness|304
The Body Keeps the Score|Bessel van der Kolk|2014|Health|464
Outlive|Peter Attia|2023|Health,Healthy Living|496
How Not to Die|Michael Greger|2015|Health,Healthy Living|562
In Defense of Food|Michael Pollan|2008|Healthy Living|244
The Omnivore's Dilemma|Michael Pollan|2006|Healthy Living,Science|450
Salt Sugar Fat|Michael Moss|2013|Health|446
The Blue Zones|Dan Buettner|2008|Healthy Living,Wellness|288
Light on Yoga|B. K. S. Iyengar|1966|Wellness,Health|544
Autobiography of a Yogi|Paramahansa Yogananda|1946|Autobiography,Wellness|560
Being Mortal|Atul Gawande|2014|Health|282
The Emperor of All Maladies|Siddhartha Mukherjee|2010|Health,History,Science|571
The Gene|Siddhartha Mukherjee|2016|Science|592
Burnout|Emily Nagoski|2019|Wellness|304
Glucose Revolution|Jessie Inchauspé|2022|Healthy Living,Health|304
Pride and Prejudice|Jane Austen|1813|Romance,Drama|432
Sense and Sensibility|Jane Austen|1811|Romance,Drama|409
Emma|Jane Austen|1815|Romance,Drama|474
Persuasion|Jane Austen|1817|Romance|249
Jane Eyre|Charlotte Brontë|1847|Romance,Drama|532
Wuthering Heights|Emily Brontë|1847|Romance,Drama|416
Great Expectations|Charles Dickens|1861|Drama|505
A Tale of Two Cities|Charles Dickens|1859|Drama,History|489
Oliver Twist|Charles Dickens|1838|Drama|608
David Copperfield|Charles Dickens|1850|Drama|882
Moby-Dick|Herman Melville|1851|Adventure|635
The Great Gatsby|F. Scott Fitzgerald|1925|Drama|180
To Kill a Mockingbird|Harper Lee|1960|Drama|336
Nineteen Eighty-Four|George Orwell|1949|Science Fiction|328
Animal Farm|George Orwell|1945|Drama|112
Brave New World|Aldous Huxley|1932|Science Fiction|288
The Catcher in the Rye|J. D. Salinger|1951|Drama|277
Of Mice and Men|John Steinbeck|1937|Drama|107
The Grapes of Wrath|John Steinbeck|1939|Drama,History|464
East of Eden|John Steinbeck|1952|Drama|601
The Old Man and the Sea|Ernest Hemingway|1952|Adventure,Drama|127
A Farewell to Arms|Ernest Hemingway|1929|Romance,Drama|355
For Whom the Bell Tolls|Ernest Hemingway|1940|Drama,History|471
Lord of the Flies|William Golding|1954|Adventure,Drama|224
Frankenstein|Mary Shelley|1818|Horror,Science Fiction|280
Dracula|Bram Stoker|1897|Horror|418
The Picture of Dorian Gray|Oscar Wilde|1890|Horror,Drama|254
Little Women|Louisa May Alcott|1868|Drama|449
Anna Karenina|Leo Tolstoy|1878|Romance,Drama|864
War and Peace|Leo Tolstoy|1869|History,Drama|1225
Crime and Punishment|Fyodor Dostoevsky|1866|Crime,Drama|671
The Brothers Karamazov|Fyodor Dostoevsky|1880|Drama|796
Don Quixote|Miguel de Cervantes|1605|Adventure|1072
Les Misérables|Victor Hugo|1862|Drama,History|1463
The Count of Monte Cristo|Alexandre Dumas|1844|Adventure|1276
The Three Musketeers|Alexandre Dumas|1844|Adventure,Action|625
Treasure Island|Robert Louis Stevenson|1883|Adventure|292
Strange Case of Dr Jekyll and Mr Hyde|Robert Louis Stevenson|1886|Horror,Suspense|144
Robinson Crusoe|Daniel Defoe|1719|Adventure|320
Gulliver's Travels|Jonathan Swift|1726|Adventure,Fantasy|306
Adventures of Huckleberry Finn|Mark Twain|1884|Adventure|366
The Adventures of Tom Sawyer|Mark Twain|1876|Adventure|274
Heart of Darkness|Joseph Conrad|1899|Drama|96
The Scarlet Letter|Nathaniel Hawthorne|1850|Drama,Romance|272
Beloved|Toni Morrison|1987|Drama,History|324
The Color Purple|Alice Walker|1982|Drama|295
One Hundred Years of Solitude|Gabriel García Márquez|1967|Fantasy,Drama|417
Love in the Time of Cholera|Gabriel García Márquez|1985|Romance|348
The Kite Runner|Khaled Hosseini|2003|Drama|371
A Thousand Splendid Suns|Khaled Hosseini|2007|Drama|372
The Book Thief|Markus Zusak|2005|Drama,History|552
Life of Pi|Yann Martel|2001|Adventure|319
The Road|Cormac McCarthy|2006|Science Fiction,Drama|287
Never Let Me Go|Kazuo Ishiguro|2005|Science Fiction,Drama|288
The Remains of the Day|Kazuo Ishiguro|1989|Drama|258
Atonement|Ian McEwan|2001|Drama,Romance|351
The Alchemist|Paulo Coelho|1988|Fantasy,Motivation|208
The Midnight Library|Matt Haig|2020|Fantasy,Drama|304
Where the Crawdads Sing|Delia Owens|2018|Drama,Suspense|384
Normal People|Sally Rooney|2018|Romance,Drama|273
The Fault in Our Stars|John Green|2012|Romance,Drama|313
Me Before You|Jojo Moyes|2012|Romance|369
The Notebook|Nicholas Sparks|1996|Romance|214
Outlander|Diana Gabaldon|1991|Romance,History|627
It Ends with Us|Colleen Hoover|2016|Romance,Drama|376
The Seven Husbands of Evelyn Hugo|Taylor Jenkins Reid|2017|Romance,Drama|389
Little Fires Everywhere|Celeste Ng|2017|Drama|338
The Help|Kathryn Stockett|2009|Drama,History|451
The Hobbit|J. R. R. Tolkien|1937|Fantasy,Adventure|310
The Fellowship of the Ring|J. R. R. Tolkien|1954|Fantasy,Adventure|423
The Two Towers|J. R. R. Tolkien|1954|Fantasy,Adventure|352
The Return of the King|J. R. R. Tolkien|1955|Fantasy,Adventure|416
Harry Potter and the Philosopher's Stone|J. K. Rowling|1997|Fantasy|223
Harry Potter and the Chamber of Secrets|J. K. Rowling|1998|Fantasy|251
Harry Potter and the Prisoner of Azkaban|J. K. Rowling|1999|Fantasy|317
Harry Potter and the Goblet of Fire|J. K. Rowling|2000|Fantasy|636
Harry Potter and the Order of the Phoenix|J. K. Rowling|2003|Fantasy|766
Harry Potter and the Half-Blood Prince|J. K. Rowling|2005|Fantasy|607
Harry Potter and the Deathly Hallows|J. K. Rowling|2007|Fantasy|607
A Game of Thrones|George R. R. Martin|1996|Fantasy|694
A Clash of Kings|George R. R. Martin|1998|Fantasy|761
A Storm of Swords|George R. R. Martin|2000|Fantasy|973
The Name of the Wind|Patrick Rothfuss|2007|Fantasy|662
Mistborn: The Final Empire|Brandon Sanderson|2006|Fantasy|541
The Way of Kings|Brandon Sanderson|2010|Fantasy|1007
The Lion, the Witch and the Wardrobe|C. S. Lewis|1950|Fantasy,Adventure|208
Alice's Adventures in Wonderland|Lewis Carroll|1865|Fantasy|200
The Wonderful Wizard of Oz|L. Frank Baum|1900|Fantasy,Adventure|154
The Lightning Thief|Rick Riordan|2005|Fantasy,Adventure|377
The Hunger Games|Suzanne Collins|2008|Science Fiction,Action|374
Catching Fire|Suzanne Collins|2009|Science Fiction,Action|391
Mockingjay|Suzanne Collins|2010|Science Fiction,Action|390
Divergent|Veronica Roth|2011|Science Fiction,Action|487
American Gods|Neil Gaiman|2001|Fantasy|465
Good Omens|Terry Pratchett|1990|Fantasy|412
The Colour of Magic|Terry Pratchett|1983|Fantasy|285
Circe|Madeline Miller|2018|Fantasy|393
The Song of Achilles|Madeline Miller|2011|Fantasy,Romance|378
The Night Circus|Erin Morgenstern|2011|Fantasy,Romance|387
Six of Crows|Leigh Bardugo|2015|Fantasy,Adventure|465
The Priory of the Orange Tree|Samantha Shannon|2019|Fantasy|848
Fourth Wing|Rebecca Yarros|2023|Fantasy,Romance|517
Eragon|Christopher Paolini|2002|Fantasy,Adventure|509
Dune|Frank Herbert|1965|Science Fiction|617
Foundation|Isaac Asimov|1951|Science Fiction|255
I, Robot|Isaac Asimov|1950|Science Fiction|253
Neuromancer|William Gibson|1984|Science Fiction|271
Fahrenheit 451|Ray Bradbury|1953|Science Fiction|194
The Martian Chronicles|Ray Bradbury|1950|Science Fiction|222
Do Androids Dream of Electric Sheep?|Philip K. Dick|1968|Science Fiction|210
The Left Hand of Darkness|Ursula K. Le Guin|1969|Science Fiction|304
A Wizard of Earthsea|Ursula K. Le Guin|1968|Fantasy|183
Ender's Game|Orson Scott Card|1985|Science Fiction,Action|324
The Hitchhiker's Guide to the Galaxy|Douglas Adams|1979|Science Fiction|193
Hyperion|Dan Simmons|1989|Science Fiction|482
Snow Crash|Neal Stephenson|1992|Science Fiction|480
The Martian|Andy Weir|2011|Science Fiction,Adventure|369
Project Hail Mary|Andy Weir|2021|Science Fiction,Adventure|476
Ready Player One|Ernest Cline|2011|Science Fiction,Adventure|374
The Three-Body Problem|Liu Cixin|2008|Science Fiction|400
Children of Time|Adrian Tchaikovsky|2015|Science Fiction|600
The Time Machine|H. G. Wells|1895|Science Fiction|118
The War of the Worlds|H. G. Wells|1898|Science Fiction|192
Twenty Thousand Leagues Under the Seas|Jules Verne|1870|Science Fiction,Adventure|426
Journey to the Centre of the Earth|Jules Verne|1864|Science Fiction,Adventure|240
Around the World in Eighty Days|Jules Verne|1872|Adventure,Travel|252
Klara and the Sun|Kazuo Ishiguro|2021|Science Fiction|303
The Handmaid's Tale|Margaret Atwood|1985|Science Fiction,Drama|311
Station Eleven|Emily St. John Mandel|2014|Science Fiction|333
Leviathan Wakes|James S. A. Corey|2011|Science Fiction,Action|561
Red Rising|Pierce Brown|2014|Science Fiction,Action|382
Jurassic Park|Michael Crichton|1990|Science Fiction,Thriller|399
The Andromeda Strain|Michael Crichton|1969|Science Fiction|295
And Then There Were None|Agatha Christie|1939|Crime,Suspense|272
Murder on the Orient Express|Agatha Christie|1934|Crime,Suspense|256
The Murder of Roger Ackroyd|Agatha Christie|1926|Crime,Suspense|312
Death on the Nile|Agatha Christie|1937|Crime,Suspense|333
The Hound of the Baskervilles|Arthur Conan Doyle|1902|Crime,Suspense|256
A Study in Scarlet|Arthur Conan Doyle|1887|Crime|108
The Adventures of Sherlock Holmes|Arthur Conan Doyle|1892|Crime|307
Gone Girl|Gillian Flynn|2012|Thriller,Crime|422
Sharp Objects|Gillian Flynn|2006|Thriller,Crime|254
The Girl with the Dragon Tattoo|Stieg Larsson|2005|Thriller,Crime|465
The Da Vinci Code|Dan Brown|2003|Thriller,Suspense|489
Angels & Demons|Dan Brown|2000|Thriller,Suspense|616
Inferno|Dan Brown|2013|Thriller|462
The Silent Patient|Alex Michaelides|2019|Thriller,Suspense|336
The Girl on the Train|Paula Hawkins|2015|Thriller,Suspense|336
Big Little Lies|Liane Moriarty|2014|Suspense,Drama|460
The Silence of the Lambs|Thomas Harris|1988|Thriller,Crime,Horror|367
The Godfather|Mario Puzo|1969|Crime,Drama|448
The Bourne Identity|Robert Ludlum|1980|Thriller,Action|523
Rebecca|Daphne du Maurier|1938|Suspense,Romance|410
The Talented Mr. Ripley|Patricia Highsmith|1955|Crime,Suspense|290
In Cold Blood|Truman Capote|1966|Crime,History|343
The Big Sleep|Raymond Chandler|1939|Crime|231
The Maltese Falcon|Dashiell Hammett|1930|Crime|217
Killing Floor|Lee Child|1997|Thriller,Action|524
The Firm|John Grisham|1991|Thriller|501
A Time to Kill|John Grisham|1989|Thriller,Crime|515
The Thursday Murder Club|Richard Osman|2020|Crime|382
The Woman in the Window|A. J. Finn|2018|Thriller,Suspense|427
The Shining|Stephen King|1977|Horror|447
It|Stephen King|1986|Horror|1138
Misery|Stephen King|1987|Horror,Thriller|320
Carrie|Stephen King|1974|Horror|199
Pet Sematary|Stephen King|1983|Horror|374
The Haunting of Hill House|Shirley Jackson|1959|Horror|246
The Exorcist|William Peter Blatty|1971|Horror|340
Mexican Gothic|Silvia Moreno-Garcia|2020|Horror,Suspense|301
Bird Box|Josh Malerman|2014|Horror,Thriller|262
The Hunt for Red October|Tom Clancy|1984|Action,Thriller|387
Patriot Games|Tom Clancy|1987|Action,Thriller|540
The Day of the Jackal|Frederick Forsyth|1971|Thriller,Action|358
Casino Royale|Ian Fleming|1953|Action,Thriller|181
Dr. No|Ian Fleming|1958|Action,Thriller|256
The Eagle Has Landed|Jack Higgins|1975|Action,History|352
Where Eagles Dare|Alistair MacLean|1967|Action,Adventure|288
The Guns of Navarone|Alistair MacLean|1957|Action,Adventure|320
The Call of the Wild|Jack London|1903|Adventure|232
White Fang|Jack London|1906|Adventure|298
King Solomon's Mines|H. Rider Haggard|1885|Adventure|320
The Lost World|Arthur Conan Doyle|1912|Adventure,Science Fiction|260
The Jungle Book|Rudyard Kipling|1894|Adventure|277
Kim|Rudyard Kipling|1901|Adventure|368
Hatchet|Gary Paulsen|1987|Adventure|195
The Revenant|Michael Punke|2002|Adventure,History|262
Shōgun|James Clavell|1975|Adventure,History|1152
The Pillars of the Earth|Ken Follett|1989|History,Drama|973
Wolf Hall|Hilary Mantel|2009|History,Drama|653
Sapiens|Yuval Noah Harari|2011|History,Science|498
Homo Deus|Yuval Noah Harari|2015|History,Science|448
21 Lessons for the 21st Century|Yuval Noah Harari|2018|History|372
Guns, Germs, and Steel|Jared Diamond|1997|History,Science|480
The Diary of a Young Girl|Anne Frank|1947|Autobiography,History|283
The Discovery of India|Jawaharlal Nehru|1946|History|595
Glimpses of World History|Jawaharlal Nehru|1934|History|992
India After Gandhi|Ramachandra Guha|2007|History|900
The Story of My Experiments with Truth|Mahatma Gandhi|1927|Autobiography,History|480
The Silk Roads|Peter Frankopan|2015|History|636
SPQR|Mary Beard|2015|History|608
The Guns of August|Barbara W. Tuchman|1962|History|511
The Rise and Fall of the Third Reich|William L. Shirer|1960|History|1245
Team of Rivals|Doris Kearns Goodwin|2005|History|944
The Wright Brothers|David McCullough|2015|History|320
1776|David McCullough|2005|History|386
The Anarchy|William Dalrymple|2019|History|576
White Mughals|William Dalrymple|2002|History|580
The Last Mughal|William Dalrymple|2006|History|592
Inglorious Empire|Shashi Tharoor|2016|History|296
Freedom at Midnight|Larry Collins|1975|History|572
A People's History of the United States|Howard Zinn|1980|History|729
Genghis Khan and the Making of the Modern World|Jack Weatherford|2004|History|312
Postwar|Tony Judt|2005|History|878
A Brief History of Time|Stephen Hawking|1988|Science|212
Brief Answers to the Big Questions|Stephen Hawking|2018|Science|256
The Selfish Gene|Richard Dawkins|1976|Science|360
Cosmos|Carl Sagan|1980|Science|396
Pale Blue Dot|Carl Sagan|1994|Science|429
On the Origin of Species|Charles Darwin|1859|Science|502
Astrophysics for People in a Hurry|Neil deGrasse Tyson|2017|Science|222
The Elegant Universe|Brian Greene|1999|Science|448
A Short History of Nearly Everything|Bill Bryson|2003|Science,History|544
Silent Spring|Rachel Carson|1962|Science|378
The Immortal Life of Henrietta Lacks|Rebecca Skloot|2010|Science,History|381
Seven Brief Lessons on Physics|Carlo Rovelli|2014|Science|96
The Order of Time|Carlo Rovelli|2017|Science|240
Surely You're Joking, Mr. Feynman!|Richard P. Feynman|1985|Autobiography,Science|350
The Feynman Lectures on Physics|Richard P. Feynman|1964|Science,Textbook|1552
The Structure of Scientific Revolutions|Thomas S. Kuhn|1962|Science|264
Entangled Life|Merlin Sheldrake|2020|Science|368
The Code Breaker|Walter Isaacson|2021|Science,History|536
Behave|Robert M. Sapolsky|2017|Science|790
The Sixth Extinction|Elizabeth Kolbert|2014|Science|319
Gödel, Escher, Bach|Douglas Hofstadter|1979|Math,Science|777
Fermat's Last Theorem|Simon Singh|1997|Math,History|362
The Joy of x|Steven Strogatz|2012|Math|316
How Not to Be Wrong|Jordan Ellenberg|2014|Math|468
The Man Who Knew Infinity|Robert Kanigel|1991|Math,History|438
A Mathematician's Apology|G. H. Hardy|1940|Math|153
Flatland|Edwin A. Abbott|1884|Math,Fantasy|96
Zero: The Biography of a Dangerous Idea|Charles Seife|2000|Math,History|248
Introduction to Algorithms|Thomas H. Cormen|1990|Textbook,Math|1312
Concepts of Physics|H. C. Verma|1992|Textbook,Science|460
Higher Engineering Mathematics|B. S. Grewal|1965|Textbook,Math|1238
Organic Chemistry|Jonathan Clayden|2000|Textbook,Science|1234
Campbell Biology|Lisa A. Urry|1987|Textbook,Science|1488
Calculus|Michael Spivak|1967|Textbook,Math|680
Linear Algebra Done Right|Sheldon Axler|1995|Textbook,Math|340
Structure and Interpretation of Computer Programs|Harold Abelson|1985|Textbook|657
Clean Code|Robert C. Martin|2008|Textbook|464
The Pragmatic Programmer|Andrew Hunt|1999|Textbook|352
Design Patterns|Erich Gamma|1994|Textbook|395
Principles of Economics|N. Gregory Mankiw|1997|Textbook|888
Britannica Concise Encyclopedia|Encyclopaedia Britannica|2002|Encyclopedia|2144
The Oxford Companion to English Literature|Margaret Drabble|1985|Encyclopedia|1184
Children's Illustrated Encyclopedia|DK|1991|Encyclopedia|656
The Oxford Dictionary of Quotations|Elizabeth Knowles|1941|Encyclopedia|1136
The Story of Art|E. H. Gombrich|1950|Art,History|688
Ways of Seeing|John Berger|1972|Art|176
Steal Like an Artist|Austin Kleon|2012|Art,Personal Development|160
The Artist's Way|Julia Cameron|1992|Art,Self Help|272
Lust for Life|Irving Stone|1934|Art,Drama|489
The Agony and the Ecstasy|Irving Stone|1961|Art,History|776
Leonardo da Vinci|Walter Isaacson|2017|Art,History|600
Gitanjali|Rabindranath Tagore|1910|Poetry|103
Leaves of Grass|Walt Whitman|1855|Poetry|432
The Prophet|Kahlil Gibran|1923|Poetry|107
Milk and Honey|Rupi Kaur|2014|Poetry|208
The Sun and Her Flowers|Rupi Kaur|2017|Poetry|256
The Waste Land|T. S. Eliot|1922|Poetry|64
The Essential Rumi|Rumi|1995|Poetry|320
Ariel|Sylvia Plath|1965|Poetry|96
Paradise Lost|John Milton|1667|Poetry|453
The Odyssey|Homer|2017|Poetry,Adventure|592
Into the Wild|Jon Krakauer|1996|Travel,Adventure|207
Into Thin Air|Jon Krakauer|1997|Travel,Adventure|368
On the Road|Jack Kerouac|1957|Travel,Drama|320
The Motorcycle Diaries|Ernesto Che Guevara|1993|Travel,Autobiography|176
Wild|Cheryl Strayed|2012|Travel,Autobiography|315
A Walk in the Woods|Bill Bryson|1998|Travel|276
Notes from a Small Island|Bill Bryson|1995|Travel|324
Eat, Pray, Love|Elizabeth Gilbert|2006|Travel,Autobiography|334
In Patagonia|Bruce Chatwin|1977|Travel|204
The Great Railway Bazaar|Paul Theroux|1975|Travel|342
Shantaram|Gregory David Roberts|2003|Adventure,Drama|936
Kon-Tiki|Thor Heyerdahl|1948|Travel,Adventure|304
Watchmen|Alan Moore|1987|Comic Book|416
Maus|Art Spiegelman|1986|Comic Book,History|296
Persepolis|Marjane Satrapi|2000|Comic Book,Autobiography|160
V for Vendetta|Alan Moore|1988|Comic Book|296
The Dark Knight Returns|Frank Miller|1986|Comic Book,Action|224
Batman: Year One|Frank Miller|1987|Comic Book,Action|144
The Sandman: Preludes & Nocturnes|Neil Gaiman|1989|Comic Book,Fantasy|240
Saga, Volume 1|Brian K. Vaughan|2012|Comic Book,Science Fiction|160
Asterix the Gaul|René Goscinny|1961|Comic Book,Adventure|48|French
Tintin in Tibet|Hergé|1960|Comic Book,Adventure|62
Calvin and Hobbes|Bill Watterson|1987|Comic Book|128
Bone|Jeff Smith|1991|Comic Book,Fantasy|1332
Akira, Volume 1|Katsuhiro Otomo|1982|Comic Book,Science Fiction|364
One Piece, Volume 1|Eiichiro Oda|1997|Comic Book,Adventure,Action|216
Naruto, Volume 1|Masashi Kishimoto|1999|Comic Book,Action|192
Long Walk to Freedom|Nelson Mandela|1994|Autobiography,History|656
The Autobiography of Malcolm X|Malcolm X|1965|Autobiography|466
I Know Why the Caged Bird Sings|Maya Angelou|1969|Autobiography|289
Becoming|Michelle Obama|2018|Autobiography|448
Educated|Tara Westover|2018|Autobiography|334
Steve Jobs|Walter Isaacson|2011|Autobiography|656
Open|Andre Agassi|2009|Autobiography|388
Playing It My Way|Sachin Tendulkar|2014|Autobiography|486
I Am Malala|Malala Yousafzai|2013|Autobiography|327
The Story of My Life|Helen Keller|1903|Autobiography|160
Born a Crime|Trevor Noah|2016|Autobiography|304
When Breath Becomes Air|Paul Kalanithi|2016|Autobiography,Health|228
Shoe Dog|Phil Knight|2016|Autobiography|386
Unbroken|Laura Hillenbrand|2010|Autobiography,History|473
Five Point Someone|Chetan Bhagat|2004|Drama,Romance|270
2 States|Chetan Bhagat|2009|Romance|269
The 3 Mistakes of My Life|Chetan Bhagat|2008|Drama|258
Half Girlfriend|Chetan Bhagat|2014|Romance|260
The God of Small Things|Arundhati Roy|1997|Drama|340
Midnight's Children|Salman Rushdie|1981|Fantasy,Drama,History|647
The White Tiger|Aravind Adiga|2008|Drama,Crime|276
A Suitable Boy|Vikram Seth|1993|Romance,Drama|1349
The Inheritance of Loss|Kiran Desai|2006|Drama|324
The Palace of Illusions|Chitra Banerjee Divakaruni|2008|Fantasy,Drama|360
The Immortals of Meluha|Amish Tripathi|2010|Fantasy,Action|390
The Secret of the Nagas|Amish Tripathi|2011|Fantasy,Action|396
The Oath of the Vayuputras|Amish Tripathi|2013|Fantasy,Action|565
Ram: Scion of Ikshvaku|Amish Tripathi|2015|Fantasy|354
Malgudi Days|R. K. Narayan|1943|Drama|256
Swami and Friends|R. K. Narayan|1935|Drama|184
The Guide|R. K. Narayan|1958|Drama|220
Train to Pakistan|Khushwant Singh|1956|History,Drama|181
The Namesake|Jhumpa Lahiri|2003|Drama|291
Interpreter of Maladies|Jhumpa Lahiri|1999|Drama|198
A Fine Balance|Rohinton Mistry|1995|Drama|603
Sea of Poppies|Amitav Ghosh|2008|History,Adventure|515
The Hungry Tide|Amitav Ghosh|2004|Drama,Adventure|333
The Room on the Roof|Ruskin Bond|1956|Drama|160
The Blue Umbrella|Ruskin Bond|1980|Drama|80
I Too Had a Love Story|Ravinder Singh|2008|Romance|224
Sacred Games|Vikram Chandra|2006|Crime,Thriller|916
The Great Indian Novel|Shashi Tharoor|1989|Drama,History|423
Wise and Otherwise|Sudha Murty|2002|Personal Development|240
The Rozabal Line|Ashwin Sanghi|2007|Thriller|380
Chanakya's Chant|Ashwin Sanghi|2010|Thriller,History|448
Godaan|Munshi Premchand|1936|Drama|344|Hindi
Nirmala|Munshi Premchand|1927|Drama|160|Hindi
Gaban|Munshi Premchand|1931|Drama|256|Hindi
Raag Darbari|Shrilal Shukla|1968|Drama|336|Hindi
Gunahon Ka Devta|Dharamvir Bharati|1949|Romance|272|Hindi
Tamas|Bhisham Sahni|1974|History,Drama|320|Hindi
Maila Anchal|Phanishwar Nath Renu|1954|Drama|312|Hindi
Chitralekha|Bhagwati Charan Verma|1934|Drama|192|Hindi
Madhushala|Harivansh Rai Bachchan|1935|Poetry|136|Hindi
Rashmirathi|Ramdhari Singh Dinkar|1952|Poetry|128|Hindi
Kamayani|Jaishankar Prasad|1936|Poetry|160|Hindi
Aapka Bunty|Mannu Bhandari|1971|Drama|176|Hindi
Shyamchi Aai|Sane Guruji|1935|Drama,Autobiography|224|Marathi
Mrityunjay|Shivaji Sawant|1967|History,Drama|708|Marathi
Shriman Yogi|Ranjit Desai|1968|History|1040|Marathi
Batatyachi Chaal|P. L. Deshpande|1958|Drama|180|Marathi
Vyakti Ani Valli|P. L. Deshpande|1966|Drama|200|Marathi
Natsamrat|V. V. Shirwadkar|1970|Drama|140|Marathi
Yayati|V. S. Khandekar|1959|Drama|420|Marathi
Raja Shivchhatrapati|Babasaheb Purandare|1958|History|900|Marathi
Le Petit Prince|Antoine de Saint-Exupéry|1943|Fantasy|96|French
L'Étranger|Albert Camus|1942|Drama|186|French
La Peste|Albert Camus|1947|Drama|308|French
Madame Bovary|Gustave Flaubert|1857|Drama,Romance|464|French
Les Fleurs du mal|Charles Baudelaire|1857|Poetry|256|French
Notre-Dame de Paris|Victor Hugo|1831|Drama,History|940|French
Die Verwandlung|Franz Kafka|1915|Drama,Fantasy|96|German
Der Process|Franz Kafka|1925|Drama|304|German
Siddhartha|Hermann Hesse|1922|Drama,Wellness|152|German
Der Steppenwolf|Hermann Hesse|1927|Drama|256|German
Faust|Johann Wolfgang von Goethe|1808|Poetry,Drama|501|German
Die Blechtrommel|Günter Grass|1959|Drama,History|592|German
Im Westen nichts Neues|Erich Maria Remarque|1929|History,Drama|208|German
Der Vorleser|Bernhard Schlink|1995|Drama|208|German
Umrao Jaan Ada|Mirza Hadi Ruswa|1899|Romance,Drama|240|Urdu
Aag Ka Darya|Qurratulain Hyder|1959|History,Drama|560|Urdu
Toba Tek Singh|Saadat Hasan Manto|1955|Drama|96|Urdu
Diwan-e-Ghalib|Mirza Ghalib|1841|Poetry|240|Urdu
Bang-e-Dra|Muhammad Iqbal|1924|Poetry|288|Urdu
Raja Gidh|Bano Qudsia|1981|Drama|560|Urdu
"""

PUBLISHERS = {
    "English": ["Penguin Random House", "HarperCollins", "Bloomsbury", "Pan Macmillan", "Hachette",
                "Simon & Schuster", "Vintage", "Oxford University Press", "Rupa Publications", "Westland"],
    "Hindi": ["Rajkamal Prakashan", "Vani Prakashan"],
    "Marathi": ["Mehta Publishing House", "Continental Prakashan"],
    "French": ["Gallimard", "Le Livre de Poche"],
    "German": ["Suhrkamp", "Fischer Verlag"],
    "Urdu": ["Rekhta Books", "Sang-e-Meel"],
}

BLURBS = {
    "Self Help": "Practical, readable advice for building better habits and a calmer, more effective life.",
    "Motivation": "An energising read about ambition, resilience and turning goals into results.",
    "Personal Development": "Ideas and tools for thinking clearly, working well and growing on purpose.",
    "Health": "An accessible look at the body, medicine and what really keeps us well.",
    "Healthy Living": "Food, movement and everyday choices that add up to a longer, healthier life.",
    "Wellness": "A gentle guide to balance, mindfulness and looking after your mind.",
    "Romance": "A story of love, longing and the choices that shape two lives.",
    "Drama": "A richly drawn story of people, place and the turning points of ordinary lives.",
    "Adventure": "A sweeping adventure of danger, discovery and courage far from home.",
    "Action": "Fast-paced and full of action, with high stakes on every page.",
    "Fantasy": "An imaginative journey into a world of magic, myth and wonder.",
    "Science Fiction": "A thought-provoking vision of the future and what it means to be human.",
    "Crime": "A gripping mystery full of clues, suspects and a twist you won't see coming.",
    "Thriller": "A tense, page-turning thriller that keeps the pressure on until the last chapter.",
    "Suspense": "A slow-burning tale of secrets and suspense.",
    "Horror": "A chilling tale that lingers long after the lights go out.",
    "History": "A vivid account of the people and events that shaped the world we live in.",
    "Science": "Big scientific ideas explained with clarity and wonder.",
    "Math": "A lively exploration of mathematical ideas and the people behind them.",
    "Textbook": "A trusted reference text, widely used by students and practitioners.",
    "Encyclopedia": "A wide-ranging reference work for quick facts and deep dives alike.",
    "Art": "An illuminating look at art, creativity and the act of seeing.",
    "Poetry": "A celebrated collection of verse, rich in feeling and imagery.",
    "Travel": "A memorable journey across landscapes, cultures and the self.",
    "Comic Book": "A landmark work of graphic storytelling.",
    "Autobiography": "A candid life story told with honesty and insight.",
}


LIMIT = 300


def parse():
    lines = [l for l in BOOKS.strip().splitlines() if l.strip()]
    # Keep the first three (they have covers in the repo), then a fixed random pick of the rest, in list order.
    keep = set(range(3)) | set(random.Random(7).sample(range(3, len(lines)), LIMIT - 3))
    books = []
    for line in (l for i, l in enumerate(lines) if i in keep):
        parts = [p.strip() for p in line.split("|")]
        title, author, year, genres, pages = parts[:5]
        lang = parts[5] if len(parts) > 5 else "English"
        books.append({"id": f"B{101 + len(books)}", "title": title, "author": author, "year": int(year),
                      "genres": genres, "pages": int(pages), "lang": lang})
    return books


def fetch(url, timeout=25):
    # curl uses the OS certificate store, which works on Windows where Python's bundled certs often don't.
    for attempt in range(3):
        r = subprocess.run(["curl", "-sSL", "-m", str(timeout), "-A", UA["User-Agent"], "-w", "\n%{http_code}", url],
                           capture_output=True)
        body, _, code = r.stdout.rpartition(b"\n")
        if r.returncode == 0 and code == b"200":
            return body
        if code == b"404":
            return None
        time.sleep(2 + attempt * 3)
    return None


def cover_id(book):
    queries = [{"title": book["title"], "author": book["author"]}, {"q": f'{book["title"]} {book["author"]}'}]
    for q in queries:
        q.update(limit="5", fields="cover_i")
        data = fetch("https://openlibrary.org/search.json?" + urllib.parse.urlencode(q))
        if not data:
            continue
        for doc in json.loads(data).get("docs", []):
            if doc.get("cover_i"):
                return doc["cover_i"]
    return None


def download_cover(book):
    dest = COVERS / f'{book["id"]}.jpg'
    if dest.exists() and dest.stat().st_size > 2000:
        return book["id"], True
    cid = cover_id(book)
    if cid:
        img = fetch(f"https://covers.openlibrary.org/b/id/{cid}-L.jpg?default=false")
        # Only keep real JPEGs of a sensible size (no 1x1 placeholders, no HTML error pages).
        if img and img[:3] == b"\xff\xd8\xff" and len(img) > 2000:
            dest.write_bytes(img)
            return book["id"], True
    return book["id"], False


def sql_str(v):
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"


def main():
    books = parse()
    fixed = {"B101": "b1.jpg", "B102": "b2.jpg", "B103": "b3.jpg"}
    have = set(fixed)
    if "--no-covers" not in sys.argv:
        todo = [b for b in books if b["id"] not in fixed]
        done = 0
        with ThreadPoolExecutor(max_workers=6) as pool:
            for bid, ok in pool.map(download_cover, todo):
                done += 1
                if ok:
                    have.add(bid)
                if done % 25 == 0:
                    print(f"  covers: {done}/{len(todo)} checked, {len(have) - 3} found", flush=True)
    else:
        have |= {b["id"] for b in books if (COVERS / f'{b["id"]}.jpg').exists()}

    rnd = random.Random(42)
    authors = sorted({b["author"] for b in books})
    pubs_used = {}
    lines = ["-- ~300-book catalog generated by server/db/seed_books.py. Do not edit by hand.",
             "-- Loaded automatically into an empty database by com.elibrary.db.DataSeeder.", ""]
    rows = []
    for b in books:
        pub = rnd.choice(PUBLISHERS[b["lang"]])
        pubs_used.setdefault(pub, None)
        month, day = rnd.randint(1, 12), rnd.randint(1, 28)
        stock = rnd.randint(1, 8)
        cost = max(99, round((b["pages"] * 0.8 + rnd.randint(80, 320)) / 10) * 10 - 1)
        first = b["genres"].split(",")[0]
        desc = f'{BLURBS[first]} First published in {b["year"]}, by {b["author"]}.'
        img = fixed.get(b["id"]) or (f'{b["id"]}.jpg' if b["id"] in have else "books1.png")
        rows.append("(" + ", ".join(map(sql_str, [
            b["id"], b["title"], b["genres"], b["author"], pub, f'{b["year"]:04d}-{month:02d}-{day:02d}',
            b["lang"], rnd.randint(1, 5)])) + f', {cost}, {b["pages"]}, {sql_str(desc)}, {stock}, {stock}, '
            + sql_str(f"~/book_inventory/{img}") + ")")

    lines.append("INSERT INTO author_master_tbl (author_id, author_name) VALUES")
    lines.append(",\n".join(f" ({sql_str(f'A{i + 1}')}, {sql_str(a)})" for i, a in enumerate(authors)) + ";\n")
    lines.append("INSERT INTO publisher_master_tbl (publisher_id, publisher_name) VALUES")
    lines.append(",\n".join(f" ({sql_str(f'P{i + 1}')}, {sql_str(p)})" for i, p in enumerate(pubs_used)) + ";\n")
    lines.append("INSERT INTO book_master_tbl (book_id, book_name, genre, author_name, publisher_name, publish_date, "
                 "language, edition, book_cost, no_of_pages, book_description, actual_stock, current_stock, book_img_link) VALUES")
    lines.append(",\n".join(" " + r for r in rows) + ";")
    OUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    OUT_SQL.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(books)} books, {len(authors)} authors, {len(pubs_used)} publishers, "
          f"{len(have)} real covers -> {OUT_SQL.name}")


if __name__ == "__main__":
    main()

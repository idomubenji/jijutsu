To answer your query about the data tables we should use for your kanji-based "Alchemy" game, I’ve designed a set of tables that support the core gameplay—mixing radicals to form kanji and kanji to form compounds—while also handling user progress for both anonymous and registered users. Below is a complete and self-contained outline of the recommended data tables, tailored for use with Supabase and your NextJS application.
Recommended Data Tables
1. Radicals
Description: Stores the basic building blocks (radicals) that players use to create kanji.
Columns:
id (Primary Key, auto-incremented)
name (e.g., "水" for water, "火" for fire)
meaning (e.g., "water", "fire")
stroke_count (optional, e.g., 4 for educational purposes)
Purpose: Acts as the starting elements available to all players for combining into kanji.
2. Kanji
Description: Stores the kanji characters that players can discover by combining radicals.
Columns:
id (Primary Key, auto-incremented)
character (e.g., "明" for bright, "話" for speech)
meanings (array or JSON, e.g., ["bright", "clear"])
on_readings (array or JSON, e.g., ["メイ", "ミョウ"])
kun_readings (array or JSON, e.g., ["あか.るい"])
Purpose: Represents the kanji that players unlock and can later use to form compounds.
3. Kanji_Radicals (Junction Table)
Description: Links kanji to the radicals they are composed of, defining valid combinations.
Columns:
kanji_id (Foreign Key referencing Kanji.id)
radical_id (Foreign Key referencing Radicals.id)
Constraints: Composite Primary Key (kanji_id, radical_id) to prevent duplicate entries.
Purpose: Enables the game to check which radicals form a specific kanji.
4. Compounds
Description: Stores compound words (jukugo) that players can discover by combining kanji.
Columns:
id (Primary Key, auto-incremented)
word (e.g., "電話" for telephone, "学校" for school)
meaning (e.g., "telephone", "school")
readings (array or JSON, e.g., ["でんわ", "ガッコウ"])
Purpose: Represents the compounds players can unlock through gameplay.
5. Compound_Kanji (Junction Table)
Description: Links compounds to the kanji they are composed of, defining valid combinations.
Columns:
compound_id (Foreign Key referencing Compounds.id)
kanji_id (Foreign Key referencing Kanji.id)
Constraints: Composite Primary Key (compound_id, kanji_id) to prevent duplicate entries.
Purpose: Enables the game to check which kanji form a specific compound.
6. Users
Description: Stores information for both anonymous and registered users.
Columns:
id (Primary Key, UUID or auto-incremented)
email (unique, required for registered users, nullable for anonymous)
is_anonymous (boolean, default true for temporary users)
created_at (timestamp)
Purpose: Manages user accounts and links progress, supporting Supabase’s anonymous authentication.
7. User_Kanji_Progress
Description: Tracks which kanji each user has discovered.
Columns:
user_id (Foreign Key referencing Users.id)
kanji_id (Foreign Key referencing Kanji.id)
discovered_at (timestamp)
Constraints: Composite Primary Key (user_id, kanji_id)
Purpose: Saves each user’s kanji discovery progress.
8. User_Compound_Progress
Description: Tracks which compounds each user has discovered.
Columns:
user_id (Foreign Key referencing Users.id)
compound_id (Foreign Key referencing Compounds.id)
discovered_at (timestamp)
Constraints: Composite Primary Key (user_id, compound_id)
Purpose: Saves each user’s compound discovery progress.
How These Tables Work Together
Gameplay:
Players start with all Radicals available.
They combine radicals to discover Kanji, validated using the Kanji_Radicals table.
Discovered kanji are recorded in User_Kanji_Progress.
Players then combine discovered kanji to form Compounds, validated using the Compound_Kanji table.
Discovered compounds are recorded in User_Compound_Progress.
User Management:
Non-logged-in players are assigned an anonymous user ID via Supabase’s anonymous authentication, stored in Users with is_anonymous = true.
Their progress is saved in User_Kanji_Progress and User_Compound_Progress under this ID.
When they sign up, their anonymous account can be converted to a registered one, transferring their progress seamlessly.
Combination Checking:
To verify a radical combination, query Kanji_Radicals to find a kanji that exactly matches the selected radicals.
To verify a kanji combination, query Compound_Kanji to find a compound that exactly matches the selected kanji.
For simplicity, the order of selection is ignored (combinations are treated as sets).
Additional Notes
Indexes: Add indexes on foreign keys (e.g., kanji_id, radical_id, user_id) to optimize queries for progress tracking and combination validation.
Progress Limits: For anonymous users, you could enforce a soft limit (e.g., 500 discoveries) in the game logic, prompting them to sign up to save further progress, while keeping all data intact in the database.
Scalability: Start with a manageable dataset (e.g., 50 radicals, 100 kanji, 50 compounds) and expand as needed.
Example Schema (Supabase SQL)
Here’s a basic SQL setup for these tables in Supabase:
sql
CREATE TABLE Radicals (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    meaning TEXT,
    stroke_count INTEGER
);

CREATE TABLE Kanji (
    id SERIAL PRIMARY KEY,
    character TEXT NOT NULL,
    meanings JSONB,
    on_readings JSONB,
    kun_readings JSONB
);

CREATE TABLE Kanji_Radicals (
    kanji_id INTEGER REFERENCES Kanji(id),
    radical_id INTEGER REFERENCES Radicals(id),
    PRIMARY KEY (kanji_id, radical_id)
);

CREATE TABLE Compounds (
    id SERIAL PRIMARY KEY,
    word TEXT NOT NULL,
    meaning TEXT,
    readings JSONB
);

CREATE TABLE Compound_Kanji (
    compound_id INTEGER REFERENCES Compounds(id),
    kanji_id INTEGER REFERENCES Kanji(id),
    PRIMARY KEY (compound_id, kanji_id)
);

CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    is_anonymous BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE User_Kanji_Progress (
    user_id UUID REFERENCES Users(id),
    kanji_id INTEGER REFERENCES Kanji(id),
    discovered_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, kanji_id)
);

CREATE TABLE User_Compound_Progress (
    user_id UUID REFERENCES Users(id),
    compound_id INTEGER REFERENCES Compounds(id),
    discovered_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, compound_id)
);
Summary
These eight tables—Radicals, Kanji, Kanji_Radicals, Compounds, Compound_Kanji, Users, User_Kanji_Progress, and User_Compound_Progress—provide a solid foundation for your game. They support the core mechanics, user progress tracking, and a seamless experience for both anonymous and registered players. Let me know if you need help with implementation or further adjustments!g
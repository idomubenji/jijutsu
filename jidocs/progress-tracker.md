Hello.

Our goal is to chart the progress of a user in our kanji game.

Right now, when users discover kanji, it shows up in the side bar in our game/page.tsx .

We want this kanji to also update the corresponding kanji in our kanji dex.

The kanji dex can be found in the kanji_dex table of our Supabase. Specifically, you want to reference the kanji varchar (to find the discovered kanji) and the dex_number int4 (to see which dex number needs to be updated in the dex).

For now, I suppose this will be stored in the cache, but eventually we want to store it in a new table.

This table will b called user_kanji, and will be a junction table to keep track of the kanji the users have unlocked. It will be something like:

```sql
CREATE TABLE user_kanji (
    user_id integer REFERENCES users(id),
    kanji_id integer REFERENCES kanji_dex(id),
    PRIMARY KEY (user_id, kanji_id) -- Ensures no duplicates
);
```

It could also be good to have a "discovered_at" column. 

Only authenticated users will add this to their table.

When unlocking a kanji, you will insert into our junction table with something like

```sql
INSERT INTO user_kanji (user_id, kanji_id) VALUES (<user_id>, <kanji_id>);
```

After that, when we are viewing the dex, we can see what kanji we have earned through querying this table.
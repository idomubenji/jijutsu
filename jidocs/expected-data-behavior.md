Essentially, our data flow should be as follows.

Authenticated user signs in.

The user's "Discovered Kanji" is found by querying the user_kanji junction table. The users.user_id (uuid) is connected to a kanji_dex.id (uuid). By querying this user_kanji table, you can learn what kanji "belong" to a user.

This results in a few different behaviors.

First, the user's kanji is shown on @src/app/game/page.tsx under the "Discovered Kanji" area of the sidebar. There is also a "reset" button on this sidebar that should delete all the user's kanji relationships from teh user_kanji table, so they can restart the game if they desire.

The user's kanji is also shown in the @src/app/dex/page.tsx in the grid. The kanji show up in the corresponding number on the grid. When a user clicks a kanji that belongs to them, a modal flys in to tell them more information about the kanji. This also happens when the user right-clicks the kanji on the game/page.tsx
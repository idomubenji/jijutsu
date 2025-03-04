Here are the rules for how we merge radicals to form kanji.

You will be referencing @kanjiRadicals.json. Specifically, you will look for the "kanjiToRadicals" object.

This object will have a list of kanji decomposed into the radicals we want to search for.

When a user merges two or more radicals, this function will search this list for kanji that contain this exact set of radicals.

If a kanji only includes one radical in the set, merging two of that radical will generate that kanji.

We want to find all kanji matching the set of radicals being merged, so please consult the entire list every time you search for matches.

---

Example:

Merging two instances of "口" together will result in "品", "圖", "囗", and any other kanji made up with "囗" as the sole criterion. Please reference the objects below for why this is the case.

    "品": [
      "口"
    ]

    "圖": [
      "口"
    ]

     "囗": [
      "口"
    ]
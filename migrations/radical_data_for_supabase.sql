-- Create the radical_dex table for storing kanji radicals information
CREATE TABLE radical_dex (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dex_number INTEGER NOT NULL UNIQUE,
  radical_number INTEGER NOT NULL,
  radical_shape VARCHAR(255) NOT NULL,
  english_name VARCHAR(255) NOT NULL,
  stroke_count INTEGER NOT NULL,
  reading VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Set up Row Level Security for radical_dex table
ALTER TABLE radical_dex ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read radical data
CREATE POLICY "Authenticated users can read radical data" 
  ON radical_dex FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only allow service role to insert, update, delete
CREATE POLICY "Only service role can modify radical data" 
  ON radical_dex FOR ALL
  USING (auth.role() = 'service_role');

-- Create index on radical_number for faster lookups
CREATE INDEX radical_number_idx ON radical_dex (radical_number);

-- Create index on stroke_count for filtering
CREATE INDEX stroke_count_idx ON radical_dex (stroke_count);

-- Create index on dex_number for faster lookups
CREATE INDEX dex_number_idx ON radical_dex (dex_number);

-- Add a comment to the table
COMMENT ON TABLE radical_dex IS 'Table containing the Japanese kanji radicals data';

-- Now insert the radical data

-- Populate radical_dex from data/radical_data_final.json
-- Run the following INSERT statements after the table is created -- Populate the radical_dex table with data from radical_data_final.json

-- Radical 1
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('1', '一', 'one', 1, 'いち');

-- Radical 2
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('2', '｜', 'unspecified', 1, NULL);

-- Radical 3
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('3', '丶', 'a dot', 1, 'てん');

-- Radical 4
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('4', 'ノ', 'a stroke curved to the left', 1, 'の');

-- Radical 5
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('5', '乙', 'a bend stroke', 1, 'おつ');

-- Radical 6
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('6', '亅', 'a hook', 1, 'はねぼう');

-- Radical 7
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('7', '二', 'two', 2, 'に');

-- Radical 8
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('8', '亠', 'head, above, lid', 2, 'なべぶた');

-- Radical 9
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('9', '人', 'man, a person', 2, 'ひと');

-- Radical 10
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('9', '亻', 'man, a person', 2, 'にんべん');

-- Radical 11
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('9', '𠆢', 'man, a person', 2, 'ひとやね');

-- Radical 12
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('10', '儿', 'legs', 2, 'ひとあし');

-- Radical 13
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('11', '入', 'entering, starting', 2, 'いる');

-- Radical 14
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('12', 'ハ', 'eight', 2, 'はち');

-- Radical 15
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('13', '冂', 'down box, wilderness', 2, 'けいがまえ');

-- Radical 16
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('14', '冖', 'cover', 2, 'わかんむり');

-- Radical 17
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('15', '冫', 'two dots', 2, 'にすい');

-- Radical 18
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('16', '几', 'small table', 2, 'きにょう');

-- Radical 19
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('17', '凵', 'container, wide opened mouth', 2, 'かんにょう');

-- Radical 20
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('18', '刀', 'knife, sword, cutting, separating', 2, 'かたな');

-- Radical 21
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('21', '刂', 'knife, sword, cutting, separating', 2, 'かたな');

-- Radical 22
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('19', '力', 'strength, force', 2, 'ちから');

-- Radical 23
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('20', '勹', 'wrap, embrace', 2, 'つつみがまえ');

-- Radical 24
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('21', '匕', 'spoon, ladle', 2, 'さじ');

-- Radical 25
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('22', '匚', 'square box', 2, 'はこがまえ');

-- Radical 26
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('24', '十', 'ten', 2, 'じゅう');

-- Radical 27
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('27', '卜', 'divination, fortune-telling', 2, 'おみずき');

-- Radical 28
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('26', '卩', 'seal, stamp', 2, 'ふしづくり');

-- Radical 29
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('27', '厂', 'cliff', 2, 'がんだれ');

-- Radical 30
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('28', '厶', 'self, private', 2, 'む');

-- Radical 31
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('29', '又', 'grasping, further, again', 2, 'また');

-- Radical 32
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('32', 'マ', 'unspecified', 2, NULL);

-- Radical 33
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('33', '九', 'nine', 2, 'く');

-- Radical 34
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('34', 'ユ', 'unspecified', 2, NULL);

-- Radical 35
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('35', '乃', 'unspecified', 2, NULL);

-- Radical 36
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('36', '𠂉', 'Lid', 2, NULL);

-- Radical 37
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('162', '辶', 'stamping on the earth, going', 4, 'め');

-- Radical 38
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('30', '口', 'mouth, opening, sounding', 3, 'くち');

-- Radical 39
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('31', '囗', 'enclosure', 3, 'くにがまえ');

-- Radical 40
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('32', '土', 'earth, soil', 3, 'つち');

-- Radical 41
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('33', '士', 'official, scholar', 3, 'さむらい');

-- Radical 42
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('42', '夂', 'walking slowly', 3, NULL);

-- Radical 43
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('36', '夕', 'evening', 3, 'ゆうべ');

-- Radical 44
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('37', '大', 'big, large', 3, 'だい');

-- Radical 45
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('38', '女', 'woman, female', 3, 'おんな');

-- Radical 46
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('39', '子', 'child, son, seed', 3, 'こ');

-- Radical 47
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('40', '宀', 'roof, cover', 3, 'うかんむり');

-- Radical 48
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('41', '寸', 'inch', 3, 'すん');

-- Radical 49
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('42', '小', 'small', 3, 'しょう');

-- Radical 50
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('42', '⺌', 'small', 3, 'しょうかんむり');

-- Radical 51
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('43', '尢', 'lame', 3, NULL);

-- Radical 52
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('44', '尸', 'corpse, body', 3, 'しかばね');

-- Radical 53
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('45', '屮', 'sprout', 3, 'くさのめ');

-- Radical 54
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('46', '山', 'mountain, cliff', 3, 'やま');

-- Radical 55
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('47', '川', 'river, stream', 3, 'さんぼんがわ');

-- Radical 56
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('47', '巛', 'river, stream', 3, 'まがりがわ');

-- Radical 57
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('48', '工', 'work', 3, 'たくみ');

-- Radical 58
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('58', '已', 'self, own', 3, 'おのれ');

-- Radical 59
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('50', '巾', 'towel, napkin, turban', 3, 'はば');

-- Radical 60
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('51', '干', 'dried', 3, 'かん');

-- Radical 61
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('52', '幺', 'short, tiny', 3, 'いとがしら');

-- Radical 62
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('53', '广', 'house built at a slope, dotted cliff', 3, 'まだれ');

-- Radical 63
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('54', '廴', 'walking a long distance', 3, 'えんにょう');

-- Radical 64
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('55', '廾', 'two hands (at bottom of character)', 3, 'にじゅうあし');

-- Radical 65
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('56', '弋', 'shoot', 3, 'いぐるみ');

-- Radical 66
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('57', '弓', 'bow', 3, 'ゆみ');

-- Radical 67
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('67', 'ヨ', 'pig head', 3, 'けいがしら');

-- Radical 68
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('68', '彑', 'pig head', 3, 'けいがしら');

-- Radical 69
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('59', '彡', 'hair, feather', 3, 'さんづくり');

-- Radical 70
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('60', '彳', 'walking slowly', 3, 'ぎょうにんべん');

-- Radical 71
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('61', '忄', 'heart, feeling', 4, 'やまへん');

-- Radical 72
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('64', '扌', 'hand, actions', 4, 'さんぼんがわ');

-- Radical 73
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('73', '⺡', 'Water', 3, 'さんずい');

-- Radical 74
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('94', '犭', 'dog, dog-like animals', 4, 'いぬへん');

-- Radical 75
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('75', '艹', 'grass, plant', 3, 'くさかんむり');

-- Radical 76
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('163', '⻏', 'village, town', 3, 'おおざと');

-- Radical 77
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('77', '⻖', 'village, town', 3, 'こざとへん');

-- Radical 78
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('78', '也', 'also', 3, 'や');

-- Radical 79
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('23', '亡', 'round box', 3, 'かくしがまえ');

-- Radical 80
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('80', '及', 'and', 3, 'おんだん');

-- Radical 81
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('81', '久', 'long', 3, 'く');

-- Radical 82
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('82', '⺹', 'old, old-age', 4, 'おいかんむり');

-- Radical 83
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('61', '心', 'heart, feeling', 4, 'こころ');

-- Radical 84
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('62', '戈', 'axe, halberd', 4, 'ほこ');

-- Radical 85
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('63', '戸', 'house, door', 4, 'と');

-- Radical 86
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('64', '手', 'hand, actions', 4, 'て');

-- Radical 87
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('65', '支', 'branch', 4, 'しにょう');

-- Radical 88
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('66', '攵', 'whip', 4, 'ぼくづくり');

-- Radical 89
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('67', '文', 'word, literature', 4, 'ぶん');

-- Radical 90
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('68', '斗', 'a kind of volume measure', 4, 'ますづくり');

-- Radical 91
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('69', '斤', 'a kind of weight measure', 4, 'おのづくり');

-- Radical 92
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('70', '方', 'square, direction, locality', 4, 'ほう');

-- Radical 93
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('71', '无', 'do not, no', 4, 'むにょう');

-- Radical 94
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('72', '日', 'sun, clear', 4, 'ひ');

-- Radical 95
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('73', '曰', 'speaking', 4, 'ひらび');

-- Radical 96
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('74', '月', 'moon, month', 4, 'つき');

-- Radical 97
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('75', '木', 'tree, wood', 4, 'き');

-- Radical 98
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('76', '欠', 'yawn, lack', 4, 'あくび');

-- Radical 99
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('77', '止', 'stopping', 4, 'とめる');

-- Radical 100
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('78', '歹', 'dead, decay', 4, 'がつ');

-- Radical 101
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('79', '殳', 'halberd', 4, 'るまた');

-- Radical 102
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('81', '比', 'side by side, comparing', 4, 'くらべる');

-- Radical 103
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('82', '毛', 'hair, feather', 4, 'け');

-- Radical 104
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('83', '氏', 'clan', 4, 'うじ');

-- Radical 105
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('84', '气', 'air, breath', 4, 'きがまえ');

-- Radical 106
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('85', '水', 'water', 4, 'みず');

-- Radical 107
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('86', '火', 'fire', 4, 'ひ');

-- Radical 108
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('108', '⺣', 'fire', 4, 'れっか');

-- Radical 109
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('87', '爪', 'claw, hand', 4, 'つめ');

-- Radical 110
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('88', '父', 'father', 4, 'ちち');

-- Radical 111
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('89', '爻', 'mix, twine, cross', 4, 'こう');

-- Radical 112
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('90', '爿', 'half of a tree trunk, split wood', 4, 'しょうへん');

-- Radical 113
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('91', '片', 'slice, piece', 4, 'かた');

-- Radical 114
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('93', '牛', 'cow, ox', 4, 'うし');

-- Radical 115
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('94', '犬', 'dog, dog-like animals', 4, 'いぬ');

-- Radical 116
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('116', '⺭', 'altar, festival, religious service', 4, 'しめすへん');

-- Radical 117
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('96', '王', 'jade, stone, king, ball', 4, 'おうへん');

-- Radical 118
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('118', '元', 'original, beginning', 4, 'げん');

-- Radical 119
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('119', '井', 'well, pit', 4, 'せい');

-- Radical 120
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('120', '勿', 'do not, no', 4, NULL);

-- Radical 121
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('43', '尤', 'lame', 3, NULL);

-- Radical 122
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('122', '五', 'five', 4, 'ご');

-- Radical 123
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('123', '屯', 'village, town', 4, 'つむ');

-- Radical 124
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('124', '巴', 'claw, hand', 4, 'ば');

-- Radical 125
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('80', '毋', 'mother', 4, 'なかれ');

-- Radical 126
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('95', '玄', 'black, dark, profound', 5, 'げん');

-- Radical 127
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('98', '瓦', 'tile, earthenware', 5, 'かわら');

-- Radical 128
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('99', '甘', 'sweet', 5, 'あまい');

-- Radical 129
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('100', '生', 'giving birth, live', 5, 'うまれる');

-- Radical 130
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('101', '用', 'using', 5, 'もちいる');

-- Radical 131
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('102', '田', 'field', 5, 'た');

-- Radical 132
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('103', '疋', 'roll, bolt of cloth', 5, 'ひき');

-- Radical 133
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('133', '⽧', 'sickness', 5, 'やまいだれ');

-- Radical 134
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('105', '癶', 'footsteps', 5, 'はつがしら');

-- Radical 135
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('106', '白', 'white', 5, 'しろ');

-- Radical 136
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('107', '皮', 'leather, skin', 5, 'けがわ');

-- Radical 137
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('108', '皿', 'dish, plate', 5, 'さら');

-- Radical 138
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('109', '目', 'eye', 5, 'め');

-- Radical 139
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('110', '矛', 'spear, pike', 5, 'ほこ');

-- Radical 140
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('111', '矢', 'arrow', 5, 'や');

-- Radical 141
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('112', '石', 'stone, rock', 5, 'いし');

-- Radical 142
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('113', '示', 'altar, display, spiritual, ancestor', 5, 'しめす');

-- Radical 143
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('143', '⽱', 'footprint', 5, 'じゅうのあし');

-- Radical 144
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('115', '禾', 'grain, ear', 5, 'のぎへん');

-- Radical 145
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('116', '穴', 'hollow, hole, hidden', 5, 'あな');

-- Radical 146
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('117', '立', 'stand, erect', 5, 'たつ');

-- Radical 147
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('147', '⻂', 'clothing', 5, 'ころもへん');

-- Radical 148
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('148', '世', 'world, generation', 5, 'せ');

-- Radical 149
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('149', '巨', 'retainer, minister', 5, 'しん');

-- Radical 150
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('150', '冊', 'book', 5, 'さつ');

-- Radical 151
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('151', '母', 'mother', 5, 'かあ');

-- Radical 152
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('152', '⺫', 'net', 5, 'あみがしら');

-- Radical 153
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('92', '牙', 'fang', 5, 'きば');

-- Radical 154
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('97', '瓜', 'pumpkin, melon', 6, 'うり');

-- Radical 155
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('118', '竹', 'bamboo', 6, 'たけ');

-- Radical 156
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('119', '米', 'rice', 6, 'こめ');

-- Radical 157
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('120', '糸', 'thread, fabric', 6, 'いと');

-- Radical 158
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('121', '缶', 'tin, can, jar', 6, 'みずがめ');

-- Radical 159
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('123', '羊', 'sheep, goat', 6, 'ひつじ');

-- Radical 160
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('124', '羽', 'wings, feather', 6, 'はね');

-- Radical 161
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('126', '而', 'moustache, beard', 6, 'しこうして');

-- Radical 162
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('127', '耒', 'handle of a plough', 6, 'らいすき');

-- Radical 163
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('128', '耳', 'ear', 6, 'みみ');

-- Radical 164
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('129', '聿', 'ink brush', 6, 'ふでづくり');

-- Radical 165
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('130', '肉', 'meat, organs of the body', 6, 'にく');

-- Radical 166
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('132', '自', 'nose, oneself', 6, 'みずから');

-- Radical 167
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('133', '至', 'arrive', 6, 'いたる');

-- Radical 168
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('134', '臼', 'mortar', 6, 'うす');

-- Radical 169
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('135', '舌', 'tongue', 6, 'した');

-- Radical 170
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('137', '舟', 'boat, ship', 6, 'きば');

-- Radical 171
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('138', '艮', 'stopping', 6, 'うし');

-- Radical 172
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('139', '色', 'color, outlook', 6, 'うしへん');

-- Radical 173
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('141', '虍', 'tiger', 6, 'とらがしら');

-- Radical 174
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('142', '虫', 'insect, creeping animal', 6, 'しめすへん');

-- Radical 175
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('143', '血', 'blood', 6, 'あみがしら');

-- Radical 176
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('144', '行', 'walk, row, line, journey', 6, 'おいかんむり');

-- Radical 177
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('145', '衣', 'clothing', 6, 'げん');

-- Radical 178
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('146', '西', 'cover, west', 6, 'にし');

-- Radical 179
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('131', '臣', 'minister, official', 7, 'しん');

-- Radical 180
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('147', '見', 'see', 7, 'みる');

-- Radical 181
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('148', '角', 'horn', 7, 'つの');

-- Radical 182
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('149', '言', 'speaking, speech', 7, 'げん');

-- Radical 183
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('150', '谷', 'valley', 7, 'うまれる');

-- Radical 184
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('151', '豆', 'bean', 7, 'まめ');

-- Radical 185
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('152', '豕', 'pig', 7, 'いのこ');

-- Radical 186
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('153', '豸', 'small hairy animals (cat, badger)', 7, 'むじなへん');

-- Radical 187
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('154', '貝', 'shell', 7, 'かい');

-- Radical 188
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('155', '赤', 'red, bare', 7, 'あか');

-- Radical 189
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('156', '走', 'run', 7, 'はしる');

-- Radical 190
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('157', '足', 'foot, leg, walking', 7, 'あし');

-- Radical 191
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('158', '身', 'body', 7, 'しろ');

-- Radical 192
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('159', '車', 'cart, car', 7, 'はくへん');

-- Radical 193
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('160', '辛', 'bitter', 7, 'からい');

-- Radical 194
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('161', '辰', 'morning', 7, 'さら');

-- Radical 195
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('195', '酉', 'wine, alcohol', 7, 'うさぎ');

-- Radical 196
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('165', '釆', 'distiguishing, separating', 7, 'ほこ');

-- Radical 197
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('166', '里', 'mile, village, hamlet', 7, 'ほこへん');

-- Radical 198
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('136', '舛', 'lying side by side, opposite', 7, 'かたへん');

-- Radical 199
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('199', '麦', 'wheat', 7, 'むぎ');

-- Radical 200
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('167', '金', 'metal, gold', 8, 'や');

-- Radical 201
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('168', '長', 'long, hair', 8, 'やへん');

-- Radical 202
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('169', '門', 'door, gate', 8, 'いし');

-- Radical 203
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('171', '隶', 'slave, reaching, catching', 8, 'しめす');

-- Radical 204
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('172', '隹', 'small bird', 8, 'じゅうのあし');

-- Radical 205
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('173', '雨', 'rain', 8, 'のぎへん');

-- Radical 206
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('174', '青', 'blue, green', 8, 'あお');

-- Radical 207
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('175', '非', 'wrong', 8, 'あらず');

-- Radical 208
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('208', '奄', 'cover', 8, 'あき');

-- Radical 209
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('209', '岡', 'hill', 8, 'おか');

-- Radical 210
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('210', '免', 'exemption', 8, 'めん');

-- Radical 211
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('210', '斉', 'equal, alike', 8, 'あき');

-- Radical 212
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('176', '面', 'face', 9, 'めん');

-- Radical 213
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('177', '革', 'skin, leather, changing', 9, 'いくりがわ');

-- Radical 214
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('179', '韭', 'chives, scallion', 9, 'にら');

-- Radical 215
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('180', '音', 'sound', 9, 'したみず');

-- Radical 216
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('181', '頁', 'big shell', 9, 'おおがい');

-- Radical 217
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('182', '風', 'wind', 9, 'かぜ');

-- Radical 218
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('183', '飛', 'fly', 9, 'とぶ');

-- Radical 219
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('184', '食', 'eat, food', 9, 'しょく');

-- Radical 220
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('185', '首', 'neck, head', 9, 'くび');

-- Radical 221
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('186', '香', 'odor, perfume', 9, 'かおり');

-- Radical 222
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('222', '品', 'quality, character', 9, 'ひよう');

-- Radical 223
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('187', '馬', 'horse', 10, 'うま');

-- Radical 224
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('188', '骨', 'bone', 10, 'ほね');

-- Radical 225
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('189', '高', 'tall, high', 10, 'いと');

-- Radical 226
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('190', '髟', 'long hair', 10, 'かみかんむり');

-- Radical 227
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('191', '鬥', 'fight, battle', 10, 'たたかいがまえ');

-- Radical 228
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('192', '鬯', 'sacrificial wine', 10, 'においざけ');

-- Radical 229
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('193', '鬲', 'tripod, cauldron', 10, 'れき');

-- Radical 230
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('194', '鬼', 'ghost, spirit', 10, 'おに');

-- Radical 231
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('212', '竜', 'dragon', 10, 'りゅう');

-- Radical 232
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('178', '韋', 'tanned leather', 10, 'なめしがわ');

-- Radical 233
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('195', '魚', 'fish', 11, 'うお');

-- Radical 234
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('196', '鳥', 'bird', 11, 'とり');

-- Radical 235
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('197', '鹵', 'salt', 11, 'しお');

-- Radical 236
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('198', '鹿', 'deer', 11, 'しか');

-- Radical 237
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('200', '麻', 'hemp', 11, 'あさ');

-- Radical 238
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('213', '亀', 'turtle', 11, 'かめ');

-- Radical 239
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('239', '啇', 'trade, business', 11, 'つうせい');

-- Radical 240
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('201', '黄', 'yellow', 11, 'き');

-- Radical 241
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('203', '黒', 'black', 11, 'くろ');

-- Radical 242
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('202', '黍', 'millet', 12, 'きび');

-- Radical 243
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('204', '黹', 'needlework', 12, 'ぬいとり');

-- Radical 244
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('244', '無', 'not', 12, 'む');

-- Radical 245
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('211', '歯', 'teeth', 12, 'は');

-- Radical 246
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('205', '黽', 'frog, amphibian', 13, 'かえる');

-- Radical 247
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('206', '鼎', 'sacrificial tripod, three-legged cauldron', 13, 'かなえ');

-- Radical 248
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('207', '鼓', 'drum', 13, 'つづみ');

-- Radical 249
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('208', '鼠', 'mouse, rat', 13, 'ねずみ');

-- Radical 250
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('209', '鼻', 'nose, self', 14, 'はな');

-- Radical 251
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('210', '齊', 'equal, alike', 14, 'せい');

-- Radical 252
INSERT INTO radical_dex (radical_number, radical_shape, english_name, stroke_count, reading)
VALUES ('214', '龠', 'flute', 17, 'やく');

-- Populate the radical_dex table with data from radical_data_final.json

-- Radical 1
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (1, '1', '一', 'one', 1, 'いち');

-- Radical 2
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (2, '2', '｜', 'unspecified', 1, NULL);

-- Radical 3
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (3, '3', '丶', 'a dot', 1, 'てん');

-- Radical 4
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (4, '4', 'ノ', 'a stroke curved to the left', 1, 'の');

-- Radical 5
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (5, '5', '乙', 'a bend stroke', 1, 'おつ');

-- Radical 6
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (6, '6', '亅', 'a hook', 1, 'はねぼう');

-- Radical 7
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (7, '7', '二', 'two', 2, 'に');

-- Radical 8
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (8, '8', '亠', 'head, above, lid', 2, 'なべぶた');

-- Radical 9
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (9, '9', '人', 'man, a person', 2, 'ひと');

-- Radical 10
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (10, '9', '亻', 'man, a person', 2, 'にんべん');

-- Radical 11
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (11, '9', '𠆢', 'man, a person', 2, 'ひとやね');

-- Radical 12
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (12, '10', '儿', 'legs', 2, 'ひとあし');

-- Radical 13
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (13, '11', '入', 'entering, starting', 2, 'いる');

-- Radical 14
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (14, '12', 'ハ', 'eight', 2, 'はち');

-- Radical 15
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (15, '13', '冂', 'down box, wilderness', 2, 'けいがまえ');

-- Radical 16
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (16, '14', '冖', 'cover', 2, 'わかんむり');

-- Radical 17
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (17, '15', '冫', 'two dots', 2, 'にすい');

-- Radical 18
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (18, '16', '几', 'small table', 2, 'きにょう');

-- Radical 19
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (19, '17', '凵', 'container, wide opened mouth', 2, 'かんにょう');

-- Radical 20
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (20, '18', '刀', 'knife, sword, cutting, separating', 2, 'かたな');

-- Radical 21
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (21, '21', '刂', 'knife, sword, cutting, separating', 2, 'かたな');

-- Radical 22
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (22, '19', '力', 'strength, force', 2, 'ちから');

-- Radical 23
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (23, '20', '勹', 'wrap, embrace', 2, 'つつみがまえ');

-- Radical 24
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (24, '21', '匕', 'spoon, ladle', 2, 'さじ');

-- Radical 25
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (25, '22', '匚', 'square box', 2, 'はこがまえ');

-- Radical 26
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (26, '24', '十', 'ten', 2, 'じゅう');

-- Radical 27
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (27, '27', '卜', 'divination, fortune-telling', 2, 'おみずき');

-- Radical 28
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (28, '26', '卩', 'seal, stamp', 2, 'ふしづくり');

-- Radical 29
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (29, '27', '厂', 'cliff', 2, 'がんだれ');

-- Radical 30
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (30, '28', '厶', 'self, private', 2, 'む');

-- Radical 31
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (31, '29', '又', 'grasping, further, again', 2, 'また');

-- Radical 32
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (32, '32', 'マ', 'unspecified', 2, NULL);

-- Radical 33
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (33, '33', '九', 'nine', 2, 'く');

-- Radical 34
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (34, '34', 'ユ', 'unspecified', 2, NULL);

-- Radical 35
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (35, '35', '乃', 'unspecified', 2, NULL);

-- Radical 36
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (36, '36', '𠂉', 'Lid', 2, NULL);

-- Radical 37
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (37, '162', '辶', 'stamping on the earth, going', 4, 'め');

-- Radical 38
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (38, '30', '口', 'mouth, opening, sounding', 3, 'くち');

-- Radical 39
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (39, '31', '囗', 'enclosure', 3, 'くにがまえ');

-- Radical 40
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (40, '32', '土', 'earth, soil', 3, 'つち');

-- Radical 41
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (41, '33', '士', 'official, scholar', 3, 'さむらい');

-- Radical 42
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (42, '42', '夂', 'walking slowly', 3, NULL);

-- Radical 43
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (43, '36', '夕', 'evening', 3, 'ゆうべ');

-- Radical 44
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (44, '37', '大', 'big, large', 3, 'だい');

-- Radical 45
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (45, '38', '女', 'woman, female', 3, 'おんな');

-- Radical 46
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (46, '39', '子', 'child, son, seed', 3, 'こ');

-- Radical 47
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (47, '40', '宀', 'roof, cover', 3, 'うかんむり');

-- Radical 48
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (48, '41', '寸', 'inch', 3, 'すん');

-- Radical 49
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (49, '42', '小', 'small', 3, 'しょう');

-- Radical 50
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (50, '42', '⺌', 'small', 3, 'しょうかんむり');

-- Radical 51
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (51, '43', '尢', 'lame', 3, NULL);

-- Radical 52
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (52, '44', '尸', 'corpse, body', 3, 'しかばね');

-- Radical 53
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (53, '45', '屮', 'sprout', 3, 'くさのめ');

-- Radical 54
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (54, '46', '山', 'mountain, cliff', 3, 'やま');

-- Radical 55
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (55, '47', '川', 'river, stream', 3, 'さんぼんがわ');

-- Radical 56
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (56, '47', '巛', 'river, stream', 3, 'まがりがわ');

-- Radical 57
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (57, '48', '工', 'work', 3, 'たくみ');

-- Radical 58
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (58, '58', '已', 'self, own', 3, 'おのれ');

-- Radical 59
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (59, '50', '巾', 'towel, napkin, turban', 3, 'はば');

-- Radical 60
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (60, '51', '干', 'dried', 3, 'かん');

-- Radical 61
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (61, '52', '幺', 'short, tiny', 3, 'いとがしら');

-- Radical 62
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (62, '53', '广', 'house built at a slope, dotted cliff', 3, 'まだれ');

-- Radical 63
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (63, '54', '廴', 'walking a long distance', 3, 'えんにょう');

-- Radical 64
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (64, '55', '廾', 'two hands (at bottom of character)', 3, 'にじゅうあし');

-- Radical 65
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (65, '56', '弋', 'shoot', 3, 'いぐるみ');

-- Radical 66
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (66, '57', '弓', 'bow', 3, 'ゆみ');

-- Radical 67
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (67, '67', 'ヨ', 'pig head', 3, 'けいがしら');

-- Radical 68
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (68, '68', '彑', 'pig head', 3, 'けいがしら');

-- Radical 69
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (69, '59', '彡', 'hair, feather', 3, 'さんづくり');

-- Radical 70
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (70, '60', '彳', 'walking slowly', 3, 'ぎょうにんべん');

-- Radical 71
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (71, '61', '忄', 'heart, feeling', 4, 'やまへん');

-- Radical 72
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (72, '64', '扌', 'hand, actions', 4, 'さんぼんがわ');

-- Radical 73
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (73, '73', '⺡', 'Water', 3, 'さんずい');

-- Radical 74
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (74, '94', '犭', 'dog, dog-like animals', 4, 'いぬへん');

-- Radical 75
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (75, '75', '艹', 'grass, plant', 3, 'くさかんむり');

-- Radical 76
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (76, '163', '⻏', 'village, town', 3, 'おおざと');

-- Radical 77
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (77, '77', '⻖', 'village, town', 3, 'こざとへん');

-- Radical 78
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (78, '78', '也', 'also', 3, 'や');

-- Radical 79
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (79, '23', '亡', 'round box', 3, 'かくしがまえ');

-- Radical 80
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (80, '80', '及', 'and', 3, 'おんだん');

-- Radical 81
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (81, '81', '久', 'long', 3, 'く');

-- Radical 82
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (82, '82', '⺹', 'old, old-age', 4, 'おいかんむり');

-- Radical 83
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (83, '61', '心', 'heart, feeling', 4, 'こころ');

-- Radical 84
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (84, '62', '戈', 'axe, halberd', 4, 'ほこ');

-- Radical 85
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (85, '63', '戸', 'house, door', 4, 'と');

-- Radical 86
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (86, '64', '手', 'hand, actions', 4, 'て');

-- Radical 87
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (87, '65', '支', 'branch', 4, 'しにょう');

-- Radical 88
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (88, '66', '攵', 'whip', 4, 'ぼくづくり');

-- Radical 89
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (89, '67', '文', 'word, literature', 4, 'ぶん');

-- Radical 90
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (90, '68', '斗', 'a kind of volume measure', 4, 'ますづくり');

-- Radical 91
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (91, '69', '斤', 'a kind of weight measure', 4, 'おのづくり');

-- Radical 92
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (92, '70', '方', 'square, direction, locality', 4, 'ほう');

-- Radical 93
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (93, '71', '无', 'do not, no', 4, 'むにょう');

-- Radical 94
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (94, '72', '日', 'sun, clear', 4, 'ひ');

-- Radical 95
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (95, '73', '曰', 'speaking', 4, 'ひらび');

-- Radical 96
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (96, '74', '月', 'moon, month', 4, 'つき');

-- Radical 97
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (97, '75', '木', 'tree, wood', 4, 'き');

-- Radical 98
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (98, '76', '欠', 'yawn, lack', 4, 'あくび');

-- Radical 99
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (99, '77', '止', 'stopping', 4, 'とめる');

-- Radical 100
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (100, '78', '歹', 'dead, decay', 4, 'がつ');

-- Radical 101
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (101, '79', '殳', 'halberd', 4, 'るまた');

-- Radical 102
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (102, '81', '比', 'side by side, comparing', 4, 'くらべる');

-- Radical 103
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (103, '82', '毛', 'hair, feather', 4, 'け');

-- Radical 104
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (104, '83', '氏', 'clan', 4, 'うじ');

-- Radical 105
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (105, '84', '气', 'air, breath', 4, 'きがまえ');

-- Radical 106
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (106, '85', '水', 'water', 4, 'みず');

-- Radical 107
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (107, '86', '火', 'fire', 4, 'ひ');

-- Radical 108
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (108, '108', '⺣', 'fire', 4, 'れっか');

-- Radical 109
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (109, '87', '爪', 'claw, hand', 4, 'つめ');

-- Radical 110
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (110, '88', '父', 'father', 4, 'ちち');

-- Radical 111
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (111, '89', '爻', 'mix, twine, cross', 4, 'こう');

-- Radical 112
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (112, '90', '爿', 'half of a tree trunk, split wood', 4, 'しょうへん');

-- Radical 113
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (113, '91', '片', 'slice, piece', 4, 'かた');

-- Radical 114
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (114, '93', '牛', 'cow, ox', 4, 'うし');

-- Radical 115
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (115, '94', '犬', 'dog, dog-like animals', 4, 'いぬ');

-- Radical 116
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (116, '116', '⺭', 'altar, festival, religious service', 4, 'しめすへん');

-- Radical 117
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (117, '96', '王', 'jade, stone, king, ball', 4, 'おうへん');

-- Radical 118
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (118, '118', '元', 'original, beginning', 4, 'げん');

-- Radical 119
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (119, '119', '井', 'well, pit', 4, 'せい');

-- Radical 120
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (120, '120', '勿', 'do not, no', 4, NULL);

-- Radical 121
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (121, '43', '尤', 'lame', 3, NULL);

-- Radical 122
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (122, '122', '五', 'five', 4, 'ご');

-- Radical 123
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (123, '123', '屯', 'village, town', 4, 'つむ');

-- Radical 124
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (124, '124', '巴', 'claw, hand', 4, 'ば');

-- Radical 125
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (125, '80', '毋', 'mother', 4, 'なかれ');

-- Radical 126
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (126, '95', '玄', 'black, dark, profound', 5, 'げん');

-- Radical 127
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (127, '98', '瓦', 'tile, earthenware', 5, 'かわら');

-- Radical 128
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (128, '99', '甘', 'sweet', 5, 'あまい');

-- Radical 129
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (129, '100', '生', 'giving birth, live', 5, 'うまれる');

-- Radical 130
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (130, '101', '用', 'using', 5, 'もちいる');

-- Radical 131
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (131, '102', '田', 'field', 5, 'た');

-- Radical 132
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (132, '103', '疋', 'roll, bolt of cloth', 5, 'ひき');

-- Radical 133
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (133, '133', '⽧', 'sickness', 5, 'やまいだれ');

-- Radical 134
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (134, '105', '癶', 'footsteps', 5, 'はつがしら');

-- Radical 135
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (135, '106', '白', 'white', 5, 'しろ');

-- Radical 136
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (136, '107', '皮', 'leather, skin', 5, 'けがわ');

-- Radical 137
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (137, '108', '皿', 'dish, plate', 5, 'さら');

-- Radical 138
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (138, '109', '目', 'eye', 5, 'め');

-- Radical 139
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (139, '110', '矛', 'spear, pike', 5, 'ほこ');

-- Radical 140
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (140, '111', '矢', 'arrow', 5, 'や');

-- Radical 141
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (141, '112', '石', 'stone, rock', 5, 'いし');

-- Radical 142
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (142, '113', '示', 'altar, display, spiritual, ancestor', 5, 'しめす');

-- Radical 143
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (143, '143', '⽱', 'footprint', 5, 'じゅうのあし');

-- Radical 144
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (144, '115', '禾', 'grain, ear', 5, 'のぎへん');

-- Radical 145
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (145, '116', '穴', 'hollow, hole, hidden', 5, 'あな');

-- Radical 146
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (146, '117', '立', 'stand, erect', 5, 'たつ');

-- Radical 147
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (147, '147', '⻂', 'clothing', 5, 'ころもへん');

-- Radical 148
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (148, '148', '世', 'world, generation', 5, 'せ');

-- Radical 149
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (149, '149', '巨', 'retainer, minister', 5, 'しん');

-- Radical 150
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (150, '150', '冊', 'book', 5, 'さつ');

-- Radical 151
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (151, '151', '母', 'mother', 5, 'かあ');

-- Radical 152
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (152, '152', '⺫', 'net', 5, 'あみがしら');

-- Radical 153
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (153, '92', '牙', 'fang', 5, 'きば');

-- Radical 154
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (154, '97', '瓜', 'pumpkin, melon', 6, 'うり');

-- Radical 155
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (155, '118', '竹', 'bamboo', 6, 'たけ');

-- Radical 156
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (156, '119', '米', 'rice', 6, 'こめ');

-- Radical 157
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (157, '120', '糸', 'thread, fabric', 6, 'いと');

-- Radical 158
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (158, '121', '缶', 'tin, can, jar', 6, 'みずがめ');

-- Radical 159
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (159, '123', '羊', 'sheep, goat', 6, 'ひつじ');

-- Radical 160
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (160, '124', '羽', 'wings, feather', 6, 'はね');

-- Radical 161
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (161, '126', '而', 'moustache, beard', 6, 'しこうして');

-- Radical 162
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (162, '127', '耒', 'handle of a plough', 6, 'らいすき');

-- Radical 163
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (163, '128', '耳', 'ear', 6, 'みみ');

-- Radical 164
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (164, '129', '聿', 'ink brush', 6, 'ふでづくり');

-- Radical 165
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (165, '130', '肉', 'meat, organs of the body', 6, 'にく');

-- Radical 166
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (166, '132', '自', 'nose, oneself', 6, 'みずから');

-- Radical 167
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (167, '133', '至', 'arrive', 6, 'いたる');

-- Radical 168
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (168, '134', '臼', 'mortar', 6, 'うす');

-- Radical 169
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (169, '135', '舌', 'tongue', 6, 'した');

-- Radical 170
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (170, '137', '舟', 'boat, ship', 6, 'きば');

-- Radical 171
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (171, '138', '艮', 'stopping', 6, 'うし');

-- Radical 172
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (172, '139', '色', 'color, outlook', 6, 'うしへん');

-- Radical 173
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (173, '141', '虍', 'tiger', 6, 'とらがしら');

-- Radical 174
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (174, '142', '虫', 'insect, creeping animal', 6, 'しめすへん');

-- Radical 175
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (175, '143', '血', 'blood', 6, 'あみがしら');

-- Radical 176
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (176, '144', '行', 'walk, row, line, journey', 6, 'おいかんむり');

-- Radical 177
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (177, '145', '衣', 'clothing', 6, 'げん');

-- Radical 178
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (178, '146', '西', 'cover, west', 6, 'にし');

-- Radical 179
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (179, '131', '臣', 'minister, official', 7, 'しん');

-- Radical 180
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (180, '147', '見', 'see', 7, 'みる');

-- Radical 181
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (181, '148', '角', 'horn', 7, 'つの');

-- Radical 182
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (182, '149', '言', 'speaking, speech', 7, 'げん');

-- Radical 183
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (183, '150', '谷', 'valley', 7, 'うまれる');

-- Radical 184
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (184, '151', '豆', 'bean', 7, 'まめ');

-- Radical 185
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (185, '152', '豕', 'pig', 7, 'いのこ');

-- Radical 186
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (186, '153', '豸', 'small hairy animals (cat, badger)', 7, 'むじなへん');

-- Radical 187
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (187, '154', '貝', 'shell', 7, 'かい');

-- Radical 188
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (188, '155', '赤', 'red, bare', 7, 'あか');

-- Radical 189
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (189, '156', '走', 'run', 7, 'はしる');

-- Radical 190
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (190, '157', '足', 'foot, leg, walking', 7, 'あし');

-- Radical 191
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (191, '158', '身', 'body', 7, 'しろ');

-- Radical 192
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (192, '159', '車', 'cart, car', 7, 'はくへん');

-- Radical 193
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (193, '160', '辛', 'bitter', 7, 'からい');

-- Radical 194
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (194, '161', '辰', 'morning', 7, 'さら');

-- Radical 195
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (195, '195', '酉', 'wine, alcohol', 7, 'うさぎ');

-- Radical 196
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (196, '165', '釆', 'distiguishing, separating', 7, 'ほこ');

-- Radical 197
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (197, '166', '里', 'mile, village, hamlet', 7, 'ほこへん');

-- Radical 198
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (198, '136', '舛', 'lying side by side, opposite', 7, 'かたへん');

-- Radical 199
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (199, '199', '麦', 'wheat', 7, 'むぎ');

-- Radical 200
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (200, '167', '金', 'metal, gold', 8, 'や');

-- Radical 201
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (201, '168', '長', 'long, hair', 8, 'やへん');

-- Radical 202
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (202, '169', '門', 'door, gate', 8, 'いし');

-- Radical 203
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (203, '171', '隶', 'slave, reaching, catching', 8, 'しめす');

-- Radical 204
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (204, '172', '隹', 'small bird', 8, 'じゅうのあし');

-- Radical 205
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (205, '173', '雨', 'rain', 8, 'のぎへん');

-- Radical 206
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (206, '174', '青', 'blue, green', 8, 'あお');

-- Radical 207
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (207, '175', '非', 'wrong', 8, 'あらず');

-- Radical 208
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (208, '208', '奄', 'cover', 8, 'あき');

-- Radical 209
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (209, '209', '岡', 'hill', 8, 'おか');

-- Radical 210
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (210, '210', '免', 'exemption', 8, 'めん');

-- Radical 211
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (211, '210', '斉', 'equal, alike', 8, 'あき');

-- Radical 212
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (212, '176', '面', 'face', 9, 'めん');

-- Radical 213
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (213, '177', '革', 'skin, leather, changing', 9, 'いくりがわ');

-- Radical 214
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (214, '179', '韭', 'chives, scallion', 9, 'にら');

-- Radical 215
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (215, '180', '音', 'sound', 9, 'したみず');

-- Radical 216
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (216, '181', '頁', 'big shell', 9, 'おおがい');

-- Radical 217
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (217, '182', '風', 'wind', 9, 'かぜ');

-- Radical 218
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (218, '183', '飛', 'fly', 9, 'とぶ');

-- Radical 219
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (219, '184', '食', 'eat, food', 9, 'しょく');

-- Radical 220
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (220, '185', '首', 'neck, head', 9, 'くび');

-- Radical 221
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (221, '186', '香', 'odor, perfume', 9, 'かおり');

-- Radical 222
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (222, '222', '品', 'quality, character', 9, 'ひよう');

-- Radical 223
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (223, '187', '馬', 'horse', 10, 'うま');

-- Radical 224
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (224, '188', '骨', 'bone', 10, 'ほね');

-- Radical 225
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (225, '189', '高', 'tall, high', 10, 'いと');

-- Radical 226
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (226, '190', '髟', 'long hair', 10, 'かみかんむり');

-- Radical 227
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (227, '191', '鬥', 'fight, battle', 10, 'たたかいがまえ');

-- Radical 228
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (228, '192', '鬯', 'sacrificial wine', 10, 'においざけ');

-- Radical 229
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (229, '193', '鬲', 'tripod, cauldron', 10, 'れき');

-- Radical 230
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (230, '194', '鬼', 'ghost, spirit', 10, 'おに');

-- Radical 231
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (231, '212', '竜', 'dragon', 10, 'りゅう');

-- Radical 232
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (232, '178', '韋', 'tanned leather', 10, 'なめしがわ');

-- Radical 233
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (233, '195', '魚', 'fish', 11, 'うお');

-- Radical 234
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (234, '196', '鳥', 'bird', 11, 'とり');

-- Radical 235
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (235, '197', '鹵', 'salt', 11, 'しお');

-- Radical 236
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (236, '198', '鹿', 'deer', 11, 'しか');

-- Radical 237
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (237, '200', '麻', 'hemp', 11, 'あさ');

-- Radical 238
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (238, '213', '亀', 'turtle', 11, 'かめ');

-- Radical 239
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (239, '239', '啇', 'trade, business', 11, 'つうせい');

-- Radical 240
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (240, '201', '黄', 'yellow', 11, 'き');

-- Radical 241
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (241, '203', '黒', 'black', 11, 'くろ');

-- Radical 242
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (242, '202', '黍', 'millet', 12, 'きび');

-- Radical 243
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (243, '204', '黹', 'needlework', 12, 'ぬいとり');

-- Radical 244
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (244, '244', '無', 'not', 12, 'む');

-- Radical 245
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (245, '211', '歯', 'teeth', 12, 'は');

-- Radical 246
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (246, '205', '黽', 'frog, amphibian', 13, 'かえる');

-- Radical 247
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (247, '206', '鼎', 'sacrificial tripod, three-legged cauldron', 13, 'かなえ');

-- Radical 248
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (248, '207', '鼓', 'drum', 13, 'つづみ');

-- Radical 249
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (249, '208', '鼠', 'mouse, rat', 13, 'ねずみ');

-- Radical 250
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (250, '209', '鼻', 'nose, self', 14, 'はな');

-- Radical 251
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (251, '210', '齊', 'equal, alike', 14, 'せい');

-- Radical 252
INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)
VALUES (252, '214', '龠', 'flute', 17, 'やく');


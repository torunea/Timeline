// サンプルデータ（CSVの取得に失敗した場合のフォールバック）
const SAMPLE_DATA = [
    {"year": 1867, "category": "birth", "name": "フランク・ロイド・ライト", "attribution": "architect", "title": "フランク・ロイド・ライト誕生", "description": "アメリカ合衆国ウィスコンシン州で生まれる"},
    {"year": 1887, "category": "building", "name": "フランク・ロイド・ライト", "attribution": "architect", "title": "ユニティ・テンプル", "description": "シカゴ郊外オークパークに建設された初期の代表作"},
    {"year": 1910, "category": "publication", "name": "フランク・ロイド・ライト", "attribution": "architect", "title": "オーガニック・アーキテクチャ", "description": "建築の原理に関する著書"},
    {"year": 1916, "category": "building", "name": "フランク・ロイド・ライト", "attribution": "architect", "title": "帝国ホテル", "description": "東京に建設され、関東大震災にも耐えたホテル建築"},
    {"year": 1936, "category": "building", "name": "フランク・ロイド・ライト", "attribution": "architect", "title": "落水荘（カウフマン邸）", "description": "ペンシルバニア州の滝の上に建つ名作住宅"},
    {"year": 1959, "category": "death", "name": "フランク・ロイド・ライト", "attribution": "architect", "title": "フランク・ロイド・ライト死去", "description": "91歳でアリゾナ州フェニックスにて死去"},
    {"year": 1887, "category": "birth", "name": "ル・コルビュジエ", "attribution": "architect", "title": "ル・コルビュジエ誕生", "description": "スイスのラ・ショー・ド・フォンで生まれる"},
    {"year": 1923, "category": "publication", "name": "ル・コルビュジエ", "attribution": "architect", "title": "建築をめざして", "description": "モダニズム建築の原則を示した著作"},
    {"year": 1928, "category": "building", "name": "ル・コルビュジエ", "attribution": "architect", "title": "サヴォア邸", "description": "パリ郊外ポワシーに建つモダニズム住宅の傑作"},
    {"year": 1952, "category": "building", "name": "ル・コルビュジエ", "attribution": "architect", "title": "ロンシャン礼拝堂", "description": "フランスのロンシャンに建つ曲線的な形態の教会"},
    {"year": 1965, "category": "death", "name": "ル・コルビュジエ", "attribution": "architect", "title": "ル・コルビュジエ死去", "description": "フランス・コートダジュールの海で水浴中に死去"},
    {"year": 1853, "category": "birth", "name": "ゴッホ", "attribution": "artist", "title": "ゴッホ誕生", "description": "オランダのズンデルトで生まれる"},
    {"year": 1888, "category": "artwork", "name": "ゴッホ", "attribution": "artist", "title": "ひまわり", "description": "最も有名な静物画シリーズの制作"},
    {"year": 1889, "category": "artwork", "name": "ゴッホ", "attribution": "artist", "title": "星月夜", "description": "サン＝レミ＝ド＝プロヴァンスの精神病院から見た風景"},
    {"year": 1890, "category": "death", "name": "ゴッホ", "attribution": "artist", "title": "ゴッホ死去", "description": "37歳でフランスのオーヴェル＝シュル＝オワーズにて自ら命を絶つ"},
    {"year": 1879, "category": "birth", "name": "アインシュタイン", "attribution": "scientist", "title": "アインシュタイン誕生", "description": "ドイツのウルムで生まれる"},
    {"year": 1905, "category": "publication", "name": "アインシュタイン", "attribution": "scientist", "title": "特殊相対性理論の発表", "description": "「運動物体の電気力学について」を発表"},
    {"year": 1915, "category": "publication", "name": "アインシュタイン", "attribution": "scientist", "title": "一般相対性理論の発表", "description": "重力を時空の歪みとして説明する革命的理論"},
    {"year": 1921, "category": "discovery", "name": "アインシュタイン", "attribution": "scientist", "title": "ノーベル物理学賞受賞", "description": "光電効果の理論的解明に対して授与"},
    {"year": 1955, "category": "death", "name": "アインシュタイン", "attribution": "scientist", "title": "アインシュタイン死去", "description": "76歳でアメリカのプリンストンにて死去"}
];

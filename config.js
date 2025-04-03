// 設定ファイル

// 複数のCSVスプレッドシートの設定
const SPREADSHEET_SOURCES = [
    {
        name: "birth-death",
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSikAHCTE4Mmr8UGPf3oIyfOlhy4tvTMlruQdKR91ulu3mVBpUmm1MuHzTRnVtORddOPpHrs2Ua8omT/pub?output=csv'
    },

    // 追加のデータソースをここに記述
    {
        name: "Timeline",
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSG7K-ORBszxO5obK_mmc4N0BtaxnONpACJlzPM8fXx1thv9NJEHuthRZxzybK0XeO2MiO9n-TAGUsn/pub?output=csv'
    },

    {
        name: "image",
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQo3hjD2qsO5REuptxFxRrWDxbrjmu9tc92dI_DZcihUKSmRL9A8M_i_TT3v0IFYWz9OzwIxtcNRhkz/pub?output=csv'
    },
];

// 後方互換性のために単一URLも保持
const CSV_URL = SPREADSHEET_SOURCES[0].url;

// 年表の設定
const START_YEAR = 1950;
const END_YEAR = 2025;
const YEARS_PER_MARKER = 1;
const PIXELS_PER_YEAR = 200; // .year-markerの幅と一致させる

// 属性ラベルを取得
function getAttributionLabel(attribution) {
    const labels = {
        'architect': '建築家',
        'artist': '芸術家',
        'writer': '作家',
        'critic': '批評家',
        'philosopher': '哲学者',
        'videographer': '映像作家',
        'photographer': '写真家',
        'musician': '音楽家',
        'concept': '概念',
        'default': 'その他'
    };
    return labels[attribution] || attribution;
}

// カテゴリ名を表示用に変換
function getCategoryLabel(category) {
    const labels = {
        'building': '建築作品',
        'publication': '出版物',
        'essay': '論考',
        'artwork': '芸術作品',
        'exhibition': '展覧会',
        'manifesto': '宣言',
        'award': '受賞',
        'ideology': '思想',
        'anthology': '作品集',
        'affiliation':'所属',
    };
    return labels[category] || category;
}

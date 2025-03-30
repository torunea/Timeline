// 設定ファイル

// CSV として公開されたスプレッドシートの URL
// あなたのスプレッドシートのCSV公開URLに置き換えてください
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSikAHCTE4Mmr8UGPf3oIyfOlhy4tvTMlruQdKR91ulu3mVBpUmm1MuHzTRnVtORddOPpHrs2Ua8omT/pub?output=csv';

// 年表の設定
const START_YEAR = 1850;
const END_YEAR = 2025;
const YEARS_PER_MARKER = 1;
const PIXELS_PER_YEAR = 200; // .year-markerの幅と一致させる

// 属性ラベルを取得
function getAttributionLabel(attribution) {
    const labels = {
        'architect': '建築家',
        'artist': '芸術家',
        'writer': '作家',
        'scientist': '科学者',
        'philosopher': '哲学者',
        'politician': '政治家',
        'musician': '音楽家',
        'default': 'その他'
    };
    return labels[attribution] || attribution;
}

// カテゴリ名を表示用に変換
function getCategoryLabel(category) {
    const labels = {
        'building': '建築作品',
        'publication': '出版',
        'essay': '論考',
        'artwork': '芸術作品',
        'discovery': '発見・発明'
    };
    return labels[category] || category;
}

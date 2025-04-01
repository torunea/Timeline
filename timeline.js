// CSVデータを読み込む
async function loadData() {
    try {
        const response = await fetch(CSV_URL);
        
        if (!response.ok) {
            throw new Error(`HTTPエラー: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.trim() === '') {
            throw new Error('CSVデータが空です');
        }
        
        // デバッグ情報
        console.log('CSVデータ取得成功 (先頭部分):', csvText.substring(0, 200));
        
        // Papa Parse を使って CSV をパース
        Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log('CSVパース結果:', results);
                
                if (!results.data || results.data.length === 0) {
                    throw new Error('パースしたデータが空です');
                }
                
                // パースしたデータを処理
                processData(results.data);
            },
            error: function(error) {
                console.error('CSVのパースに失敗しました:', error);
                // エラー時はサンプルデータを使用
                processData(SAMPLE_DATA);
            }
        });
    } catch (error) {
        console.error('データの取得に失敗しました:', error);
        
        // エラーの詳細情報を表示（デバッグ用）
        const errorDetails = document.createElement('div');
        errorDetails.style.color = 'red';
        errorDetails.style.padding = '1rem';
        errorDetails.style.backgroundColor = '#fff8f8';
        errorDetails.style.borderRadius = '4px';
        errorDetails.style.marginBottom = '1rem';
        errorDetails.innerHTML = `
            <h3>データ取得エラー</h3>
            <p>エラーメッセージ: ${error.message}</p>
            <p>CSV URL: ${CSV_URL}</p>
            <p>注: サンプルデータを使用して表示します</p>
        `;
        document.getElementById('timeline').innerHTML = '';
        document.getElementById('timeline').appendChild(errorDetails);
        
        // エラー時はサンプルデータを使用
        processData(SAMPLE_DATA);
    }
}

// データの処理と年表の表示
function processData(data) {
    // 人物ごとにデータをグループ化
    const persons = {};
    const birthDeathInfo = {};
    
    // 人物の生没年情報を取得
    data.forEach(item => {
        if (!item.name || !item.year) return;
        
        // yearが文字列の場合は数値に変換
        if (typeof item.year === 'string') {
            item.year = parseInt(item.year);
        }
        
        if (!persons[item.name]) {
            persons[item.name] = [];
        }
        
        // attributionがない場合はデフォルト値を設定
        if (!item.attribution) {
            item.attribution = 'default';
        }
        
        persons[item.name].push(item);
        
        // 生没年とattributionの情報を記録
        if (item.category === 'birth') {
            if (!birthDeathInfo[item.name]) {
                birthDeathInfo[item.name] = {};
            }
            birthDeathInfo[item.name].birth = item.year;
            birthDeathInfo[item.name].attribution = item.attribution;
        }
        
        if (item.category === 'death') {
            if (!birthDeathInfo[item.name]) {
                birthDeathInfo[item.name] = {};
            }
            birthDeathInfo[item.name].death = item.year;
            birthDeathInfo[item.name].attribution = item.attribution;
        }
        
        // attributionを全てのイベントに記録（生没年以外の場合）
        if (item.category !== 'birth' && item.category !== 'death') {
            if (!birthDeathInfo[item.name]) {
                birthDeathInfo[item.name] = { attribution: item.attribution };
            } else if (!birthDeathInfo[item.name].attribution) {
                birthDeathInfo[item.name].attribution = item.attribution;
            }
        }
    });
    
    // 年表を描画
    renderTimeline(persons, birthDeathInfo);
    
    // 検索とフィルタ機能をセットアップ
    setupFilters(data, persons, birthDeathInfo);
}

// 年表の描画
function renderTimeline(persons, birthDeathInfo) {
    const timelineElement = document.getElementById('timeline');
    
    timelineElement.innerHTML = '';
    
    // 年マーカーのヘッダーを作成
    const timelineHeader = document.createElement('div');
    timelineHeader.className = 'timeline-header';
    
    // 年マーカーを作成
    for (let year = START_YEAR; year <= END_YEAR; year += YEARS_PER_MARKER) {
        const yearMarker = document.createElement('div');
        yearMarker.className = 'year-marker';
        yearMarker.textContent = year;
        yearMarker.style.width = (PIXELS_PER_YEAR * YEARS_PER_MARKER) + 'px';
        yearMarker.setAttribute('data-year', year); // 年のデータ属性を追加
        timelineHeader.appendChild(yearMarker);
    }
    
    timelineElement.appendChild(timelineHeader);
    
    // 各人物の行を作成
    Object.keys(persons).forEach(personName => {
        const items = persons[personName];
        const bdInfo = birthDeathInfo[personName] || {};
        
        // 人物のタイムライン行
        const personRow = document.createElement('div');
        personRow.className = 'person-row';
        personRow.setAttribute('data-person', personName);
        
        if (bdInfo.attribution) {
            personRow.setAttribute('data-attribution', bdInfo.attribution);
        }
        
        // 人物名を帯の左端に追加
        const nameElement = document.createElement('div');
        nameElement.className = 'person-name';
        nameElement.textContent = personName;
        
        // 属性を表示（小さく）
        if (bdInfo.attribution) {
            const attributionSpan = document.createElement('div');
            attributionSpan.className = 'person-attribution';
            attributionSpan.textContent = getAttributionLabel(bdInfo.attribution);
            nameElement.appendChild(attributionSpan);
        }
        
        personRow.appendChild(nameElement);
        
        // 人物のタイムライン
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'person-timeline';
        
        // 生存期間の帯を表示（birth/deathがない場合は表示期間の開始/終了を使用）
        const birthYear = bdInfo.birth || START_YEAR; // birthがなければ開始年
        const deathYear = bdInfo.death || END_YEAR; // deathがなければ終了年まで
        
        if (birthYear && deathYear) {
            const lifespanElement = document.createElement('div');
            lifespanElement.className = 'person-lifespan';
            
            // 属性に基づいてクラスを追加
            if (bdInfo.attribution) {
                lifespanElement.classList.add(`attribution-${bdInfo.attribution}`);
            } else {
                lifespanElement.classList.add('attribution-default');
            }
            
            // 位置を計算
            const startPosition = Math.max(0, (birthYear - START_YEAR) * PIXELS_PER_YEAR);
            const endPosition = Math.min((END_YEAR - START_YEAR) * PIXELS_PER_YEAR, (deathYear - START_YEAR) * PIXELS_PER_YEAR);
            const width = endPosition - startPosition;
            
            lifespanElement.style.left = startPosition + 'px';
            lifespanElement.style.width = width + 'px';
            lifespanElement.setAttribute('data-birth-year', birthYear); // 生年を記録
            lifespanElement.setAttribute('data-death-year', deathYear); // 没年を記録
            
            timelineContainer.appendChild(lifespanElement);
        }
        
        // イベントを表示
        // 人物ごと・年ごとにイベントをグループ化
        const eventsByYear = {};

        items.forEach(item => {
            // birth/deathカテゴリは帯として表示済みなのでスキップ
            if (item.category === 'birth' || item.category === 'death') return;
            
            const year = item.year;
            if (!eventsByYear[year]) {
                eventsByYear[year] = [];
            }
            eventsByYear[year].push(item);
        });

        // 年ごとにイベントを処理
        Object.keys(eventsByYear).sort((a, b) => a - b).forEach(year => {
            const events = eventsByYear[year];
            const position = (year - START_YEAR) * PIXELS_PER_YEAR;
            
            if (events.length === 1) {
                // 単一イベントの場合は通常通り表示
                const item = events[0];
                const eventElement = document.createElement('div');
                eventElement.className = 'event-item';
                eventElement.setAttribute('data-category', item.category);
                eventElement.setAttribute('data-year', year); // 年を記録
                
                eventElement.style.left = position + 'px';
                eventElement.style.width = PIXELS_PER_YEAR + 'px';
                
                // イベント種類
                const typeElement = document.createElement('div');
                typeElement.className = `event-type event-${item.category}`;
                typeElement.textContent = getCategoryLabel(item.category);
                eventElement.appendChild(typeElement);
                
                // タイトル
                const titleElement = document.createElement('div');
                titleElement.className = 'event-title';
                titleElement.textContent = item.title;
                eventElement.appendChild(titleElement);
                
                // 説明（ホバー時のみ表示）
                if (item.description) {
                    const descElement = document.createElement('div');
                    descElement.className = 'event-description';
                    descElement.textContent = item.description;
                    eventElement.appendChild(descElement);
                }
                
                timelineContainer.appendChild(eventElement);
            } else {
                // 複数イベントの場合はアコーディオン表示
                const groupElement = document.createElement('div');
                groupElement.className = 'event-group';
                groupElement.style.left = position + 'px';
                groupElement.style.width = PIXELS_PER_YEAR + 'px';
                groupElement.setAttribute('data-year', year); // 年を記録

                // ヘッダー（カテゴリごとの件数を表示）
                const headerElement = document.createElement('div');
                headerElement.className = 'event-group-header';

                // カテゴリごとにイベント数をカウント
                const categoryCounts = {};
                events.forEach(item => {
                    if (!categoryCounts[item.category]) {
                        categoryCounts[item.category] = 0;
                    }
                    categoryCounts[item.category]++;
                });

                // バッジ形式でカテゴリごとの件数を表示
                let headerContent = '';
                Object.keys(categoryCounts).forEach(category => {
                    headerContent += `<span class="event-count-badge badge-${category}">${categoryCounts[category]}</span>`;
                });

                headerElement.innerHTML = headerContent;

                // コンテンツ（初期状態では非表示）
                const contentElement = document.createElement('div');
                contentElement.className = 'event-group-content';
                
                // 各イベントをコンテンツに追加
                events.forEach(item => {
                    const eventItem = document.createElement('div');
                    eventItem.className = 'event-group-item';
                    eventItem.setAttribute('data-category', item.category);
                    
                    // イベント種類
                    const typeElement = document.createElement('div');
                    typeElement.className = `event-type event-${item.category}`;
                    typeElement.textContent = getCategoryLabel(item.category);
                    eventItem.appendChild(typeElement);
                    
                    // タイトル
                    const titleElement = document.createElement('div');
                    titleElement.className = 'event-title';
                    titleElement.textContent = item.title;
                    eventItem.appendChild(titleElement);
                    
                    // 説明（ホバー時のみ表示に変更）
                    if (item.description) {
                        const descElement = document.createElement('div');
                        descElement.className = 'event-description';
                        descElement.textContent = item.description;
                        eventItem.appendChild(descElement);
                    }
                    
                    contentElement.appendChild(eventItem);
                });
                
                groupElement.appendChild(headerElement);
                groupElement.appendChild(contentElement);
                
                // クリックで展開/折りたたみ
                headerElement.addEventListener('click', () => {
                    groupElement.classList.toggle('expanded');
                });
                
                timelineContainer.appendChild(groupElement);
            }
        });
        
        personRow.appendChild(timelineContainer);
        timelineElement.appendChild(personRow);
    });
    
    // 現在のズームレベルを適用（ズーム後に再描画した場合）
    const zoomLevelDisplay = document.getElementById('zoom-level');
    if (zoomLevelDisplay) {
        const currentZoom = parseFloat(zoomLevelDisplay.textContent) / 100 || 1;
        if (currentZoom !== 1) {
            timelineElement.style.transform = `scale(${currentZoom})`;
            timelineElement.classList.add('zoomed');
            
            // ズームに応じて年マーカーの幅を調整
            updateYearMarkersWidth(currentZoom);
        }
    }
}

// ズームに応じて年マーカーの幅を更新する関数
function updateYearMarkersWidth(zoomLevel) {
    const yearMarkers = document.querySelectorAll('.year-marker');
    yearMarkers.forEach(marker => {
        const year = parseInt(marker.getAttribute('data-year'));
        const years = YEARS_PER_MARKER;
        marker.style.width = (PIXELS_PER_YEAR * years * zoomLevel) + 'px';
    });
    
    // イベント要素の位置も更新
    updateEventPositions(zoomLevel);
}

// ズームに応じてイベント要素の位置を更新する関数
function updateEventPositions(zoomLevel) {
    // 帯の位置と幅を更新
    const lifespanElements = document.querySelectorAll('.person-lifespan');
    lifespanElements.forEach(element => {
        const birthYear = parseInt(element.getAttribute('data-birth-year'));
        const deathYear = parseInt(element.getAttribute('data-death-year'));
        
        const startPosition = Math.max(0, (birthYear - START_YEAR) * PIXELS_PER_YEAR * zoomLevel);
        const endPosition = Math.min((END_YEAR - START_YEAR) * PIXELS_PER_YEAR * zoomLevel, 
                                   (deathYear - START_YEAR) * PIXELS_PER_YEAR * zoomLevel);
        const width = endPosition - startPosition;
        
        element.style.left = startPosition + 'px';
        element.style.width = width + 'px';
    });
    
    // 単一イベントの位置と幅を更新
    const eventElements = document.querySelectorAll('.event-item');
    eventElements.forEach(element => {
        const year = parseInt(element.getAttribute('data-year'));
        const position = (year - START_YEAR) * PIXELS_PER_YEAR * zoomLevel;
        
        element.style.left = position + 'px';
        element.style.width = (PIXELS_PER_YEAR * zoomLevel) + 'px';
    });
    
    // 複数イベントグループの位置と幅を更新
    const groupElements = document.querySelectorAll('.event-group');
    groupElements.forEach(element => {
        const year = parseInt(element.getAttribute('data-year'));
        const position = (year - START_YEAR) * PIXELS_PER_YEAR * zoomLevel;
        
        element.style.left = position + 'px';
        element.style.width = (PIXELS_PER_YEAR * zoomLevel) + 'px';
    });
}

// フィルタリング関数を変更
function setupFilters(data, persons, birthDeathInfo) {
    const searchBox = document.getElementById('search-box');
    const attributionFilter = document.getElementById('attribution-filter');
    const searchTypeSelect = document.getElementById('search-type');
    const categoryCheckboxes = document.querySelectorAll('input[name="category-filter"]');
    
    // フィルタリング関数
    function applyFilters() {
        const searchTerm = searchBox.value.toLowerCase().trim();
        const selectedAttribution = attributionFilter.value;
        const searchType = searchTypeSelect ? searchTypeSelect.value : 'or';
        
        // 選択されたカテゴリを配列として取得
        const selectedCategories = Array.from(categoryCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
        
        // 検索語を分割
        const searchTerms = searchTerm.split(/\s+/).filter(term => term.length > 0);
        
        // 絞り込みデータを作成
        const filteredPersons = {};
        
        Object.keys(persons).forEach(personName => {
            // 名前による検索
            let nameMatches = false;
            let itemMatches = false;
            
            // 検索語がない場合は一致とみなす
            if (searchTerms.length === 0) {
                nameMatches = true;
            } else {
                // 名前に対する検索
                if (searchType === 'and') {
                    // AND検索: すべての検索語が名前に含まれる必要がある
                    nameMatches = searchTerms.every(term => 
                        personName.toLowerCase().includes(term)
                    );
                } else {
                    // OR検索: いずれかの検索語が名前に含まれればOK
                    nameMatches = searchTerms.some(term => 
                        personName.toLowerCase().includes(term)
                    );
                }
                
                // 名前に一致しない場合はイベントで検索
                if (!nameMatches) {
                    const matchingItems = persons[personName].filter(item => {
                        if (searchType === 'and') {
                            // AND検索: すべての検索語がタイトルまたは説明に含まれる必要がある
                            return searchTerms.every(term => 
                                (item.title && item.title.toLowerCase().includes(term)) ||
                                (item.description && item.description.toLowerCase().includes(term))
                            );
                        } else {
                            // OR検索: いずれかの検索語がタイトルまたは説明に含まれればOK
                            return searchTerms.some(term => 
                                (item.title && item.title.toLowerCase().includes(term)) ||
                                (item.description && item.description.toLowerCase().includes(term))
                            );
                        }
                    });
                    
                    itemMatches = matchingItems.length > 0;
                }
            }
            
            // 検索条件に一致しない場合はスキップ
            if (searchTerms.length > 0 && !nameMatches && !itemMatches) {
                return;
            }
            
            // 属性でフィルタリング
            if (selectedAttribution !== 'all') {
                const personAttribution = birthDeathInfo[personName]?.attribution || 'default';
                if (personAttribution !== selectedAttribution) {
                    return;
                }
            }
            
            // カテゴリでフィルタリング（複数選択に対応）
            // 選択されたカテゴリのいずれかに一致するイベントをフィルタリング
            const filteredItems = persons[personName].filter(item => 
                selectedCategories.includes(item.category) || item.category === 'birth' || item.category === 'death'
            );
            
            // 選択されたカテゴリのいずれかに一致するイベントがない場合はスキップ
            const hasMatchingCategory = filteredItems.some(item => 
                selectedCategories.includes(item.category)
            );
            
            if (!hasMatchingCategory && selectedCategories.length > 0) {
                return;
            }
            
            filteredPersons[personName] = filteredItems;
        });
        
        // 絞り込み結果で年表を再描画
        renderTimeline(filteredPersons, birthDeathInfo);
    }
    
    // 検索機能のイベントリスナー（既存のコードと同じ）
    searchBox.addEventListener('input', applyFilters);
    
    // 属性フィルタのイベントリスナー（既存のコードと同じ）
    attributionFilter.addEventListener('change', applyFilters);
    
    // 検索タイプのイベントリスナー（既存のコードと同じ）
    if (searchTypeSelect) {
        searchTypeSelect.addEventListener('change', applyFilters);
    }
    
    // カテゴリフィルタのイベントリスナー（新規追加）
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
}

// ズーム機能のセットアップ
function setupZoom() {
    const timeline = document.getElementById('timeline');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');
    const zoomLevelDisplay = document.getElementById('zoom-level');
    
    let zoomLevel = 1; // 初期ズームレベル
    const zoomStep = 0.1; // ズーム変化量
    const maxZoom = 2; // 最大ズーム
    const minZoom = 0.5; // 最小ズーム
    
    // ズームレベルを適用する関数
    function applyZoom() {
        timeline.style.transform = `scale(${zoomLevel})`;
        timeline.classList.toggle('zoomed', zoomLevel !== 1);
        zoomLevelDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
        
        // ピクセル/年の値を調整（ズームに応じて調整）
        updatePixelsPerYear();
    }
    
    // PIXELS_PER_YEARの値をズームに応じて更新
    function updatePixelsPerYear() {
        const yearMarkers = document.querySelectorAll('.year-marker');
        yearMarkers.forEach(marker => {
            marker.style.width = (PIXELS_PER_YEAR * zoomLevel) + 'px';
        });
    }
    
    // ズームイン
    zoomInBtn.addEventListener('click', () => {
        if (zoomLevel < maxZoom) {
            zoomLevel = Math.min(maxZoom, zoomLevel + zoomStep);
            applyZoom();
        }
    });
    
    // ズームアウト
    zoomOutBtn.addEventListener('click', () => {
        if (zoomLevel > minZoom) {
            zoomLevel = Math.max(minZoom, zoomLevel - zoomStep);
            applyZoom();
        }
    });
    
    // リセット
    zoomResetBtn.addEventListener('click', () => {
        zoomLevel = 1;
        applyZoom();
    });
    
    // マウスホイールによるズーム
    timeline.addEventListener('wheel', (e) => {
        if (e.ctrlKey) { // Ctrlキーを押しながらホイール操作
            e.preventDefault();
            
            if (e.deltaY < 0 && zoomLevel < maxZoom) {
                // ズームイン
                zoomLevel = Math.min(maxZoom, zoomLevel + zoomStep);
            } else if (e.deltaY > 0 && zoomLevel > minZoom) {
                // ズームアウト
                zoomLevel = Math.max(minZoom, zoomLevel - zoomStep);
            }
            
            applyZoom();
        }
    });
}

// ページ読み込み時の処理に追加
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupZoom();
});


// ページ読み込み時にデータを取得
document.addEventListener('DOMContentLoaded', loadData);

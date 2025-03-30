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
    const personListElement = document.getElementById('person-list');
    
    timelineElement.innerHTML = '';
    personListElement.innerHTML = '';
    
    // 年マーカーのヘッダーを作成
    const timelineHeader = document.createElement('div');
    timelineHeader.className = 'timeline-header';
    
    // 年マーカーを作成
    for (let year = START_YEAR; year <= END_YEAR; year += YEARS_PER_MARKER) {
        const yearMarker = document.createElement('div');
        yearMarker.className = 'year-marker';
        yearMarker.textContent = year;
        yearMarker.style.width = (PIXELS_PER_YEAR * YEARS_PER_MARKER) + 'px';
        timelineHeader.appendChild(yearMarker);
    }
    
    timelineElement.appendChild(timelineHeader);
    
    // 各人物の行を作成
    Object.keys(persons).forEach(personName => {
        const items = persons[personName];
        const bdInfo = birthDeathInfo[personName] || {};
        
        // 人物リストに名前を追加
        const nameItem = document.createElement('div');
        nameItem.className = 'person-item';
        nameItem.textContent = personName;
        
        // 属性を表示（小さく）
        if (bdInfo.attribution) {
            const attributionSpan = document.createElement('small');
            attributionSpan.style.fontSize = '0.7rem';
            attributionSpan.style.color = '#808080';
            attributionSpan.textContent = getAttributionLabel(bdInfo.attribution);
            nameItem.appendChild(attributionSpan);
        }
        
        personListElement.appendChild(nameItem);
        
        // 人物のタイムライン行
        const personRow = document.createElement('div');
        personRow.className = 'person-row';
        personRow.setAttribute('data-person', personName);
        
        if (bdInfo.attribution) {
            personRow.setAttribute('data-attribution', bdInfo.attribution);
        }
        
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
            
            timelineContainer.appendChild(lifespanElement);
        }
        
        // イベントを表示
        items.forEach(item => {
            // birth/deathカテゴリは帯として表示済みなのでスキップ
            if (item.category === 'birth' || item.category === 'death') return;
            
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item';
            eventElement.setAttribute('data-category', item.category);
            
            // イベント種類とタイトルを表示するために、幅に合わせてサイズ調整
            // 位置を計算
            const position = (item.year - START_YEAR) * PIXELS_PER_YEAR - 150; // 微妙に合わないので150pxズラして調整
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
        });
        
        personRow.appendChild(timelineContainer);
        timelineElement.appendChild(personRow);
    });
}

// フィルタと検索機能のセットアップ
function setupFilters(data, persons, birthDeathInfo) {
    const searchBox = document.getElementById('search-box');
    const filterSelect = document.getElementById('filter-select');
    const attributionFilter = document.getElementById('attribution-filter');
    
    // フィルタリング関数
    function applyFilters() {
        const searchTerm = searchBox.value.toLowerCase();
        const selectedCategory = filterSelect.value;
        const selectedAttribution = attributionFilter.value;
        
        // 絞り込みデータを作成
        const filteredPersons = {};
        
        Object.keys(persons).forEach(personName => {
            // 名前による検索
            if (searchTerm && !personName.toLowerCase().includes(searchTerm)) {
                // 名前が検索語に含まれない場合は、タイトルや説明で検索
                const matchingItems = persons[personName].filter(item => 
                    (item.title && item.title.toLowerCase().includes(searchTerm)) ||
                    (item.description && item.description.toLowerCase().includes(searchTerm))
                );
                
                if (matchingItems.length === 0) {
                    // 名前もタイトルも説明も検索語に含まれない場合はスキップ
                    return;
                }
            }
            
            // 属性でフィルタリング
            if (selectedAttribution !== 'all') {
                const personAttribution = birthDeathInfo[personName]?.attribution || 'default';
                if (personAttribution !== selectedAttribution) {
                    return;
                }
            }
            
            // カテゴリでフィルタリング
            if (selectedCategory !== 'all') {
                const filteredItems = persons[personName].filter(item => 
                    item.category === selectedCategory || item.category === 'birth' || item.category === 'death'
                );
                
                if (filteredItems.filter(item => item.category === selectedCategory).length === 0) {
                    // 選択されたカテゴリに一致するアイテムがない場合はスキップ
                    return;
                }
                
                filteredPersons[personName] = filteredItems;
            } else {
                filteredPersons[personName] = persons[personName];
            }
        });
        
        // 絞り込み結果で年表を再描画
        renderTimeline(filteredPersons, birthDeathInfo);
    }
    
    // 検索機能
    searchBox.addEventListener('input', applyFilters);
    
    // カテゴリフィルタ
    filterSelect.addEventListener('change', applyFilters);
    
    // 属性フィルタ
    attributionFilter.addEventListener('change', applyFilters);
}

// ページ読み込み時にデータを取得
document.addEventListener('DOMContentLoaded', loadData);

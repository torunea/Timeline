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

// グローバル変数として現在の persons データを保存
window.currentPersons = persons;

// イベントにユニークIDを付与（既存コードに追加）
const allEvents = document.querySelectorAll('.event-item, .event-group-item');
allEvents.forEach((event, index) => {
    event.setAttribute('data-event-id', `event-${index}`);
});

// アコーディオン設定
setupAccordion();

// 関連イベント間の線を描画
connectRelatedEvents(persons);
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

    // プルダウンのイベント伝播問題を修正
    attributionFilter.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    searchTypeSelect.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
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

        // フィルタリング結果をグローバル変数に保存
        window.currentPersons = filteredPersons;

        // フィルタリング後、線を再描画するためのタイムアウト設定
        setTimeout(() => {
            connectRelatedEvents(window.currentPersons);
        }, 100);
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

// イベント間の関連性を検出して線を引く関数
function connectRelatedEvents(persons) {
    // 先にすべてのイベント要素の辞書を作成（title → 要素のマップ）
    const eventsByTitle = new Map();
    
    // 単一イベントと展開されたグループ内のイベントを収集
    const allEvents = document.querySelectorAll('.event-item, .event-group-item');
    
    allEvents.forEach(eventElement => {
        const titleElement = eventElement.querySelector('.event-title');
        if (titleElement) {
            const title = titleElement.textContent.trim();
            if (!eventsByTitle.has(title)) {
                eventsByTitle.set(title, []);
            }
            eventsByTitle.get(title).push(eventElement);
        }
    });
    
    // 折りたたまれたイベントグループも収集
    const collapsedGroups = document.querySelectorAll('.event-group:not(.expanded)');
    collapsedGroups.forEach(group => {
        // グループ内のイベントのタイトルを取得
        const groupItems = group.querySelectorAll('.event-group-item');
        groupItems.forEach(item => {
            const titleElement = item.querySelector('.event-title');
            if (titleElement) {
                const title = titleElement.textContent.trim();
                if (!eventsByTitle.has(title)) {
                    eventsByTitle.set(title, []);
                }
                // 折りたたまれたグループ全体をマッピング（アイテムではなくグループを参照）
                eventsByTitle.get(title).push({
                    element: group,
                    collapsed: true,
                    originalItem: item
                });
            }
        });
    });
    
    // 線の描画前に既存の線をクリア
    clearConnectionLines();
    
    // 「」で囲まれた参照を検索して線を引く
    // 単一イベントのチェック
    allEvents.forEach(eventElement => {
        checkAndDrawConnections(eventElement, eventsByTitle, false);
    });
    
    // 折りたたまれたグループのチェック
    collapsedGroups.forEach(group => {
        const items = group.querySelectorAll('.event-group-item');
        items.forEach(item => {
            checkAndDrawConnections(item, eventsByTitle, true, group);
        });
    });
    // 接続線を描画する前に、イベントプロパゲーションの問題を防ぐ
    const allLines = document.querySelectorAll('.event-connection-line');
    allLines.forEach(line => {
        line.addEventListener('click', e => {
            e.stopPropagation(); // イベントの伝播を止める
        });
    });
}

// イベント要素の説明文内の参照をチェックして線を引く関数
function checkAndDrawConnections(eventElement, eventsByTitle, isCollapsed, groupElement = null) {
    const descElement = eventElement.querySelector('.event-description');
    if (!descElement) return;
    
    const descText = descElement.textContent;
    // 「」で囲まれたテキストを抽出する正規表現
    const regex = /「([^「」]+)」/g;
    let match;
    
    while ((match = regex.exec(descText)) !== null) {
        const referencedTitle = match[1].trim();
        
        // 参照されているタイトルのイベントを探す
        if (eventsByTitle.has(referencedTitle)) {
            const referencedEvents = eventsByTitle.get(referencedTitle);
            
            // 見つかった各イベントに対して線を引く
            referencedEvents.forEach(targetEvent => {
                // 自分自身は除外
                if ((isCollapsed && targetEvent === groupElement) || 
                    (!isCollapsed && targetEvent === eventElement) ||
                    (isCollapsed && targetEvent.originalItem === eventElement)) {
                    return;
                }
                
                // ソース要素（折りたたまれている場合はグループ要素、そうでなければイベント要素）
                const sourceElement = isCollapsed ? groupElement : eventElement;
                
                // ターゲット要素（オブジェクトの場合は element プロパティを使用）
                const targetElement = targetEvent.element || targetEvent;
                
                // ターゲットが折りたたまれているかを判断
                const targetCollapsed = targetEvent.collapsed || false;
                
                // 線を引く
                drawConnectionLine(
                    sourceElement, 
                    targetElement, 
                    isCollapsed, 
                    targetCollapsed,
                    eventElement,  // 元のイベント項目（折りたたまれている場合）
                    targetEvent.originalItem  // ターゲットの元のイベント項目（折りたたまれている場合）
                );
            });
        }
    }
}

// 既存の接続線をすべて削除
function clearConnectionLines() {
    const existingLines = document.querySelectorAll('.event-connection-line');
    existingLines.forEach(line => line.remove());
}

// 2つのイベント要素間に線を引く関数（拡大縮小に対応）
function drawConnectionLine(sourceEvent, targetEvent, sourceCollapsed, targetCollapsed, originalSourceItem, originalTargetItem) {
    // 線を描画するコンテナ
    const container = document.querySelector('.timeline');
    
    // 現在のズームレベルを取得
    const zoomLevelDisplay = document.getElementById('zoom-level');
    const zoomLevel = parseFloat(zoomLevelDisplay.textContent) / 100 || 1;
    
    // イベント要素の位置を取得
    const sourceRect = sourceEvent.getBoundingClientRect();
    const targetRect = targetEvent.getBoundingClientRect();
    
    // タイムラインコンテナを基準にした相対位置を計算
    const containerRect = container.getBoundingClientRect();
    
    // ソースとターゲットの接続ポイントを計算
    let sourceX, sourceY, targetX, targetY;
    
    // ズームを考慮した位置計算
    // getBoundingClientRectの値をズームレベルで調整
    // ソースの接続ポイント（折りたたまれているか展開されているかで切り替え）
    if (sourceCollapsed) {
        // 折りたたまれている場合はグループボックスの中心
        sourceX = (sourceRect.left - containerRect.left) / zoomLevel + sourceRect.width / (2 * zoomLevel);
        sourceY = (sourceRect.top - containerRect.top) / zoomLevel + sourceRect.height / (2 * zoomLevel);
    } else {
        // 展開されている場合は個別イベントの中心
        sourceX = (sourceRect.left - containerRect.left) / zoomLevel + sourceRect.width / (2 * zoomLevel);
        sourceY = (sourceRect.top - containerRect.top) / zoomLevel + sourceRect.height / (2 * zoomLevel);
    }
    
    // ターゲットの接続ポイント（折りたたまれているか展開されているかで切り替え）
    if (targetCollapsed) {
        // 折りたたまれている場合はグループボックスの中心
        targetX = (targetRect.left - containerRect.left) / zoomLevel + targetRect.width / (2 * zoomLevel);
        targetY = (targetRect.top - containerRect.top) / zoomLevel + targetRect.height / (2 * zoomLevel);
    } else {
        // 展開されている場合は個別イベントの中心
        targetX = (targetRect.left - containerRect.left) / zoomLevel + targetRect.width / (2 * zoomLevel);
        targetY = (targetRect.top - containerRect.top) / zoomLevel + targetRect.height / (2 * zoomLevel);
    }
    
    // 線要素の作成
    const line = document.createElement('div');
    line.className = 'event-connection-line';
    
    // 線のID（重複を避けるため）
    const sourceId = sourceEvent.getAttribute('data-event-id') || Math.random().toString(36).substr(2, 9);
    const targetId = targetEvent.getAttribute('data-event-id') || Math.random().toString(36).substr(2, 9);
    line.setAttribute('data-connection', `${sourceId}-${targetId}`);
    
    // 折りたたみ状態を属性として保存（状態変更時の参照用）
    if (sourceCollapsed) line.setAttribute('data-source-collapsed', 'true');
    if (targetCollapsed) line.setAttribute('data-target-collapsed', 'true');
    
    // 元のアイテムIDを保存（折りたたみ解除時の再描画用）
    if (originalSourceItem) line.setAttribute('data-original-source', originalSourceItem.getAttribute('data-event-id') || '');
    if (originalTargetItem) line.setAttribute('data-original-target', originalTargetItem.getAttribute('data-event-id') || '');
    
    // 線の長さと角度を計算
    const length = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
    const angle = Math.atan2(targetY - sourceY, targetX - sourceX) * 180 / Math.PI;
    
    // 線のスタイル設定
    line.style.width = `${length}px`;
    line.style.left = `${sourceX}px`;
    line.style.top = `${sourceY}px`;
    line.style.transform = `rotate(${angle}deg)`;
    
    // ズーム対応のクラスを追加
    line.classList.add('zoomed-line');
    
    // 線をDOMに追加
    container.appendChild(line);
}

// アコーディオンの設定（既存のコードを尊重）
function setupAccordion() {
    const accordionHeaders = document.querySelectorAll('.event-group-header');
    
    accordionHeaders.forEach(header => {
        // 既存のイベントリスナーを削除（重複防止）
        const clone = header.cloneNode(true);
        header.parentNode.replaceChild(clone, header);
        
        // 新しいイベントリスナーを追加
        clone.addEventListener('click', (e) => {
            e.stopPropagation(); // イベントの伝播を止める
            const group = clone.parentElement;
            group.classList.toggle('expanded');
            
            // アコーディオンの状態変更後に接続線を再描画
            setTimeout(() => {
                if (window.currentPersons) {
                    connectRelatedEvents(window.currentPersons);
                }
            }, 300);
        });
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
        // ズームレベルを表示
        zoomLevelDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
        
        // タイムライン全体のズーム設定
        timeline.style.transform = `scale(${zoomLevel})`;
        timeline.style.transformOrigin = 'left top'; // 基準点を左上に固定
        timeline.classList.toggle('zoomed', zoomLevel !== 1);
        
        // 既存の線を削除
        clearConnectionLines();
        
        // 新たに線を引き直す
        // タイムアウトを設定して、DOM更新後に実行
        setTimeout(() => {
            if (window.currentPersons) {
                connectRelatedEvents(window.currentPersons);
            }
        }, 50);
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


// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    // グローバル変数の初期化
    window.currentPersons = null;
    
    // データ読み込み
    loadData();
    
    // ズーム機能のセットアップ
    setupZoom();
    
    // ドキュメント全体のクリックイベントの監視（デバッグ用）
    document.addEventListener('click', (e) => {
        console.log('Document clicked:', e.target);
    });
});

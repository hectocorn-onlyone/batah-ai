// ===== 쇼츠 제작 회사 에이전트 시스템 =====

// 직원 정의
const EMPLOYEES = {
    planner: {
        name: '기획팀장',
        avatar: '📋',
        role: '주제 분석 및 콘텐츠 방향 설정',
        systemPrompt: `당신은 콘텐츠 기획팀장입니다. 
- 주어진 주제를 분석하여 쇼츠 콘텐츠 방향을 제시합니다.
- 타겟 오디언스와 핵심 메시지를 정의합니다.
- 2-3문장으로 간결하게 기획 방향을 설명하세요.
- 한국어로 답변하세요.`
    },
    writer: {
        name: '작가',
        avatar: '✍️',
        role: '스크립트 및 대본 작성',
        systemPrompt: `당신은 쇼츠 전문 작가입니다.
- 60초 내외의 쇼츠 스크립트를 작성합니다.
- 구성: 1)훅(5초) 2)본론(45초) 3)마무리(10초)
- 각 장면별로 나레이션을 작성하세요.
- 시청자의 관심을 끄는 대본을 작성하세요.
- 한국어로 답변하세요.`
    },
    designer: {
        name: '디자이너',
        avatar: '🎨',
        role: '비주얼 컨셉 및 이미지 기획',
        systemPrompt: `당신은 비주얼 디자이너입니다.
- 각 장면에 적합한 배경 이미지 키워드를 제안합니다.
- 색감, 분위기, 스타일을 정의합니다.
- 영어로 이미지 검색 키워드를 5개 제안하세요.
- 형식: "scene1: keyword, scene2: keyword..."
- 한국어로 설명하되 키워드는 영어로.`
    },
    editor: {
        name: '편집자',
        avatar: '🎬',
        role: '영상 구성 및 편집 방향',
        systemPrompt: `당신은 영상 편집자입니다.
- 장면 전환 타이밍을 설정합니다.
- 각 장면의 길이(초)를 지정합니다.
- 자막 스타일과 위치를 결정합니다.
- 형식: "scene1: 5초, scene2: 10초..."
- 한국어로 답변하세요.`
    },
    marketer: {
        name: '마케터',
        avatar: '📣',
        role: '제목, 해시태그, 마케팅 전략',
        systemPrompt: `당신은 SNS 마케터입니다.
- 클릭을 유도하는 매력적인 제목을 3개 제안합니다.
- 관련 해시태그 10개를 추천합니다.
- 타겟 플랫폼(유튜브, 틱톡, 인스타) 전략을 제시합니다.
- 한국어로 답변하세요.`
    }
};

// 상태 관리
let currentState = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    pexelsKey: localStorage.getItem('pexels_api_key') || '',
    isProducing: false,
    currentTopic: '',
    conversation: [],
    results: {
        plan: '',
        script: '',
        visuals: '',
        editing: '',
        marketing: ''
    }
};

// 직원별 메모리 로드
function loadMemory(employee) {
    const memory = localStorage.getItem(`shorts_${employee}_memory`);
    return memory ? JSON.parse(memory) : [];
}

// 직원별 메모리 저장
function saveMemory(employee, content) {
    let memory = loadMemory(employee);
    memory.push({
        content: content,
        timestamp: new Date().toISOString()
    });
    // 최대 20개 기억 유지
    if (memory.length > 20) {
        memory = memory.slice(-20);
    }
    localStorage.setItem(`shorts_${employee}_memory`, JSON.stringify(memory));
    updateMemoryDisplay();
}

// 메모리 표시 업데이트
function updateMemoryDisplay() {
    Object.keys(EMPLOYEES).forEach(emp => {
        const memory = loadMemory(emp);
        const el = document.getElementById(`${emp}Memory`);
        if (el) el.textContent = memory.length;
    });
}

// 모든 기억 초기화
function clearAllMemory() {
    if (confirm('모든 직원의 기억을 초기화하시겠습니까?')) {
        Object.keys(EMPLOYEES).forEach(emp => {
            localStorage.removeItem(`shorts_${emp}_memory`);
        });
        localStorage.removeItem('shorts_company_history');
        updateMemoryDisplay();
        alert('모든 기억이 초기화되었습니다.');
    }
}

// API 설정 토글
function toggleApiSettings() {
    const settings = document.getElementById('apiSettings');
    settings.classList.toggle('collapsed');
}

// API 키 저장
function saveApiKeys() {
    const geminiKey = document.getElementById('geminiApiKey').value;
    const pexelsKey = document.getElementById('pexelsApiKey').value;

    if (!geminiKey) {
        alert('Gemini API 키를 입력해주세요.');
        return;
    }

    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('pexels_api_key', pexelsKey);
    currentState.apiKey = geminiKey;
    currentState.pexelsKey = pexelsKey;

    alert('API 설정이 저장되었습니다.');
    toggleApiSettings();
}

// API 키 로드
function loadApiKeys() {
    const geminiKey = localStorage.getItem('gemini_api_key');
    const pexelsKey = localStorage.getItem('pexels_api_key');

    if (geminiKey) document.getElementById('geminiApiKey').value = geminiKey;
    if (pexelsKey) document.getElementById('pexelsApiKey').value = pexelsKey;

    currentState.apiKey = geminiKey || '';
    currentState.pexelsKey = pexelsKey || '';
}

// 데모 모드 응답 템플릿
const DEMO_RESPONSES = {
    planner: (topic) => `📋 **기획 분석 완료**\n\n주제 "${topic}"에 대한 분석입니다.\n\n🎯 타겟: 40-70대 시니어층\n📌 핵심: 실용적 정보 전달\n🎬 톤: 따뜻하고 친근한 어조`,

    writer: (topic) => `✍️ **스크립트 완성**\n\n[훅 - 5초]\n"${topic}, 아직도 이렇게 하고 계세요?"\n\n[본론 - 45초]\n많은 분들이 모르시는 사실이 있습니다.\n${topic}에 대해 전문가들은 이렇게 말합니다.\n\n실제로 이 방법을 사용하신 분들은\n놀라운 변화를 경험하셨습니다.\n\n[마무리 - 10초]\n오늘부터 바로 시작해보세요!`,

    designer: (topic) => `🎨 **비주얼 컨셉**\n\n📸 이미지 키워드:\n- senior lifestyle wellness\n- healthy living tips\n- happy elderly people\n\n🎨 스타일: 따뜻한 톤 (오렌지, 베이지)`,

    editor: (topic) => `🎬 **편집 계획**\n\n⏱️ 장면 구성:\n- 훅: 5초\n- 문제제기: 8초\n- 해결책: 22초\n- 팁: 10초\n- 마무리: 5초\n\n✨ 총 50초, 자막 하단 중앙`,

    marketer: (topic) => `📣 **마케팅 전략**\n\n🏷️ 제목:\n"${topic}" 이것만 알면 인생이 바뀝니다\n\n#️⃣ 해시태그:\n#시니어꿀팁 #건강정보 #shorts #50대라이프 #오늘의정보`
};

// 딜레이 시뮬레이션
function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Gemini API 호출 (데모 모드 지원)
async function callGemini(systemPrompt, userMessage, memory = [], employeeType = 'planner') {
    const topic = currentState.currentTopic || '건강 관리';

    // API 키 없으면 데모 모드
    if (!currentState.apiKey) {
        await simulateDelay(1500);
        return DEMO_RESPONSES[employeeType] ? DEMO_RESPONSES[employeeType](topic) : '데모 응답입니다.';
    }

    // 메모리 컨텍스트 구성
    let memoryContext = '';
    if (memory.length > 0) {
        memoryContext = '\n\n[이전 작업 기억]\n' + memory.slice(-5).map(m => m.content).join('\n');
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentState.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: systemPrompt + memoryContext + '\n\n[현재 요청]\n' + userMessage
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            console.warn('API 실패, 데모 모드로 전환');
            await simulateDelay(1000);
            return DEMO_RESPONSES[employeeType] ? DEMO_RESPONSES[employeeType](topic) : '데모 응답입니다.';
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return DEMO_RESPONSES[employeeType] ? DEMO_RESPONSES[employeeType](topic) : '데모 응답입니다.';
        }

        return text;
    } catch (error) {
        console.warn('API 오류, 데모 모드:', error);
        await simulateDelay(1000);
        return DEMO_RESPONSES[employeeType] ? DEMO_RESPONSES[employeeType](topic) : '데모 응답입니다.';
    }
}

// 채팅 메시지 추가
function addChatMessage(role, name, message, isThinking = false) {
    const container = document.getElementById('chatContainer');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';

    msgDiv.innerHTML = `
        <div class="chat-avatar ${role}">${EMPLOYEES[role]?.avatar || '👔'}</div>
        <div class="chat-content">
            <div class="chat-name ${role}">${name}</div>
            <div class="chat-bubble ${isThinking ? 'thinking' : ''}">${message}</div>
        </div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;

    return msgDiv;
}

// CEO 메시지 추가
function addCeoMessage(message) {
    const container = document.getElementById('chatContainer');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';

    msgDiv.innerHTML = `
        <div class="chat-avatar ceo">👔</div>
        <div class="chat-content">
            <div class="chat-name ceo">대표님 (CEO)</div>
            <div class="chat-bubble">${message}</div>
        </div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

// 직원 상태 업데이트
function updateEmployeeStatus(employee, status) {
    const el = document.getElementById(`${employee}Status`);
    if (el) {
        el.textContent = status;
        el.className = 'employee-status' + (status === '작업 중' ? ' working' : '');
    }

    const card = document.querySelector(`[data-employee="${employee}"]`);
    if (card) {
        card.classList.toggle('active', status === '작업 중');
    }
}

// 진행률 업데이트
function updateProgress(percent, status) {
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressStatus').textContent = status;
}

// 쇼츠 제작 시작
async function startProduction() {
    const topic = document.getElementById('topicInput').value.trim();
    const notes = document.getElementById('additionalNotes').value.trim();

    if (!topic) {
        alert('쇼츠 주제를 입력해주세요.');
        return;
    }

    if (!currentState.apiKey) {
        alert('먼저 Gemini API 키를 설정해주세요.');
        toggleApiSettings();
        return;
    }

    // 시작
    currentState.isProducing = true;
    currentState.currentTopic = topic;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('chatContainer').innerHTML = '';

    // CEO 지시
    addCeoMessage(`오늘의 쇼츠 주제는 "${topic}" 입니다.${notes ? `\n\n추가 지시: ${notes}` : ''}\n\n각자 역할에 맞게 작업해주세요!`);

    try {
        // 1. 기획팀장
        updateProgress(10, '기획팀장이 분석 중...');
        updateEmployeeStatus('planner', '작업 중');
        addChatMessage('planner', '기획팀장', '주제를 분석하고 있습니다...', true);

        const plannerMemory = loadMemory('planner');
        const planResult = await callGemini(
            EMPLOYEES.planner.systemPrompt,
            `주제: ${topic}\n${notes ? `추가 지시: ${notes}` : ''}`,
            plannerMemory,
            'planner'
        );

        currentState.results.plan = planResult;
        saveMemory('planner', `주제: ${topic}\n결과: ${planResult}`);
        updateEmployeeStatus('planner', '완료');
        addChatMessage('planner', '기획팀장', planResult);

        // 2. 작가
        updateProgress(30, '작가가 스크립트 작성 중...');
        updateEmployeeStatus('writer', '작업 중');
        addChatMessage('writer', '작가', '스크립트를 작성하고 있습니다...', true);

        const writerMemory = loadMemory('writer');
        const scriptResult = await callGemini(
            EMPLOYEES.writer.systemPrompt,
            `주제: ${topic}\n기획 방향: ${planResult}`,
            writerMemory,
            'writer'
        );

        currentState.results.script = scriptResult;
        saveMemory('writer', `주제: ${topic}\n스크립트: ${scriptResult.substring(0, 200)}...`);
        updateEmployeeStatus('writer', '완료');
        addChatMessage('writer', '작가', scriptResult);

        // 3. 디자이너
        updateProgress(50, '디자이너가 비주얼 기획 중...');
        updateEmployeeStatus('designer', '작업 중');
        addChatMessage('designer', '디자이너', '비주얼 컨셉을 구상하고 있습니다...', true);

        const designerMemory = loadMemory('designer');
        const visualResult = await callGemini(
            EMPLOYEES.designer.systemPrompt,
            `주제: ${topic}\n스크립트: ${scriptResult}`,
            designerMemory,
            'designer'
        );

        currentState.results.visuals = visualResult;
        saveMemory('designer', `주제: ${topic}\n비주얼: ${visualResult.substring(0, 200)}...`);
        updateEmployeeStatus('designer', '완료');
        addChatMessage('designer', '디자이너', visualResult);

        // 4. 편집자
        updateProgress(70, '편집자가 구성 계획 중...');
        updateEmployeeStatus('editor', '작업 중');
        addChatMessage('editor', '편집자', '영상 구성을 계획하고 있습니다...', true);

        const editorMemory = loadMemory('editor');
        const editResult = await callGemini(
            EMPLOYEES.editor.systemPrompt,
            `주제: ${topic}\n스크립트: ${scriptResult}\n비주얼 컨셉: ${visualResult}`,
            editorMemory,
            'editor'
        );

        currentState.results.editing = editResult;
        saveMemory('editor', `주제: ${topic}\n편집: ${editResult.substring(0, 200)}...`);
        updateEmployeeStatus('editor', '완료');
        addChatMessage('editor', '편집자', editResult);

        // 5. 마케터
        updateProgress(90, '마케터가 마케팅 전략 수립 중...');
        updateEmployeeStatus('marketer', '작업 중');
        addChatMessage('marketer', '마케터', '마케팅 전략을 수립하고 있습니다...', true);

        const marketerMemory = loadMemory('marketer');
        const marketResult = await callGemini(
            EMPLOYEES.marketer.systemPrompt,
            `주제: ${topic}\n스크립트 요약: ${scriptResult.substring(0, 300)}`,
            marketerMemory,
            'marketer'
        );

        currentState.results.marketing = marketResult;
        saveMemory('marketer', `주제: ${topic}\n마케팅: ${marketResult.substring(0, 200)}...`);
        updateEmployeeStatus('marketer', '완료');
        addChatMessage('marketer', '마케터', marketResult);

        // 완료
        updateProgress(100, '모든 작업이 완료되었습니다!');
        addCeoMessage('수고하셨습니다! 이제 영상을 생성해볼까요?');

        // 결과 표시
        displayResults();
        saveToHistory(topic);

    } catch (error) {
        console.error('Error:', error);
        alert('오류가 발생했습니다: ' + error.message);
        updateProgress(0, '오류 발생');
    } finally {
        currentState.isProducing = false;
        document.getElementById('startBtn').disabled = false;
        Object.keys(EMPLOYEES).forEach(emp => {
            if (document.getElementById(`${emp}Status`).textContent !== '완료') {
                updateEmployeeStatus(emp, '대기');
            }
        });
    }
}

// 결과 표시
function displayResults() {
    const videoSection = document.getElementById('videoSection');
    videoSection.classList.remove('hidden');

    document.getElementById('scriptContent').textContent = currentState.results.script;

    // 마케팅 결과에서 제목과 해시태그 추출
    const marketingText = currentState.results.marketing;
    document.getElementById('videoTitle').textContent = currentState.currentTopic;
    document.getElementById('videoHashtags').textContent = marketingText.match(/#\w+/g)?.join(' ') || '#shorts #AI #콘텐츠';
}

// 히스토리 저장
function saveToHistory(topic) {
    let history = JSON.parse(localStorage.getItem('shorts_company_history') || '[]');
    history.unshift({
        topic: topic,
        date: new Date().toISOString(),
        results: currentState.results
    });
    // 최대 10개 유지
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem('shorts_company_history', JSON.stringify(history));
    renderHistory();
}

// 히스토리 렌더링
function renderHistory() {
    const list = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('shorts_company_history') || '[]');

    if (history.length === 0) {
        list.innerHTML = '<p class="empty-history">아직 제작된 쇼츠가 없습니다.</p>';
        return;
    }

    list.innerHTML = history.map(item => `
        <div class="history-item">
            <span class="history-topic">${item.topic}</span>
            <span class="history-date">${new Date(item.date).toLocaleDateString('ko-KR')}</span>
        </div>
    `).join('');
}

// 초기화
document.addEventListener('DOMContentLoaded', function () {
    loadApiKeys();
    updateMemoryDisplay();
    renderHistory();
});

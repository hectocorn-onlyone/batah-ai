// ===== 쇼츠 영상 생성기 =====

// 영상 생성 상태
let videoState = {
    isGenerating: false,
    isPreviewing: false,
    images: [],
    audioChunks: [],
    mediaRecorder: null,
    currentScene: 0
};

// Pexels API로 이미지 검색
async function searchImages(keyword) {
    const apiKey = localStorage.getItem('pexels_api_key');

    if (!apiKey) {
        // API 키 없으면 기본 색상 배경 사용
        return null;
    }

    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1&orientation=portrait`, {
            headers: { 'Authorization': apiKey }
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.photos?.[0]?.src?.large || null;
    } catch (error) {
        console.error('Image search error:', error);
        return null;
    }
}

// 스크립트를 장면으로 파싱
function parseScriptToScenes(script) {
    const scenes = [];
    const lines = script.split('\n').filter(line => line.trim());

    let currentScene = { text: '', duration: 5 };

    for (const line of lines) {
        if (line.includes('훅') || line.includes('Hook') || line.includes('도입')) {
            if (currentScene.text) scenes.push({ ...currentScene });
            currentScene = { text: '', duration: 5, type: 'hook' };
        } else if (line.includes('마무리') || line.includes('CTA') || line.includes('결론')) {
            if (currentScene.text) scenes.push({ ...currentScene });
            currentScene = { text: '', duration: 5, type: 'outro' };
        } else {
            currentScene.text += line + '\n';
        }
    }

    if (currentScene.text) scenes.push(currentScene);

    // 장면이 없으면 전체를 하나의 장면으로
    if (scenes.length === 0) {
        scenes.push({ text: script, duration: 30, type: 'main' });
    }

    return scenes;
}

// Canvas에 장면 그리기
function drawScene(ctx, canvas, scene, bgImage = null) {
    const width = canvas.width;
    const height = canvas.height;

    // 배경
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, width, height);
        // 오버레이
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, height);
    } else {
        // 그라데이션 배경
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    // 텍스트 영역 (하단 1/3)
    const textY = height * 0.6;

    // 자막 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(40, textY, width - 80, height * 0.35);

    // 자막 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // 텍스트 줄바꿈 처리
    const words = scene.text.split(' ');
    const lineHeight = 60;
    let line = '';
    let y = textY + 30;
    const maxWidth = width - 100;

    for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line.trim(), width / 2, y);
            line = word + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), width / 2, y);

    // 진행 바
    const progress = (videoState.currentScene + 1) / videoState.totalScenes;
    ctx.fillStyle = 'rgba(124, 77, 255, 0.8)';
    ctx.fillRect(0, height - 10, width * progress, 10);
}

// TTS (Text-to-Speech)
function speak(text) {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
            setTimeout(resolve, 3000);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = resolve;
        utterance.onerror = resolve;

        speechSynthesis.speak(utterance);
    });
}

// 영상 미리보기
async function previewVideo() {
    if (!currentState.results.script) {
        alert('먼저 쇼츠를 제작해주세요.');
        return;
    }

    if (videoState.isPreviewing) {
        speechSynthesis.cancel();
        videoState.isPreviewing = false;
        return;
    }

    videoState.isPreviewing = true;

    const canvas = document.getElementById('videoCanvas');
    const ctx = canvas.getContext('2d');
    const scenes = parseScriptToScenes(currentState.results.script);

    videoState.totalScenes = scenes.length;

    for (let i = 0; i < scenes.length; i++) {
        if (!videoState.isPreviewing) break;

        videoState.currentScene = i;
        drawScene(ctx, canvas, scenes[i]);

        // TTS
        await speak(scenes[i].text);

        // 장면 전환 대기
        await new Promise(r => setTimeout(r, 1000));
    }

    videoState.isPreviewing = false;
}

// MP4 영상 생성
async function generateVideo() {
    if (!currentState.results.script) {
        alert('먼저 쇼츠를 제작해주세요.');
        return;
    }

    if (videoState.isGenerating) {
        alert('영상 생성 중입니다. 잠시 기다려주세요.');
        return;
    }

    videoState.isGenerating = true;
    const btn = document.querySelector('.btn-primary');
    btn.textContent = '🔄 생성 중...';
    btn.disabled = true;

    try {
        const canvas = document.getElementById('videoCanvas');
        const ctx = canvas.getContext('2d');
        const scenes = parseScriptToScenes(currentState.results.script);

        videoState.totalScenes = scenes.length;

        // MediaRecorder 설정
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            downloadVideo(blob);
        };

        mediaRecorder.start();

        // 각 장면 녹화
        for (let i = 0; i < scenes.length; i++) {
            videoState.currentScene = i;

            // 애니메이션 프레임
            const duration = scenes[i].duration * 1000;
            const startTime = performance.now();

            while (performance.now() - startTime < duration) {
                drawScene(ctx, canvas, scenes[i]);
                await new Promise(r => setTimeout(r, 33)); // ~30fps
            }
        }

        mediaRecorder.stop();

    } catch (error) {
        console.error('Video generation error:', error);
        alert('영상 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
        videoState.isGenerating = false;
        btn.textContent = '📥 MP4 다운로드';
        btn.disabled = false;
    }
}

// 영상 다운로드
function downloadVideo(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shorts_${currentState.currentTopic.replace(/\s+/g, '_')}_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('영상이 다운로드되었습니다! (WebM 형식)\n\n※ MP4로 변환하려면 온라인 변환 도구를 사용하세요.');
}

// 캔버스 초기화
function initCanvas() {
    const canvas = document.getElementById('videoCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 기본 화면
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎬 쇼츠 미리보기', canvas.width / 2, canvas.height / 2);
}

// 페이지 로드 시 초기화
window.addEventListener('load', initCanvas);

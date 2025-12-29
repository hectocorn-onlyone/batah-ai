// Global State
let currentUser = {
    id: null,
    username: null,
    plan: 'free',
    isAdmin: false,
    isLoggedIn: false
};

// 등록된 사용자 목록 (LocalStorage에서 로드)
let registeredUsers = JSON.parse(localStorage.getItem('batah_users')) || [];

// 결제 요청 목록 (LocalStorage에서 로드)
let paymentRequests = JSON.parse(localStorage.getItem('batah_payment_requests')) || [];

// 사용자 데이터 저장
function saveUsers() {
    localStorage.setItem('batah_users', JSON.stringify(registeredUsers));
}

// 결제 요청 저장
function savePaymentRequests() {
    localStorage.setItem('batah_payment_requests', JSON.stringify(paymentRequests));
}

let agents = [
    {
        id: 1,
        name: '시니어 주제 발굴기',
        description: '경쟁이 낮고 수요가 높은 시니어 니치 주제를 발굴하고 콘텐츠를 자동 생성합니다.',
        icon: '🎯',
        category: '시니어',
        type: 'premium',
        hasPage: true,
        pageUrl: 'senior-agent.html'
    }
];

let nextAgentId = 10;
let editingAgentId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    renderAgents();
    renderAdminAgents();
    renderUserAgents();
    setupFilterTabs();
    setupAdminTabs();
    setupNavigation();
});

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                scrollToSection(targetId);

                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

function scrollToSection(sectionId) {
    // Hide dashboards
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');

    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showPage(page) {
    // Hide all sections
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');

    if (page === 'admin') {
        document.getElementById('admin-dashboard').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'dashboard') {
        document.getElementById('dashboard').classList.remove('hidden');
        renderUserAgents();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        scrollToSection(page);
    }
}

// Filter Tabs
function setupFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');
            renderAgents(filter);
        });
    });
}

// Admin Tabs
function setupAdminTabs() {
    const adminTabs = document.querySelectorAll('.admin-tab');
    adminTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');

            adminTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.remove('active');
            });

            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Render Agents
function renderAgents(filter = 'all') {
    const grid = document.getElementById('agentsGrid');
    const filteredAgents = filter === 'all'
        ? agents
        : agents.filter(agent => agent.type === filter);

    grid.innerHTML = filteredAgents.map(agent => `
        <div class="agent-card ${agent.type === 'premium' ? 'premium' : ''}" data-agent-id="${agent.id}">
            <div class="agent-header">
                <div class="agent-icon">${agent.icon}</div>
                <div class="agent-badge ${agent.type}">${agent.type === 'free' ? '무료' : '프리미엄'}</div>
            </div>
            <h3 class="agent-title">${agent.name}</h3>
            <div class="agent-category">${agent.category}</div>
            <p class="agent-description">${agent.description}</p>
            <div class="agent-footer">
                ${agent.type === 'free' || currentUser.plan !== 'free'
            ? `<button class="btn-primary" onclick="useAgent(${agent.id})">
                        사용하기
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>`
            : `<button class="btn-outline" onclick="scrollToSection('pricing')">
                        업그레이드 필요
                    </button>`
        }
            </div>
        </div>
    `).join('');
}

function renderAdminAgents() {
    const list = document.getElementById('adminAgentsList');
    list.innerHTML = agents.map(agent => `
        <div class="admin-agent-item">
            <div class="admin-agent-icon">${agent.icon}</div>
            <div class="admin-agent-info">
                <h4>${agent.name}</h4>
                <div class="admin-agent-meta">
                    <span class="agent-badge ${agent.type}">${agent.type === 'free' ? '무료' : '프리미엄'}</span>
                    <span style="color: var(--text-tertiary);">${agent.category}</span>
                </div>
            </div>
            <div class="admin-agent-actions">
                <button class="btn-icon" onclick="editAgent(${agent.id})" title="수정">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M14.1667 2.5C14.3856 2.28113 14.6454 2.10752 14.9314 1.98906C15.2173 1.87061 15.5238 1.80969 15.8334 1.80969C16.1429 1.80969 16.4494 1.87061 16.7354 1.98906C17.0214 2.10752 17.2811 2.28113 17.5 2.5C17.7189 2.71887 17.8925 2.97863 18.011 3.26461C18.1294 3.55059 18.1904 3.85706 18.1904 4.16667C18.1904 4.47627 18.1294 4.78274 18.011 5.06872C17.8925 5.3547 17.7189 5.61446 17.5 5.83333L6.25004 17.0833L1.66671 18.3333L2.91671 13.75L14.1667 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button class="btn-icon delete" onclick="deleteAgent(${agent.id})" title="삭제">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M2.5 5H4.16667H17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6.66669 5.00001V3.33334C6.66669 2.89131 6.84228 2.46739 7.15484 2.15483C7.4674 1.84227 7.89133 1.66667 8.33335 1.66667H11.6667C12.1087 1.66667 12.5326 1.84227 12.8452 2.15483C13.1578 2.46739 13.3334 2.89131 13.3334 3.33334V5.00001M15.8334 5.00001V16.6667C15.8334 17.1087 15.6578 17.5326 15.3452 17.8452C15.0326 18.1577 14.6087 18.3333 14.1667 18.3333H5.83335C5.39133 18.3333 4.9674 18.1577 4.65484 17.8452C4.34228 17.5326 4.16669 17.1087 4.16669 16.6667V5.00001H15.8334Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function renderUserAgents() {
    const grid = document.getElementById('userAgentsGrid');
    const availableAgents = agents.filter(agent =>
        agent.type === 'free' || currentUser.plan !== 'free'
    );

    grid.innerHTML = availableAgents.map(agent => `
        <div class="agent-card ${agent.type === 'premium' ? 'premium' : ''}">
            <div class="agent-header">
                <div class="agent-icon">${agent.icon}</div>
                <div class="agent-badge ${agent.type}">${agent.type === 'free' ? '무료' : '프리미엄'}</div>
            </div>
            <h3 class="agent-title">${agent.name}</h3>
            <div class="agent-category">${agent.category}</div>
            <p class="agent-description">${agent.description}</p>
            <div class="agent-footer">
                <button class="btn-primary" onclick="useAgent(${agent.id})">
                    사용하기
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Agent Actions
function useAgent(agentId) {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
        // 프리미엄 에이전트 접근 제한 체크
        if (agent.type === 'premium' && currentUser.plan === 'free') {
            alert(`⚠️ ${agent.name}은(는) 프리미엄 에이전트입니다.\n\n이용하시려면 Pro 또는 Enterprise 플랜으로 업그레이드해주세요.`);
            scrollToSection('pricing');
            return;
        }

        // Check if agent has dedicated page
        if (agent.hasPage && agent.pageUrl) {
            window.location.href = agent.pageUrl;
        } else {
            alert(`${agent.name} 에이전트를 실행합니다.\n\n이 데모에서는 실제 에이전트 실행 기능이 구현되지 않았습니다.`);
        }
    }
}

function showAddAgentModal() {
    editingAgentId = null;
    document.getElementById('agentModalTitle').textContent = '에이전트 추가';
    document.getElementById('agentName').value = '';
    document.getElementById('agentDescription').value = '';
    document.getElementById('agentIcon').value = '';
    document.getElementById('agentCategory').value = '';
    document.getElementById('agentType').value = 'free';
    showModal('agentModal');
}

function editAgent(agentId) {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
        editingAgentId = agentId;
        document.getElementById('agentModalTitle').textContent = '에이전트 수정';
        document.getElementById('agentName').value = agent.name;
        document.getElementById('agentDescription').value = agent.description;
        document.getElementById('agentIcon').value = agent.icon;
        document.getElementById('agentCategory').value = agent.category;
        document.getElementById('agentType').value = agent.type;
        showModal('agentModal');
    }
}

function saveAgent() {
    const name = document.getElementById('agentName').value.trim();
    const description = document.getElementById('agentDescription').value.trim();
    const icon = document.getElementById('agentIcon').value.trim();
    const category = document.getElementById('agentCategory').value.trim();
    const type = document.getElementById('agentType').value;

    if (!name || !description || !icon || !category) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    if (editingAgentId) {
        // Edit existing agent
        const agentIndex = agents.findIndex(a => a.id === editingAgentId);
        if (agentIndex !== -1) {
            agents[agentIndex] = {
                ...agents[agentIndex],
                name,
                description,
                icon,
                category,
                type
            };
        }
    } else {
        // Add new agent
        agents.push({
            id: nextAgentId++,
            name,
            description,
            icon,
            category,
            type
        });
    }

    renderAgents();
    renderAdminAgents();
    renderUserAgents();
    closeModal('agentModal');

    const message = editingAgentId ? '수정되었습니다' : '추가되었습니다';
    showNotification(`에이전트가 ${message}.`);
}

function deleteAgent(agentId) {
    if (confirm('정말 이 에이전트를 삭제하시겠습니까?')) {
        agents = agents.filter(a => a.id !== agentId);
        renderAgents();
        renderAdminAgents();
        renderUserAgents();
        showNotification('에이전트가 삭제되었습니다.');
    }
}

// Pricing
function selectPlan(plan) {
    if (plan === 'free') {
        currentUser.plan = 'free';
        document.getElementById('currentPlanName').textContent = 'Starter';
        showNotification('무료 플랜이 선택되었습니다.');
        renderAgents();
        renderUserAgents();
    } else {
        // 결제 모달 표시
        showPaymentModal(plan);
    }
}

// 결제 모달
let currentPaymentMethod = 'card';

function showPaymentModal(plan) {
    // 로그인 체크 - 로그인한 사용자만 결제 가능
    if (!currentUser.isLoggedIn) {
        alert('⚠️ 결제를 진행하려면 먼저 로그인해주세요.');
        showUserLogin();
        return;
    }

    const planInfo = {
        pro: { name: 'Pro', price: '29,000', features: '모든 프리미엄 에이전트 + 무제한 실행' },
        enterprise: { name: 'Enterprise', price: '99,000', features: '팀 협업 + API 접근 + 전담 관리자' }
    };
    const info = planInfo[plan];

    document.getElementById('paymentPlanName').textContent = info.name;
    document.getElementById('paymentPlanPrice').textContent = `₩${info.price}/월`;
    document.getElementById('paymentPlanFeatures').textContent = info.features;
    document.getElementById('selectedPaymentPlan').value = plan;

    // 결제 방식 초기화
    selectPaymentMethod('card');
    showModal('paymentModal');
}

// 결제 방식 선택
function selectPaymentMethod(method) {
    currentPaymentMethod = method;

    // 버튼 활성화 상태 변경
    document.querySelectorAll('.payment-method').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-method="${method}"]`)?.classList.add('active');

    // 입력 폼 표시/숨김
    document.getElementById('cardPaymentForm').style.display = method === 'card' ? 'block' : 'none';
    document.getElementById('tossPaymentForm').style.display = method === 'toss' ? 'block' : 'none';
    document.getElementById('bankTransferForm').style.display = method === 'bank' ? 'block' : 'none';

    // 결제 버튼 텍스트 변경
    const payBtn = document.querySelector('#paymentModal .btn-primary');
    if (method === 'card') {
        payBtn.textContent = '💳 카드 결제하기';
    } else if (method === 'toss') {
        payBtn.textContent = '🔵 토스페이먼츠로 결제';
    } else {
        payBtn.textContent = '✅ 입금 완료 확인 요청';
    }
}

// 결제 처리
function processPayment() {
    const plan = document.getElementById('selectedPaymentPlan').value;
    const planName = plan === 'pro' ? 'Pro' : 'Enterprise';
    const planPrice = plan === 'pro' ? '29,000' : '99,000';

    if (currentPaymentMethod === 'card') {
        processCardPayment(plan, planName);
    } else if (currentPaymentMethod === 'toss') {
        processTossPayment(plan, planName, planPrice);
    } else {
        processBankTransfer(plan, planName);
    }
}

// 카드 결제 처리 (준비중 - 실제 PG 연동 필요)
function processCardPayment(plan, planName) {
    alert(`💳 신용카드 결제 기능 준비중입니다.\n\n현재는 계좌이체로만 결제 가능합니다.\n입금 확인 후 플랜이 활성화됩니다.`);
    selectPaymentMethod('bank');
}

// 토스페이먼츠 결제 (준비중 - 가맹점 등록 필요)
// 토스페이먼츠 결제 (준비중 - 가맹점 등록 필요)
function processTossPayment(plan, planName, price) {
    alert(`🔵 토스페이먼츠 결제 기능 준비중입니다.\n\n가맹점 등록 후 이용 가능합니다.\n현재는 계좌이체로만 결제 가능합니다.`);
    selectPaymentMethod('bank');
}

// 계좌이체 처리 - 로그인 필수, 결제 요청 생성
function processBankTransfer(plan, planName) {
    // 로그인 체크
    if (!currentUser.isLoggedIn) {
        alert('⚠️ 결제를 진행하려면 먼저 로그인해주세요.');
        closeModal('paymentModal');
        showUserLogin();
        return;
    }

    const depositorName = document.getElementById('depositorName').value;
    const planPrice = plan === 'pro' ? '29,000' : '99,000';

    if (!depositorName) {
        alert('입금자명을 입력해주세요.');
        return;
    }

    const btn = document.querySelector('#paymentModal .btn-primary');
    btn.textContent = '확인 요청 중...';
    btn.disabled = true;

    // 결제 요청 생성
    const paymentRequest = {
        id: Date.now(),
        userId: currentUser.id,
        username: currentUser.username,
        depositorName: depositorName,
        plan: plan,
        planName: planName,
        price: planPrice,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    paymentRequests.push(paymentRequest);
    savePaymentRequests();

    setTimeout(() => {
        closeModal('paymentModal');
        btn.textContent = '✅ 입금 완료 확인 요청';
        btn.disabled = false;
        document.getElementById('depositorName').value = '';

        alert(`입금 확인 요청이 접수되었습니다.\n\n입금자명: ${depositorName}\n플랜: ${planName}\n금액: ₩${planPrice}\n\n관리자 확인 후 플랜이 활성화됩니다.\n(영업일 기준 1-2일 소요)`);
        showNotification(`📋 ${planName} 플랜 입금 확인 요청이 접수되었습니다.`);
    }, 1000);
}

// 카드 입력 초기화
function clearCardInputs() {
    document.getElementById('cardNumber').value = '';
    document.getElementById('cardExpiry').value = '';
    document.getElementById('cardCVC').value = '';
    document.getElementById('cardName').value = '';
}

// 계좌번호 복사
function copyAccountNumber() {
    const accountNumber = '100-107-464347';
    navigator.clipboard.writeText(accountNumber).then(() => {
        showNotification('📋 계좌번호가 복사되었습니다!');
    }).catch(() => {
        alert('계좌번호: ' + accountNumber);
    });
}

// 카드 번호 포맷팅
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/\D/g, '');
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formatted.substring(0, 19);
}

// 만료일 포맷팅
function formatExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value.substring(0, 5);
}

// Admin
function showAdminLogin(e) {
    e.preventDefault();
    showModal('adminLoginModal');
}

function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    // Simple demo authentication
    if (username === 'admin' && password === 'mypassword123') {
        currentUser.isAdmin = true;
        currentUser.plan = 'enterprise'; // 관리자는 전체 서비스 이용 가능
        document.getElementById('currentPlanName').textContent = 'Enterprise (관리자)';
        closeModal('adminLoginModal');
        showPage('admin');
        showNotification('🔐 관리자로 로그인했습니다. 전체 서비스를 이용할 수 있습니다.');
        renderAgents();
        renderUserAgents();
    } else {
        alert('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Close modal when clicking outside
window.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, hsl(260, 85%, 58%) 0%, hsl(200, 95%, 55%) 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==== 사용자 인증 시스템 ====

// 로그인 모달 표시
function showUserLogin() {
    showModal('userLoginModal');
}

// 인증 탭 전환
let currentAuthMode = 'login';
function switchAuthTab(mode) {
    currentAuthMode = mode;
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    document.getElementById('loginForm').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('authSubmitBtn').textContent = mode === 'login' ? '로그인' : '회원가입';
}

// 인증 제출
function submitAuth() {
    if (currentAuthMode === 'login') {
        userLogin();
    } else {
        userRegister();
    }
}

// 사용자 로그인
function userLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return;
    }

    const user = registeredUsers.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = {
            id: user.id,
            username: user.username,
            name: user.name,
            plan: user.plan,
            isAdmin: false,
            isLoggedIn: true
        };
        document.getElementById('currentPlanName').textContent = getPlanDisplayName(user.plan);
        closeModal('userLoginModal');
        showNotification(`🎉 ${user.name}님, 환영합니다!`);
        renderAgents();
        renderUserAgents();
        updateNavForLoggedIn();
    } else {
        alert('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
}

// 사용자 회원가입
function userRegister() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const name = document.getElementById('registerName').value;

    if (!username || !password || !name) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    if (registeredUsers.find(u => u.username === username)) {
        alert('이미 사용 중인 아이디입니다.');
        return;
    }

    const newUser = {
        id: Date.now(),
        username: username,
        password: password,
        name: name,
        plan: 'free',
        createdAt: new Date().toISOString()
    };

    registeredUsers.push(newUser);
    saveUsers();

    // 자동 로그인
    currentUser = {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        plan: 'free',
        isAdmin: false,
        isLoggedIn: true
    };

    closeModal('userLoginModal');
    showNotification(`🎉 ${name}님, 회원가입을 환영합니다!`);
    updateNavForLoggedIn();
    clearRegisterForm();
}

// 회원가입 폼 초기화
function clearRegisterForm() {
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerPasswordConfirm').value = '';
    document.getElementById('registerName').value = '';
}

// 로그아웃
function userLogout() {
    currentUser = {
        id: null,
        username: null,
        plan: 'free',
        isAdmin: false,
        isLoggedIn: false
    };
    document.getElementById('currentPlanName').textContent = 'Starter';
    showNotification('👋 로그아웃되었습니다.');
    showPage('home');
    renderAgents();
    updateNavForLoggedOut();
}

// 네비게이션 업데이트 (로그인 상태)
function updateNavForLoggedIn() {
    const nav = document.querySelector('.nav-actions');
    nav.innerHTML = `
        <span style="color: var(--text-secondary); margin-right: 1rem;">👤 ${currentUser.name}</span>
        <button class="btn-secondary btn-sm" onclick="userLogout()">로그아웃</button>
    `;
}

// 네비게이션 업데이트 (로그아웃 상태)
function updateNavForLoggedOut() {
    const nav = document.querySelector('.nav-actions');
    nav.innerHTML = `<button class="btn-primary" onclick="showUserLogin()">로그인</button>`;
}

// 플랜 표시 이름
function getPlanDisplayName(plan) {
    const names = { free: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
    return names[plan] || 'Starter';
}

// ==== 결제 요청 시스템 ====

// 결제 요청 목록 렌더링
function renderPaymentRequests() {
    const list = document.getElementById('paymentRequestsList');
    if (!list) return;

    const pendingRequests = paymentRequests.filter(r => r.status === 'pending');

    if (pendingRequests.length === 0) {
        list.innerHTML = '<p style="color: var(--text-tertiary); text-align: center;">대기 중인 결제 요청이 없습니다.</p>';
        return;
    }

    list.innerHTML = pendingRequests.map(req => `
        <div class="payment-request-item">
            <div class="request-info">
                <strong>${req.depositorName}</strong> (${req.username})
                <span class="request-plan">${req.planName} 플랜 - ₩${req.price}</span>
                <span class="request-date">${new Date(req.createdAt).toLocaleString('ko-KR')}</span>
            </div>
            <div class="request-actions">
                <button class="btn-sm btn-success" onclick="approvePayment(${req.id})">✓ 승인</button>
                <button class="btn-sm btn-danger" onclick="rejectPayment(${req.id})">✗ 거절</button>
            </div>
        </div>
    `).join('');
}

// 결제 승인
function approvePayment(requestId) {
    const request = paymentRequests.find(r => r.id === requestId);
    if (!request) return;

    // 사용자 플랜 업데이트
    const user = registeredUsers.find(u => u.id === request.userId);
    if (user) {
        user.plan = request.plan;
        saveUsers();
    }

    // 요청 상태 업데이트
    request.status = 'approved';
    request.approvedAt = new Date().toISOString();
    savePaymentRequests();

    showNotification(`✅ ${request.depositorName}님의 ${request.planName} 플랜이 승인되었습니다.`);
    renderPaymentRequests();
    renderUsersList();
}

// 결제 거절
function rejectPayment(requestId) {
    const request = paymentRequests.find(r => r.id === requestId);
    if (!request) return;

    request.status = 'rejected';
    request.rejectedAt = new Date().toISOString();
    savePaymentRequests();

    showNotification(`❌ ${request.depositorName}님의 결제 요청이 거절되었습니다.`);
    renderPaymentRequests();
}

// ==== 사용자 관리 ====

// 사용자 목록 렌더링
function renderUsersList() {
    const list = document.getElementById('usersList');
    if (!list) return;

    if (registeredUsers.length === 0) {
        list.innerHTML = '<p style="color: var(--text-tertiary); text-align: center;">등록된 사용자가 없습니다.</p>';
        return;
    }

    list.innerHTML = registeredUsers.map(user => `
        <div class="user-item">
            <div class="user-info">
                <strong>${user.name}</strong> 
                <span class="user-username">@${user.username}</span>
                <span class="user-plan-badge ${user.plan}">${getPlanDisplayName(user.plan)}</span>
            </div>
            <div class="user-actions">
                <select onchange="changeUserPlan(${user.id}, this.value)" class="plan-select">
                    <option value="free" ${user.plan === 'free' ? 'selected' : ''}>Starter (무료)</option>
                    <option value="pro" ${user.plan === 'pro' ? 'selected' : ''}>Pro</option>
                    <option value="enterprise" ${user.plan === 'enterprise' ? 'selected' : ''}>Enterprise</option>
                </select>
            </div>
        </div>
    `).join('');

    // 통계 업데이트
    updateUserStats();
}

// 사용자 플랜 변경
function changeUserPlan(userId, newPlan) {
    const user = registeredUsers.find(u => u.id === userId);
    if (user) {
        user.plan = newPlan;
        saveUsers();
        showNotification(`✅ ${user.name}님의 플랜이 ${getPlanDisplayName(newPlan)}으로 변경되었습니다.`);
        renderUsersList();
    }
}

// 통계 업데이트
function updateUserStats() {
    const total = registeredUsers.length;
    const pro = registeredUsers.filter(u => u.plan === 'pro').length;
    const enterprise = registeredUsers.filter(u => u.plan === 'enterprise').length;

    const totalEl = document.getElementById('totalUsersCount');
    const proEl = document.getElementById('proUsersCount');
    const entEl = document.getElementById('enterpriseUsersCount');

    if (totalEl) totalEl.textContent = total;
    if (proEl) proEl.textContent = pro;
    if (entEl) entEl.textContent = enterprise;
}

// 관리자 페이지 진입 시 렌더링
const originalShowPage = showPage;
showPage = function (page) {
    originalShowPage(page);
    if (page === 'admin') {
        renderPaymentRequests();
        renderUsersList();
    }
};

// 常量定义
const APP_CONFIG = {
    MAX_NAV_CATEGORIES: 10,
    LOCAL_STORAGE_KEY: 'app_story_categories_setting',
    THEME_KEY: 'app_story_theme',
    STORIES_PER_PAGE: 20,

};

// 应用状态
let appState = {
    activeCategoryId: null,
    currentPage: 1,
    stories: [],
    categories: [],
    selectedCategoryIds: [],
    isLoading: false,
    hasMoreData: true
};

// DOM元素
const elements = {
    categoryList: document.getElementById('categoryList'),
    storyList: document.getElementById('storyList'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    noResult: document.getElementById('noResult'),

    storyDetail: document.getElementById('storyDetail'),
    detailTitle: document.getElementById('detailTitle'),
    detailMeta: document.getElementById('detailMeta'),
    detailText: document.getElementById('detailText'),
    backBtn: document.getElementById('backBtn'),
    settingsFab: document.getElementById('settingsFab'),
    settingsMenu: document.getElementById('settingsMenu'),
    themeToggle: document.getElementById('themeToggle'),
    categorySettings: document.getElementById('categorySettings'),

    categorySettingsModal: document.getElementById('categorySettingsModal'),
    categorySettingsList: document.getElementById('categorySettingsList'),
    categoryModalClose: document.getElementById('categoryModalClose'),
    saveSettings: document.getElementById('saveSettings'),
    overlay: document.getElementById('overlay')
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // 显示初始加载遮罩
    showInitialLoading();

    try {
        // 检查保存的主题
        checkSavedTheme();

        // 加载分类
        await loadCategories();

        // 加载用户设置
        loadUserCategorySettings();

        // 渲染分类
        renderCategories();

        // 加载故事
        await loadStories();

        // 绑定事件
        bindEvents();

        // 初始化无限滚动
        initInfiniteScroll();

    } catch (error) {
        console.error('应用初始化失败:', error);
        showToast('应用初始化失败，请刷新页面重试', 'error');
    } finally {
        // 隐藏初始加载遮罩
        hideInitialLoading();
    }
}

// 绑定事件
function bindEvents() {
    // 搜索相关


    // 故事详情
    elements.backBtn?.addEventListener('click', closeStoryDetail);

    // 设置相关
    elements.settingsFab?.addEventListener('click', toggleSettingsMenu);
    elements.themeToggle?.addEventListener('click', toggleTheme);
    elements.categorySettings?.addEventListener('click', openCategorySettingsModal);


    // 分类设置弹窗
    elements.categoryModalClose?.addEventListener('click', closeCategorySettingsModal);
    elements.saveSettings?.addEventListener('click', saveCategorySettings);

    // 遮罩层
    elements.overlay?.addEventListener('click', closeAllModals);



    // 分类设置弹窗点击外部关闭
    elements.categorySettingsModal?.addEventListener('click', (e) => {
        if (e.target === elements.categorySettingsModal) {
            closeCategorySettingsModal();
        }
    });
}

// 加载分类
async function loadCategories() {
    try {
        const options = {
            orderBy: { column: 'sort_id', ascending: false }
        };

        const { data, error } = await window.supabaseClient.fetchData('story_category', options);

        if (error) throw error;
        const newData = new Array(5);
        for (var i = 0;i<5;i++){
            newData[i] = data[i];
        }
        appState.categories = newData || [];

    } catch (error) {
        console.error('加载分类失败:', error);
        showToast('加载分类失败', 'error');
    }
}

// 渲染分类
function renderCategories() {
    if (!elements.categoryList) return;

    // 获取用户选择的分类或默认显示前10个
    const displayCategories = appState.selectedCategoryIds.length > 0
        ? appState.categories.filter(cat => appState.selectedCategoryIds.includes(cat.id))
        : appState.categories.slice(0, APP_CONFIG.MAX_NAV_CATEGORIES);

    //如果没有默认选择时，则模式选中第一个分类
    if(appState.activeCategoryId == null){
        appState.activeCategoryId = displayCategories[0].id;
    }
    elements.categoryList.innerHTML = displayCategories.map(category => `
        <div class="category-item ${category.id === appState.activeCategoryId ? 'active' : ''}" 
             data-category-id="${category.id}" 
             onclick="handleCategoryClick(${category.id})">
            ${category.name}
        </div>
    `).join('');
}

// 处理分类点击
function handleCategoryClick(categoryId) {
    if (appState.activeCategoryId === categoryId) return;

    // 显示加载遮罩
    showCategoryLoading();

    appState.activeCategoryId = categoryId;
    appState.currentPage = 1;
    appState.stories = [];
    appState.hasMoreData = true;

    renderCategories();
    loadStories().finally(() => {
        // 隐藏加载遮罩
        hideCategoryLoading();
    });
}

// 加载故事
async function loadStories(append = false) {
    if (appState.isLoading || (!append && !appState.hasMoreData)) return;

    appState.isLoading = true;
    showLoading();

    try {
        const options = {
            orderBy: { column: 'id', ascending: true },
            pagination: { page: appState.currentPage, pageSize: APP_CONFIG.STORIES_PER_PAGE },
            filter: {}
        };

        // 添加分类参数
        if (appState.activeCategoryId) {
            options.filter = {category_id:appState.activeCategoryId}
        }

        const { data, error } = await window.supabaseClient.fetchData('story_main', options);

        if (error) throw error;

        const stories = data || [];

        if (append) {
            appState.stories = [...appState.stories, ...stories];
        } else {
            appState.stories = stories;
        }

        appState.hasMoreData = stories.length === APP_CONFIG.STORIES_PER_PAGE;

        renderStories();

    } catch (error) {
        console.error('加载故事失败:', error);
        showToast('加载故事失败', 'error');
    } finally {
        appState.isLoading = false;
        hideLoading();
    }
}

// 渲染故事列表
function renderStories() {
    if (!elements.storyList) return;

    if (appState.stories.length === 0) {
        elements.storyList.innerHTML = '';
        elements.noResult.style.display = 'flex';
        return;
    }

    elements.noResult.style.display = 'none';

    elements.storyList.innerHTML = appState.stories.map(story => {
        const excerpt = story.excerpt.replace(/<[^>]*>/g, '').substring(0, 120) + '...';
        const categoryName = story.category_name;
        const likeCount = story.length || 0;

        return `
            <div class="story-card" onclick="openStoryDetail(${JSON.stringify(story).replace(/\"/g, "'")})">
                <div class="story-header">
                    <h3 class="story-title">${story.title}</h3>
                    <span class="story-category">${categoryName}</span>
                </div>
                <p class="story-excerpt">${excerpt}</p>
                <div class="story-meta">
                    <div class="story-stats">
                        <span><i class="fas fa-file-alt"></i> ${likeCount}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 打开故事详情
async function openStoryDetail(story) {
    try {
        const options = {
            filter: { story_id: story.id }
        };

        const { data, error } = await window.supabaseClient.fetchData('story_content', options);

        if (error) throw error;

        const storyContent = data && data.length > 0 ? data[0] : null;
        if (!storyContent) {
            throw new Error('故事不存在');
        }


        // 显示故事元信息（标题和分类在同一层级）
        elements.detailMeta.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 18px; font-weight: 500">${story.title}</span>
                <span style="color: var(--primary-light); font-size: 12px; font-weight: 300; ">${story.category_name}</span>
            </div>
        `;

        elements.detailText.innerHTML = storyContent.content;

        elements.storyDetail.style.display = 'block';
        setTimeout(() => {
            elements.storyDetail.classList.add('show');
        }, 10);

    } catch (error) {
        console.error('加载故事详情失败:', error);
        showToast('加载故事详情失败', 'error');
    }
}

// 关闭故事详情
function closeStoryDetail() {
    elements.storyDetail.classList.remove('show');
    setTimeout(() => {
        elements.storyDetail.style.display = 'none';
    }, 300);
}



// 设置相关功能
function toggleSettingsMenu() {
    const isVisible = elements.settingsMenu.style.display === 'block';

    if (isVisible) {
        elements.settingsMenu.style.display = 'none';
        elements.settingsFab.classList.remove('active');
    } else {
        elements.settingsMenu.style.display = 'block';
        elements.settingsFab.classList.add('active');
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem(APP_CONFIG.THEME_KEY, isDark ? 'dark' : 'light');

    // 更新图标
    const icon = elements.themeToggle.querySelector('i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';

    // 更新文本
    const text = elements.themeToggle.querySelector('span');
    text.textContent = isDark ? '浅色模式' : '深色模式';

    // 关闭设置菜单
    toggleSettingsMenu();

    // showToast(`已切换到${isDark ? '深色' : '浅色'}模式`, 'success');
}

function checkSavedTheme() {
    const savedTheme = localStorage.getItem(APP_CONFIG.THEME_KEY);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');

        // 更新设置菜单中的图标和文本
        setTimeout(() => {
            const icon = elements.themeToggle?.querySelector('i');
            const text = elements.themeToggle?.querySelector('span');
            if (icon) icon.className = 'fas fa-sun';
            if (text) text.textContent = '浅色模式';
        }, 100);
    }
}



// 分类设置相关
function openCategorySettingsModal() {
    // 如果用户还没有保存过分类设置，则使用当前显示的默认分类作为初始选择
    if (appState.selectedCategoryIds.length === 0) {
        appState.selectedCategoryIds = appState.categories.slice(0, APP_CONFIG.MAX_NAV_CATEGORIES).map(cat => cat.id);
    }

    populateCategorySettings();
    elements.categorySettingsModal.style.display = 'flex';
    elements.overlay.style.display = 'block';
    toggleSettingsMenu();
}

function closeCategorySettingsModal() {
    elements.categorySettingsModal.style.display = 'none';
    elements.overlay.style.display = 'none';
}

function populateCategorySettings() {
    if (!elements.categorySettingsList) return;

    // 获取当前实际显示的分类ID列表
    const currentDisplayCategories = appState.selectedCategoryIds.length > 0
        ? appState.selectedCategoryIds
        : appState.categories.slice(0, APP_CONFIG.MAX_NAV_CATEGORIES).map(cat => cat.id);

    elements.categorySettingsList.innerHTML = appState.categories.map(category => {
        const isSelected = currentDisplayCategories.includes(category.id);
        return `
            <div class="category-setting-item ${isSelected ? 'selected' : ''}" data-category-id="${category.id}">
                <span class="category-setting-name">${category.name}</span>
                <div class="category-toggle ${isSelected ? 'active' : ''}" onclick="toggleCategorySelection(${category.id})"></div>
            </div>
        `;
    }).join('');
}

function toggleCategorySelection(categoryId) {
    const index = appState.selectedCategoryIds.indexOf(categoryId);

    if (index > -1) {
        if(appState.selectedCategoryIds.length <= 1){
            showToast(`至少需要选择一个分类`, 'warning')
            return;
        }
        // 移除选择
        appState.selectedCategoryIds.splice(index, 1);
    } else {
        // 添加选择（检查数量限制）
        if (appState.selectedCategoryIds.length >= APP_CONFIG.MAX_NAV_CATEGORIES) {
            showToast(`最多只能选择${APP_CONFIG.MAX_NAV_CATEGORIES}个分类`, 'warning');
            return;
        }
        appState.selectedCategoryIds.push(categoryId);
    }

    // 重新渲染设置列表
    populateCategorySettings();
}

function saveCategorySettings() {
    localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(appState.selectedCategoryIds));

    // 检查当前激活的分类是否还在选中的分类列表中
    const displayCategories = appState.selectedCategoryIds.length > 0
        ? appState.categories.filter(cat => appState.selectedCategoryIds.includes(cat.id))
        : appState.categories.slice(0, APP_CONFIG.MAX_NAV_CATEGORIES);

    // 如果当前激活分类不在显示列表中，切换到第一个可用分类
    if (!displayCategories.find(cat => cat.id === appState.activeCategoryId)) {
        if (displayCategories.length > 0) {
            appState.activeCategoryId = displayCategories[0].id;
        }
    }

    // 重新渲染分类导航
    renderCategories();

    // 重置故事状态并重新加载
    appState.currentPage = 1;
    appState.stories = [];
    appState.hasMoreData = true;
    loadStories();

    closeCategorySettingsModal();
    // showToast('分类设置已保存', 'success');
}

function loadUserCategorySettings() {
    try {
        const saved = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEY);
        if (saved) {
            appState.selectedCategoryIds = JSON.parse(saved);
        }
    } catch (error) {
        console.error('加载用户设置失败:', error);
        appState.selectedCategoryIds = [];
    }
}

// 关闭所有弹窗
function closeAllModals() {
    closeCategorySettingsModal();
    elements.settingsMenu.style.display = 'none';
    elements.settingsFab.classList.remove('active');
}

// 无限滚动
function initInfiniteScroll() {
    let isScrolling = false;

    window.addEventListener('scroll', () => {
        if (isScrolling) return;

        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

        if (scrollTop + clientHeight >= scrollHeight - 1000) {
            if (!appState.isLoading && appState.hasMoreData) {
                isScrolling = true;
                appState.currentPage++;
                loadStories(true).finally(() => {
                    isScrolling = false;
                });
            }
        }
    });
}

// 显示/隐藏加载指示器
function showLoading() {
    if (elements.loadingIndicator) {
        elements.loadingIndicator.style.display = 'flex';
    }
}

function hideLoading() {
    if (elements.loadingIndicator) {
        elements.loadingIndicator.style.display = 'none';
    }
}

// 通用加载遮罩创建函数
function createLoadingOverlay(id, config = {}) {
    const {
        backgroundColor = 'rgba(255, 255, 255, 0.8)',
        blurAmount = '6px',
        fadeInDelay = 10,
        initialOpacity = '0'
    } = config;

    // 创建遮罩元素
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: ${backgroundColor};
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(${blurAmount});
        -webkit-backdrop-filter: blur(${blurAmount});
        opacity: ${initialOpacity};
        transition: opacity 0.3s ease;
    `;

    // 创建加载内容容器
    const loadingContent = document.createElement('div');
    loadingContent.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        background-color: transparent;
        padding: 25px;
        border-radius: 50px;
        transform: scale(1);
        transition: all 0.2s ease;
        animation: pulse 1.5s infinite alternate;
    `;

    // 创建弹跳加载器
    const bouncingLoader = createBouncingLoader();

    // 添加CSS动画样式（如果还没有添加）
    addLoadingStyles();

    loadingContent.appendChild(bouncingLoader);
    overlay.appendChild(loadingContent);
    document.body.appendChild(overlay);

    // 触发淡入动画
    if (fadeInDelay > 0) {
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, fadeInDelay);
    }

    return overlay;
}

// 创建弹跳加载器
function createBouncingLoader() {
    const bouncingLoader = document.createElement('div');
    bouncingLoader.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 14px;
    `;

    // 创建三个弹跳球
    const colors = ['#FF9800', '#8BC34A', '#03A9F4'];
    const delays = ['0s', '0.15s', '0.3s'];

    for (let i = 0; i < 3; i++) {
        const ball = document.createElement('div');
        ball.style.cssText = `
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: ${colors[i]};
            animation: bouncing 0.5s infinite alternate;
            animation-delay: ${delays[i]};
            box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        `;
        bouncingLoader.appendChild(ball);
    }

    return bouncingLoader;
}

// 添加加载动画样式
function addLoadingStyles() {
    if (!document.getElementById('loading-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-animation-styles';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                100% { transform: scale(1.05); }
            }
            @keyframes bouncing {
                0% { transform: translateY(0); }
                100% { transform: translateY(-14px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// 通用隐藏遮罩函数
function hideLoadingOverlay(id, fadeOutDuration = 300) {
    const overlay = document.getElementById(id);
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, fadeOutDuration);
    }
}

// 显示/隐藏分类切换遮罩
function showCategoryLoading() {
    createLoadingOverlay('category-loading-overlay', {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        blurAmount: '5px',
        fadeInDelay: 10
    });
}

function hideCategoryLoading() {
    hideLoadingOverlay('category-loading-overlay', 200);
}

// 显示/隐藏初始加载遮罩
function showInitialLoading() {
    createLoadingOverlay('initial-loading-overlay', {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        blurAmount: '8px',
        fadeInDelay: 0,
        initialOpacity: '1'
    });
}

function hideInitialLoading() {
    hideLoadingOverlay('initial-loading-overlay', 300);
}

function showToast(message, type = 'success') {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${type === 'success' ? 'var(--primary-color)' : type === 'error' ? '#f44336' : '#ff9800'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);

    // 自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 全局函数（供HTML调用）
window.handleCategoryClick = handleCategoryClick;
window.openStoryDetail = openStoryDetail;
window.toggleCategorySelection = toggleCategorySelection;

// 防止页面刷新时的滚动位置恢复
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// 页面可见性变化时的处理
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // 页面变为可见时，可以考虑刷新数据
        // 这里暂时不自动刷新，避免用户体验问题
    }
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error);
    showToast('发生了一个错误，请刷新页面重试', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
    showToast('网络请求失败，请检查网络连接', 'error');
});

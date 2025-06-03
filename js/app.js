// 常量定义
const MAX_NAV_CATEGORIES = 10; // 导航栏最多显示的分类数
const LOCAL_STORAGE_KEY = 'story_categories_setting'; // 本地存储的键名
const VIEW_MODE_KEY = 'story_view_mode'; // 视图模式存储键名

// 当前状态
let currentState = {
    activeCategoryId: null, // 初始为null，加载后设为第一个分类的ID
    currentPage: 1,
    stories: [],
    categories: [],
    selectedCategoryIds: [], // 用户选择的分类ID列表
    searchKeyword: '',
    isLoading: false,   // 是否正在加载数据
    hasMoreData: true,   // 是否还有更多数据
    isSimpleMode: false,  // 是否为简约模式
    welcomeMsg:['欢迎来到《小故事铺》这里藏着一段段温暖的小故事，等你慢慢翻阅，慢慢收藏，和我们一起，在文字里遇见生活的温度',
                '欢迎光临《小故事铺》✨ 星光为笔，梦境作纸，每个故事，都藏着属于你的奇遇',
                '欢迎来到小故事铺 这里的故事都在等你翻开',
                '小故事铺开门啦 今天也偷偷准备了几个温暖小故事',
                '这里装满了好玩的、有趣的、感动的故事，快来选一篇讲给你喜欢的人听吧',
                '喜欢的话就多看几篇 不限量供应小温暖',
                '每天一则好故事，点亮你的好心情',
                '欢迎光临《小故事铺》有些故事，白天不敢看，晚上别错过，深夜来访，胆小勿入']
};

// DOM元素
const elements = {
    categoryTags: document.getElementById('categoryTags'),
    storyGrid: document.getElementById('storyGrid'),
    searchInput: document.getElementById('searchInput'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    storyTitle: document.getElementById('storyTitle'),
    storyType: document.getElementById('storyType'),
    storyReadTime: document.getElementById('storyReadTime'),
    // storyLength: document.getElementById('storyLength'),
    storyContent: document.getElementById('storyContent'),
    homeView: document.querySelector('.home-view'),
    articleView: document.querySelector('.article-view'),
    searchBar: document.querySelector('.search-bar'),
    logo: document.querySelector('.logo'),
    themeToggle: document.getElementById('themeToggle'),
    viewModeToggle: document.getElementById('viewModeToggle'),
    refreshButton: document.getElementById('refreshButton'),
    searchButton: document.getElementById('searchButton'),
    floatingSearch: document.getElementById('floatingSearch'),
    searchClose: document.getElementById('searchClose'),
    // searchClear: document.getElementById('searchClear'),
    // searchSubmit: document.getElementById('searchSubmit'),
    categorySettingsButton: document.getElementById('categorySettingsButton'),
    categorySettingsModal: document.getElementById('categorySettingsModal'),
    categorySettingsList: document.getElementById('categorySettingsList'),
    settingsClose: document.getElementById('settingsClose')
};

// 添加侧边栏的DOM元素
const sidebarElements = {
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebarClose: document.getElementById('sidebarClose'),
    multiFunctionButton: document.getElementById('multiFunctionButton'),
    functionDropdown: document.getElementById('functionDropdown'),
    mainContainer: document.getElementById('mainContainer')
};

// document.addEventListener('contextmenu',
//     event => event.preventDefault()
// );
//
// document.addEventListener("keydown", function (event){
//     if (event.ctrlKey){
//         event.preventDefault();
//     }
//     if(event.keyCode == 123){
//         event.preventDefault();
//     }
// });

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 显示欢迎动画
    showWelcomeAnimation();

    // 加载分类
    loadCategories();

    // 绑定搜索事件到浮动搜索框内的输入框，而不是直接绑定到 elements.searchInput
    elements.floatingSearch.querySelector('#searchInput').addEventListener('keydown', handleSearchKeydown);

    // Logo点击事件
    elements.logo.addEventListener('click', () => {
        if (elements.homeView.style.display !== 'none') {
            refreshHome();
        } else {
            showHome();
        }
    });

    // 主题切换
    elements.themeToggle.addEventListener('click', toggleTheme);

    // 视图模式切换
    elements.viewModeToggle.addEventListener('click', toggleViewMode);

    // 刷新按钮
    elements.refreshButton.addEventListener('click', refreshHome);

    // 搜索按钮和关闭按钮
    elements.searchButton.addEventListener('click', toggleSearchBox);
    elements.searchClose.addEventListener('click', closeSearchBox);

    // 新增的清除和提交按钮 - 改为通过浮动搜索框找到按钮
    // elements.floatingSearch.querySelector('#searchClear').addEventListener('click', clearSearchInput);
    // elements.floatingSearch.querySelector('#searchSubmit').addEventListener('click', submitSearch);

    // 分类设置按钮点击事件
    elements.categorySettingsButton.addEventListener('click', openCategorySettingsModal);
    elements.settingsClose.addEventListener('click', closeCategorySettingsModal);

    // 点击遮罩关闭搜索框
    // elements.floatingSearch.addEventListener('click', (e) => {
    //     if (e.target === elements.floatingSearch) {
    //         closeSearchBox();
    //     }
    // });

    // 点击设置弹窗背景关闭弹窗
    elements.categorySettingsModal.addEventListener('click', (e) => {
        if (e.target === elements.categorySettingsModal) {
            closeCategorySettingsModal();
        }
    });

    // ESC键关闭搜索框和设置弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // 检查当前是否有弹窗打开
            const isSearchOpen = elements.floatingSearch.classList.contains('active');
            const isSettingsOpen = elements.categorySettingsModal.classList.contains('active');
            const isDropdownOpen = sidebarElements.multiFunctionButton.classList.contains('active');

            if (isSearchOpen) {
                closeSearchBox();
            } else if (isSettingsOpen) {
                closeCategorySettingsModal();
            } else if (isDropdownOpen) {
                toggleFunctionDropdown();
            }
        }
    });

    // 添加滚动事件监听
    window.addEventListener('scroll', handleScroll);

    // 添加输入框焦点事件 - 改为通过浮动搜索框找到输入框
    const floatingSearchInput = elements.floatingSearch.querySelector('#searchInput');
    floatingSearchInput.addEventListener('focus', () => {
        const floatingSearchBar = elements.floatingSearch.querySelector('.search-bar');
        if (floatingSearchBar) {
            floatingSearchBar.classList.add('search-focus');
        }
    });

    floatingSearchInput.addEventListener('blur', () => {
        const floatingSearchBar = elements.floatingSearch.querySelector('.search-bar');
        if (floatingSearchBar) {
            floatingSearchBar.classList.remove('search-focus');
        }
    });

    // 监听输入变化以显示/隐藏清除按钮
    // floatingSearchInput.addEventListener('input', () => {
    //     const floatingSearchClear = elements.floatingSearch.querySelector('#searchClear');
    //     if (floatingSearchInput.value.trim() === '') {
    //         floatingSearchClear.style.visibility = 'hidden';
    //         floatingSearchClear.style.opacity = '0';
    //     } else {
    //         floatingSearchClear.style.visibility = 'visible';
    //         floatingSearchClear.style.opacity = '0.7';
    //     }
    // });

    // 检查并应用存储的主题
    checkSavedTheme();

    // 检查并应用存储的视图模式
    checkSavedViewMode();

    // 侧边栏控制
    initSidebar();
});

// 初始化侧边栏
function initSidebar() {
    // 侧边栏收起按钮
    sidebarElements.sidebarClose.addEventListener('click', toggleSidebar);

    // 侧边栏展开按钮（在collapsed状态显示）
    sidebarElements.sidebarToggle.addEventListener('click', toggleSidebar);

    // 创建侧边栏遮罩层元素
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);

    // 点击遮罩关闭侧边栏（移动设备）
    sidebarOverlay.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            document.body.classList.remove('sidebar-mobile-open');
        }
    });

    // 多功能按钮点击事件
    sidebarElements.multiFunctionButton.addEventListener('click', toggleFunctionDropdown);

    // 点击其他区域关闭下拉菜单
    document.addEventListener('click', (e) => {
        // 如果点击的不是多功能按钮内的元素，则关闭下拉菜单
        const isClickInsideButton = sidebarElements.multiFunctionButton.contains(e.target);
        if (!isClickInsideButton && sidebarElements.multiFunctionButton.classList.contains('active')) {
            toggleFunctionDropdown();
        }
    });

    // 从功能下拉菜单中移动原有功能按钮的事件监听
    document.getElementById('viewModeToggle').addEventListener('click', toggleViewMode);
    document.getElementById('categorySettingsButton').addEventListener('click', openCategorySettingsModal);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('refreshButton').addEventListener('click', refreshHome);

    // 响应式处理
    handleResponsiveSidebar();
    window.addEventListener('resize', handleResponsiveSidebar);

    // 检查本地存储中的侧边栏状态
    const isSidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    if (isSidebarCollapsed && window.innerWidth > 768) {
        document.body.classList.add('sidebar-collapsed');

        // 设置切换按钮初始状态
        const toggleIcon = sidebarElements.sidebarToggle.querySelector('i');
        if (toggleIcon) {
            toggleIcon.style.transform = 'rotate(0)';
        }
    } else if (window.innerWidth > 768) {
        // 默认展开状态
        const toggleIcon = sidebarElements.sidebarToggle.querySelector('i');
        if (toggleIcon) {
            toggleIcon.style.transform = 'rotate(180deg)';
        }
    }
}

// 切换侧边栏显示/隐藏
function toggleSidebar() {
    // 移动设备上
    if (window.innerWidth <= 768) {
        document.body.classList.toggle('sidebar-mobile-open');
    }
    // 桌面设备上
    else {
        document.body.classList.toggle('sidebar-collapsed');

        // 箭头方向动画
        const toggleIcon = sidebarElements.sidebarToggle.querySelector('i');
        if (document.body.classList.contains('sidebar-collapsed')) {
            toggleIcon.style.transform = 'rotate(0)';
        } else {
            toggleIcon.style.transform = 'rotate(180deg)';
        }

        // 存储侧边栏状态
        localStorage.setItem('sidebar_collapsed', document.body.classList.contains('sidebar-collapsed'));
    }
}

// 切换多功能按钮下拉菜单
function toggleFunctionDropdown() {
    sidebarElements.multiFunctionButton.classList.toggle('active');
}

// 响应式处理侧边栏
function handleResponsiveSidebar() {
    // 移动设备上
    if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-collapsed');
        // 如果之前在移动设备上打开了侧边栏，保持打开状态
        if (localStorage.getItem('sidebar_mobile_open') === 'true') {
            document.body.classList.add('sidebar-mobile-open');
        }
    }
    // 桌面设备上
    else {
        document.body.classList.remove('sidebar-mobile-open');
        // 恢复桌面设备上的侧边栏状态
        if (localStorage.getItem('sidebar_collapsed') === 'true') {
            document.body.classList.add('sidebar-collapsed');
        }
    }
}

// 显示欢迎动画
function showWelcomeAnimation() {
    const welcomeText = currentState.welcomeMsg[getRandomInt()];
    // 添加初始欢迎遮罩
    const welcomeOverlay = document.createElement('div');
    welcomeOverlay.className = 'welcome-overlay';
    welcomeOverlay.innerHTML = `
        <div class="welcome-content">
<!--            <div class="welcome-icon">-->
<!--                <i class="fas fa-book"></i>-->
<!--            </div>-->
            <div class="welcome-icon">
                <img src="../img/story.png" alt="小故事铺" class="logo-img">
            </div>
            <h1 class="welcome-title">小故事铺</h1>
            <p class="welcome-text">${welcomeText}</p>
        </div>
    `;
    document.body.appendChild(welcomeOverlay);

    // 简单的加载动画后移除
    setTimeout(() => {
        welcomeOverlay.classList.add('welcome-fade');
        setTimeout(() => {
            document.body.removeChild(welcomeOverlay);
        }, 1000);
    }, 2000);
}

// 刷新首页
function refreshHome() {
    // 添加淡出渐变动画
    elements.storyGrid.style.opacity = '0';
    elements.storyGrid.style.transform = 'translateY(10px)';

    // 显示加载遮罩
    showLoading();

    // 重置状态
    currentState.currentPage = 1;
    currentState.searchKeyword = '';
    currentState.hasMoreData = true;
    currentState.stories = []; // 清空当前故事列表

    // 重置浮动搜索框中的搜索输入
    const floatingSearchInput = elements.floatingSearch.querySelector('#searchInput');
    if (floatingSearchInput) {
        floatingSearchInput.value = '';
    }

    // 恢复默认分类设置
    currentState.selectedCategoryIds = currentState.categories.slice(0, MAX_NAV_CATEGORIES).map(cat => cat.id);
    saveUserCategorySettings();
    renderCategories();

    // 显示重置成功提示
    showToast('已恢复默认设置', 'info');

    setTimeout(() => {
        // 显示加载中状态并重新加载第一个分类
        if (currentState.categories.length > 0) {
            // 使用用户已选择的第一个分类，如果没有选择则使用第一个分类
            const firstSelectedCategory = currentState.selectedCategoryIds.length > 0
                ? currentState.categories.find(c => c.id === currentState.selectedCategoryIds[0])
                : currentState.categories[0];

            if (firstSelectedCategory) {
                handleCategoryChange(firstSelectedCategory.id, true);

                // 选中第一个分类标签
                document.querySelectorAll('.filter-tag').forEach(tag => {
                    tag.classList.remove('active');
                    if (parseInt(tag.dataset.id) === firstSelectedCategory.id) {
                        tag.classList.add('active');
                    }
                });
            }
        }

        // 淡入动画
        setTimeout(() => {
            elements.storyGrid.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            elements.storyGrid.style.opacity = '1';
            elements.storyGrid.style.transform = 'translateY(0)';
        }, 150);
    }, 150);
}

// 显示加载遮罩
function showLoading(isAppend = false) {
    elements.loadingOverlay.classList.add('active');

    // 如果不是追加模式且没有其他弹窗打开，则禁止滚动并记录位置
    if (!isAppend && !document.body.classList.contains('modal-open')) {
        document.body.classList.add('modal-open');
        // 记录加载前的滚动位置
        window.loadingScrollY = window.scrollY;
    }
}

// 隐藏加载遮罩
function hideLoading(isAppend = false, scrollPos = 0) {
    // 添加淡出动画效果
    elements.loadingOverlay.classList.add('fade-out');

    setTimeout(() => {
        elements.loadingOverlay.classList.remove('active');
        elements.loadingOverlay.classList.remove('fade-out');

        // 如果没有其他弹窗打开，则恢复滚动
        // 避免与已打开的弹窗冲突
        const isSearchOpen = elements.floatingSearch.classList.contains('active');
        const isSettingsOpen = elements.categorySettingsModal.classList.contains('active');

        if (!isSearchOpen && !isSettingsOpen) {
            document.body.classList.remove('modal-open');

            // 如果是追加模式，则维持当前滚动位置
            if (isAppend) {
                window.scrollTo(0, scrollPos);
            }
            // 否则恢复加载前的滚动位置
            else if (window.loadingScrollY !== undefined) {
                window.scrollTo(0, window.loadingScrollY);
                window.loadingScrollY = undefined;
            }
        }
    }, 200);
}

// 监听滚动事件
function handleScroll() {
    // 如果不在首页视图，不处理滚动加载
    if (elements.homeView.style.display === 'none') {
        return;
    }

    // 如果正在加载或者没有更多数据，不进行加载
    if (currentState.isLoading || !currentState.hasMoreData) {
        return;
    }

    // 判断是否滚动到页面底部附近
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );

    // 当滚动到距离底部300px以内时，加载下一页
    if (scrollTop + windowHeight > documentHeight - 300) {
        loadMoreStories();
    }
}

// 检查页面内容是否足够出现滚动条
function checkIfScrollNeeded() {
    // 如果正在加载或者没有更多数据，不检查
    if (currentState.isLoading || !currentState.hasMoreData) {
        return;
    }

    // 获取窗口高度和文档高度
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );
    // 如果文档高度不足以产生滚动条，且还有更多数据可加载，则加载更多
    if (documentHeight <= windowHeight && currentState.hasMoreData) {
        // 递归加载更多内容，直到出现滚动条或没有更多数据
        loadMoreStories(() => checkIfScrollNeeded());
    }
}

// 加载更多故事
function loadMoreStories(callback) {
    // 设置加载中状态，防止重复触发
    currentState.isLoading = true;

    // 显示加载遮罩，与搜索加载保持一致，但标记为追加模式
    showLoading(true);

    // 增加页码
    currentState.currentPage++;

    // 添加淡出动画，与搜索加载一致
    const existingCards = elements.storyGrid.querySelectorAll('.content-card');
    existingCards.forEach((card, index) => {
        card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        card.style.opacity = '0.7';
        card.style.transform = 'translateY(-5px)';
    });

    // 延迟加载以展示加载动画
    setTimeout(() => {
        loadStories(true).then(() => {
            // 恢复现有卡片的原样式
            existingCards.forEach((card, index) => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });

            // 如果有回调函数，调用它
            if (typeof callback === 'function') {
                setTimeout(callback, 200);
            }
        });
    }, 200);
}

// 加载分类
async function loadCategories() {
    // 显示加载遮罩
    showLoading();

    try {
        //添加排序
        const options = {
            orderBy:{column:'sort_id',ascending:false}
        }

        // 直接调用window.supabaseClient中的方法
        const { data, error } = await window.supabaseClient.fetchData('story_category',options);
        if (error) {
            console.error('查询Supabase数据出错:', error);
            return null;
        }

        if (data.length > 0) {
            currentState.categories = data;

            // 获取用户设置的分类
            loadUserCategorySettings();

            // 如果用户未选择任何分类或首次使用，使用默认前10个分类
            if (currentState.selectedCategoryIds.length === 0) {
                currentState.selectedCategoryIds = data.slice(0, MAX_NAV_CATEGORIES).map(cat => cat.id);
                saveUserCategorySettings(); // 保存默认设置
            }

            // 设置默认激活的分类为第一个选择的分类
            currentState.activeCategoryId = currentState.selectedCategoryIds[0] || data[0].id;

            renderCategories();

            // 加载默认分类的故事列表
            loadStories();
        } else {
            console.error('加载分类失败:', data.msg);
            hideLoading();
        }
    } catch (error) {
        console.error('加载分类出错:', error);
        hideLoading();
    }
}

// 渲染分类标签，只显示用户选择的分类
function renderCategories() {
    let html = '';

    // 过滤出用户选择的分类
    const selectedCategories = currentState.categories.filter(
        category => currentState.selectedCategoryIds.includes(category.id)
    );

    // 添加用户选择的分类，并默认选中第一个
    selectedCategories.forEach((category, index) => {
        const isActive = category.id === currentState.activeCategoryId;
        //<div class="tag-indicator"></div>
        html += `
            <div class="filter-tag ${isActive ? 'active' : ''}" data-id="${category.id}">
                
                <span class="tag-text">${category.name}</span>
            </div>
        `;
    });

    elements.categoryTags.innerHTML = html;

    // 渐变淡入动画效果
    let tags = document.querySelectorAll('.filter-tag');
    tags.forEach((tag, index) => {
        tag.style.opacity = '0';
        tag.style.transform = 'translateY(5px)';
        setTimeout(() => {
            tag.style.transition = 'all 0.3s ease';
            tag.style.opacity = '1';
            tag.style.transform = 'translateY(0)';
        }, 50 * index);
    });

    // 滚动到当前活动分类
    setTimeout(() => {
    makeNavScrollable();
    }, 300);

    // 绑定分类点击事件
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const categoryId = parseInt(tag.dataset.id);

            // 检查当前是否处于文章详情页
            if (elements.articleView.style.display !== 'none') {
                // 如果在文章页面，先返回主页，然后切换分类
                showHome(true, categoryId);
            } else {
                // 在主页直接切换分类
                handleCategoryChange(categoryId);
            }

            // 在移动设备上，点击分类后自动收起侧边栏
            if (window.innerWidth <= 768) {
                document.body.classList.remove('sidebar-mobile-open');
            }
        });
    });
}

// 使活动分类滚动到可见区域，由于分类区域不再滚动，此函数现在仅用于视觉反馈
function makeNavScrollable() {
    // 为活动分类添加轻微的动画效果，提供视觉反馈
    const activeTag = document.querySelector('.filter-tag.active');
    if (activeTag) {
        // 添加短暂的脉冲动画效果
        activeTag.classList.add('pulse-effect');
        setTimeout(() => {
            activeTag.classList.remove('pulse-effect');
        }, 800);
    }
}

// 渲染故事列表
function renderStories(append = false, keepPosition = false) {
    // 如果要保持当前滚动位置，记录位置
    const scrollPos = keepPosition ? window.scrollY : 0;

    if (currentState.stories.length === 0 && !append) {
        elements.storyGrid.innerHTML = `
            <div class="no-result">
                <div class="no-result-icon">
                    <i class="fas fa-cat"></i>
                </div>
                <div class="no-result-animal">
                    <i class="fas fa-paw"></i>
                </div>
                <div class="no-result-title">抱歉，没有找到符合条件的故事</div>
                <div class="no-result-text">
                    小猫咪很抱歉没有找到您想要的内容。请尝试使用不同的关键词或选择其他分类。
                </div>
            </div>`;
        return;
    }

    // 如果是追加模式且没有故事，则不处理
    if (append && currentState.stories.length === 0) {
        return;
    }

    let html = '';
    const startIndex = append ? currentState.stories.length - currentState.stories.slice(0, 10).length : 0;
    const storiesToRender = currentState.stories.slice(startIndex);

    for (const story of storiesToRender) {
        if (currentState.isSimpleMode) {
             /*<div class="read-indicator"></div>*/
            // 简约模式卡片
            html += `
                <div class="content-card" onclick="loadStoryDetail(${JSON.stringify(story).replace(/\"/g, "'")})">
                   
                    <div class="card-info">
                        <div class="card-category">${story.category_name}</div>
                        <div class="card-title">${story.title}</div>
                        <div class="card-excerpt">${getExcerpt(story.content, 80)}</div>
                        <div class="card-meta">
                            <div class="account-name">${story.category_name}</div>
                            <div class="card-stats">
                                <span><i class="far fa-file-alt"></i> ${story.length}字</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 图片模式卡片 (原有样式)
            html += `
                <div class="content-card" onclick="loadStoryDetail(${JSON.stringify(story).replace(/\"/g, "'")})">
                    <div class="card-category">${story.category_name}</div>
                    <div class="card-thumbnail">
                        <div class="card-placeholder-sketch">
                            <div class="sketch-animal">
                                <div class="ears"></div>
                                <div class="eyes"></div>
                                <div class="nose"></div>
                                <div class="mouth"></div>
                                <div class="whiskers"></div>
                            </div>
                            <div class="sketch-text">暂未设置封面，先来读故事吧~</div>
                        </div>
                        <div class="account-avatar">
                            <i class="fas fa-book-reader"></i>
                        </div>
                    </div>
                    <div class="card-info">
                        <div class="card-title">${story.title}</div>
                        <div class="card-meta">
                            <div class="account-name">${story.category_name}</div>
                            <div class="card-stats">
                                <span><i class="far fa-file-alt"></i> ${story.length}字</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // 如果是追加模式，则添加到现有内容后面，否则替换
    if (append) {
        elements.storyGrid.insertAdjacentHTML('beforeend', html);

        // 为新添加的卡片添加淡入动画
        const cards = elements.storyGrid.querySelectorAll('.content-card');
        for (let i = startIndex; i < cards.length; i++) {
            const card = cards[i];
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 30 * (i - startIndex));
        }
    } else {
        elements.storyGrid.innerHTML = html;

        // 卡片淡入动画
        const cards = elements.storyGrid.querySelectorAll('.content-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 30 * index);
        });
    }

    // 如果需要保持滚动位置，则在动画完成后恢复
    if (keepPosition) {
        setTimeout(() => {
            window.scrollTo(0, scrollPos);
        }, 30);
    }
}

// 显示卡片加载骨架屏
function showCardSkeletons() {
    const cardCount = window.innerWidth > 768 ? 6 : 4;
    let skeletonHtml = '';

    // 根据当前模式显示不同的骨架屏
    if (currentState.isSimpleMode) {
        // 简约模式骨架屏
        for (let i = 0; i < cardCount; i++) {
            skeletonHtml += `
                <div class="content-card-skeleton">
                    <div class="skeleton-info">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-title" style="width: 70%;"></div>
                        <div class="skeleton-meta">
                            <div class="skeleton-meta-item"></div>
                            <div class="skeleton-meta-item"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        // 图片模式骨架屏（原有）
        for (let i = 0; i < cardCount; i++) {
            skeletonHtml += `
                <div class="content-card-skeleton">
                    <div class="skeleton-thumbnail"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-title"></div>
                        <div class="skeleton-meta">
                            <div class="skeleton-meta-item"></div>
                            <div class="skeleton-meta-item"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    elements.storyGrid.innerHTML = skeletonHtml;
}

// 获取故事内容的摘要
function getExcerpt(content, maxLength = 80) {
    if (!content) return '暂无内容预览';

    // 清理内容，移除多余空格和换行
    const cleanContent = content.replace(/\s+/g, ' ').trim();

    // 截取指定长度
    if (cleanContent.length <= maxLength) {
        return cleanContent;
    }

    return cleanContent.substring(0, maxLength) + '...';
}

// 加载故事列表
async function loadStories(append = false) {
    // 如果正在加载且不是被loadMoreStories调用（append=true），不重复请求
    if (currentState.isLoading && !append) {
        return;
    }

    // 记录滚动位置，用于在追加模式下保持
    const scrollPos = append ? window.scrollY : 0;

    // 如果不是被loadMoreStories调用（第一次加载或分类/搜索变更），则设置加载中状态
    if (!append) {
        currentState.isLoading = true;
        // 显示加载遮罩
        showLoading();
        // 显示骨架屏
        showCardSkeletons();
    }

    try {

        const options = {
            orderBy:{column:'id',ascending:true},
            // columns:'title,content,length,read_time,category_id,category_name',
            pagination:{page:currentState.currentPage,pageSize:50},
            filter:{},
            filterLike:{}
        }

        // 添加分类参数
        if (currentState.activeCategoryId) {
            options.filter = {category_id:currentState.activeCategoryId}
        }

        if(currentState.searchKeyword){
            options.filterLike = {title:currentState.searchKeyword};
        }

        const { data, error } = await window.supabaseClient.fetchData('story_main',options);
        if (error) {
            console.error('查询Supabase数据出错:', error);
            return null;
        }

        if (data.length > 0) {
            const newStories = data;

            // 判断是否还有更多数据
            currentState.hasMoreData = newStories.length > 50;

            // 根据append参数决定是追加还是替换数据
            if (append) {
                currentState.stories = [...currentState.stories, ...newStories];
            } else {
                currentState.stories = newStories;
            }

            // 渲染故事列表
            renderStories(append, append);  // 在追加模式下保持滚动位置

            // 首次加载或分类切换后，检查是否需要加载更多内容以产生滚动条
            if (!append) {
                // 延迟执行检查，确保DOM已经完全渲染
                setTimeout(() => {
                    checkIfScrollNeeded();
                }, 300);
            }
        } else {
            // 加载失败也标记为没有更多数据，避免一直请求错误
            currentState.hasMoreData = false;

            if (!append) {
                // 显示空结果提示
                elements.storyGrid.innerHTML = `
                    <div class="no-result">
                        <div class="no-result-icon">
                            <i class="fas fa-cat"></i>
                        </div>
                        <div class="no-result-animal">
                            <i class="fas fa-paw"></i>
                        </div>
                        <div class="no-result-title">抱歉，没有找到符合条件的故事</div>
                        <div class="no-result-text">
                            小猫咪很抱歉没有找到您想要的内容。请尝试使用不同的关键词或选择其他分类。
                        </div>
                    </div>`;
            }
        }
    } catch (error) {
        console.error('加载故事列表出错:', error);
        // 加载异常也标记为没有更多数据
        currentState.hasMoreData = false;

        if (!append) {
            // 显示加载错误提示
            elements.storyGrid.innerHTML = `
                <div class="no-result">
                    <div class="no-result-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="no-result-title">加载出错了</div>
                    <div class="no-result-text">
                        获取故事内容时遇到了一些问题，请稍后再试。
                    </div>
                </div>`;
        }
    } finally {
        // 标记为加载完成
        currentState.isLoading = false;
        // 隐藏加载遮罩
        hideLoading(append, scrollPos);
    }
}

// 加载故事详情
async function loadStoryDetail(story) {
    // 解析JSON字符串为对象
    // const story = JSON.parse(storyJson);

    // 显示加载遮罩
    showLoading();

    try {
        let content = story.content;
        if (content != null || content != '') {
            // 更新故事详情页面
            elements.storyTitle.textContent = story.title;
            elements.storyType.textContent = story.category_name;
            // elements.storyLength.textContent = story.length;

            // 逐段渲染内容，增加动画效果
            const paragraphs = story.content.split('\n').filter(p => p.trim() !== '');
            elements.storyContent.innerHTML = '';

            // 显示故事详情页面
            showArticle();

            // 延迟动态加载段落，创建阅读效果
            paragraphs.forEach((paragraph, index) => {
                setTimeout(() => {
                    const p = document.createElement('p');
                    p.textContent = paragraph;
                    p.style.opacity = '0';
                    p.style.transform = 'translateY(10px)';
                    elements.storyContent.appendChild(p);

                    // 短暂延迟后显示段落
                    setTimeout(() => {
                        p.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        p.style.opacity = '1';
                        p.style.transform = 'translateY(0)';
                    }, 50);
                }, 100 * Math.min(index, 5)); // 最多延迟5段，防止过长的故事有太长的加载时间
            });
        } else {
            console.error('加载故事详情失败: 内容为空');
        }
    } catch (error) {
        console.error('加载故事详情出错:', error);
    } finally {
        // 隐藏加载遮罩
        hideLoading();
    }
}

// 处理分类变更
function handleCategoryChange(categoryId, isRefresh = false) {
    // 如果点击当前已激活的分类且不是刷新操作，不做任何操作
    if (categoryId === currentState.activeCategoryId && !isRefresh) {
        return;
    }

    // 更新UI
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.remove('active');
        if (parseInt(tag.dataset.id) === categoryId) {
            tag.classList.add('active');
        }
    });

    // 更新状态
    currentState.activeCategoryId = categoryId;
    currentState.currentPage = 1;
    currentState.hasMoreData = true; // 重置分页状态
    currentState.stories = []; // 清空当前故事列表

    // 添加淡出动画
    const cards = elements.storyGrid.querySelectorAll('.content-card');
    cards.forEach((card, index) => {
        card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
    });

    // 等待动画完成后清空内容并加载新故事
    setTimeout(() => {
        // 清空现有内容
        elements.storyGrid.innerHTML = '';

        // 重新加载故事
        loadStories();
    }, 150);
}

// 显示首页
function showHome(fromArticle = false, categoryId = null) {
    // 添加转场动画
    elements.articleView.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    elements.articleView.style.opacity = '0';
    elements.articleView.style.transform = 'translateY(20px)';

    setTimeout(() => {
        elements.homeView.style.display = 'block';
        elements.articleView.style.display = 'none';

        // 首页淡入动画
        elements.homeView.style.opacity = '0';
        elements.homeView.style.transform = 'translateY(20px)';

        setTimeout(() => {
            elements.homeView.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            elements.homeView.style.opacity = '1';
            elements.homeView.style.transform = 'translateY(0)';

            // 如果是从文章页面返回并且有指定分类ID，切换到该分类
            if (fromArticle && categoryId !== null) {
                handleCategoryChange(categoryId);
            }
        }, 50);
    }, 500);
}

// 显示故事详情页
function showArticle() {
    // 添加转场动画
    elements.homeView.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    elements.homeView.style.opacity = '0';
    elements.homeView.style.transform = 'translateY(-20px)';

    setTimeout(() => {
        elements.homeView.style.display = 'none';
        elements.articleView.style.display = 'block';

        // 详情页淡入动画
        elements.articleView.style.opacity = '0';
        elements.articleView.style.transform = 'translateY(20px)';

        setTimeout(() => {
            elements.articleView.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            elements.articleView.style.opacity = '1';
            elements.articleView.style.transform = 'translateY(0)';

            // 平滑滚动到顶部
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }, 50);
    }, 500);
}

// 主题切换功能
function toggleTheme() {
    const body = document.body;
    const isDarkMode = body.classList.contains('dark-theme');

    if (isDarkMode) {
        body.classList.remove('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>切换主题</span>';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>切换主题</span>';
        localStorage.setItem('theme', 'dark');
    }
}

// 检查保存的主题
function checkSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>切换主题</span>';
    }
}

// 搜索相关功能
function toggleSearchBox() {
    const searchBox = document.getElementById('floatingSearch');
    const searchInput = document.getElementById('searchInput');
    if(currentState.searchKeyword){
        searchInput.value = currentState.searchKeyword;
    }
    if (!searchBox.classList.contains('active')) {
        searchBox.classList.add('active');
        document.body.classList.add('modal-open');
        // 延迟聚焦以等待过渡动画完成
        setTimeout(() => {
            searchInput.focus();
        }, 300);
    }
}

function closeSearchBox() {
    const searchBox = document.getElementById('floatingSearch');
    const searchInput = document.getElementById('searchInput');

    searchBox.classList.remove('active');
    document.body.classList.remove('modal-open');
    searchInput.value = '';
}

function handleSearchKeydown(event) {
    if (event.key === 'Enter' && !event.isComposing) {
        const searchInput = document.getElementById('searchInput');
        const keyword = searchInput.value.trim();
        performSearch(keyword);
    } else if (event.key === 'Escape') {
        closeSearchBox();
    }
}

// 执行搜索
function performSearch(keyword) {
    // 如果搜索关键词没变，不重新搜索
    // if (keyword === currentState.searchKeyword) {
    //     closeSearchBox();
    //     return;
    // }

    currentState.searchKeyword = keyword;
    currentState.currentPage = 1;
    currentState.hasMoreData = true;
    currentState.stories = [];

    closeSearchBox();
    showLoading();

    // 添加淡出动画
    const cards = elements.storyGrid.querySelectorAll('.content-card');
    cards.forEach(card => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
    });

    // 等待动画完成后清空内容并加载新故事
    setTimeout(() => {
        elements.storyGrid.innerHTML = '';
        loadStories();
    }, 300);
}

// 初始化搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClose = document.getElementById('searchClose');

    // 监听按键
    searchInput.addEventListener('keydown', handleSearchKeydown);

    // 关闭按钮
    searchClose.addEventListener('click', closeSearchBox);
}

// 在文档加载完成后初始化
document.addEventListener('DOMContentLoaded', initSearch);

// 打开分类设置弹窗
function openCategorySettingsModal() {
    populateCategorySettings();
    elements.categorySettingsModal.classList.add('active');

    // 禁止背景滚动
    document.body.classList.add('modal-open');

    // 记录当前滚动位置
    window.modalScrollY = window.scrollY;
}

// 关闭分类设置弹窗
function closeCategorySettingsModal() {
    elements.categorySettingsModal.classList.remove('active');

    // 恢复背景滚动
    document.body.classList.remove('modal-open');

    // 恢复滚动位置
    setTimeout(() => {
        window.scrollTo(0, window.modalScrollY || 0);
    }, 10);
}

// 填充分类设置内容
function populateCategorySettings() {
    // 创建分类设置的视图容器
    let selectedHTML = '';
    let unselectedHTML = '';
    const selectedCount = currentState.selectedCategoryIds.length;

    // 分类已选择和未选择的分类
    const selectedCategories = currentState.categories.filter(cat => currentState.selectedCategoryIds.includes(cat.id));
    const unselectedCategories = currentState.categories.filter(cat => !currentState.selectedCategoryIds.includes(cat.id));

    // 为已选择的分类创建UI项
    selectedCategories.forEach(category => {
        selectedHTML += `
            <div class="category-item selected" data-id="${category.id}">
                <div class="category-icon"><i class="fas fa-check-circle"></i></div>
                <div class="category-name">${category.name}</div>
                <button class="category-action-btn remove-btn" onclick="handleCategoryToggle(${category.id}, false)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });

    // 为未选择的分类创建UI项
    unselectedCategories.forEach(category => {
        // 如果已经选择了最大数量，则禁用该项
        const isDisabled = selectedCount >= MAX_NAV_CATEGORIES;

        unselectedHTML += `
            <div class="category-item ${isDisabled ? 'disabled' : ''}" data-id="${category.id}">
                <div class="category-icon"><i class="far fa-circle"></i></div>
                <div class="category-name">${category.name}</div>
                <button class="category-action-btn add-btn" onclick="handleCategoryToggle(${category.id}, true)" ${isDisabled ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    });

    // 创建完整的设置UI
    let html = `
        <div class="category-sections">
            <div class="category-section">
                <div class="section-header">
                    <h4><i class="fas fa-check-square"></i> 已选择的分类 (${selectedCategories.length}/${MAX_NAV_CATEGORIES})</h4>
                    <span class="section-subtitle">这些分类将显示在导航栏中</span>
                </div>
                <div class="category-items selected-items">
                    ${selectedHTML || '<div class="empty-message">没有选择任何分类，请从下方添加</div>'}
                </div>
            </div>
            
            <div class="category-divider"></div>
            
            <div class="category-section">
                <div class="section-header">
                    <h4><i class="fas fa-list"></i> 可用分类 (${unselectedCategories.length})</h4>
                    <span class="section-subtitle">点击添加按钮将分类添加到导航栏</span>
                </div>
                <div class="category-items unselected-items">
                    ${unselectedHTML || '<div class="empty-message">没有更多可选择的分类</div>'}
                </div>
            </div>
        </div>
        
        <div class="category-limit-info ${selectedCount >= MAX_NAV_CATEGORIES ? 'warning' : ''}">
            <i class="${selectedCount >= MAX_NAV_CATEGORIES ? 'fas fa-exclamation-circle' : 'fas fa-info-circle'}"></i> 
            <span>导航栏最多可显示 ${MAX_NAV_CATEGORIES} 个分类 (当前已选择 ${selectedCount} 个)</span>
        </div>
    `;

    elements.categorySettingsList.innerHTML = html;

    // 更新警告显示
    updateCategoryLimitWarning();
}

// 处理分类切换
window.handleCategoryToggle = function(categoryId, isAdd) {
    if (isAdd) {
        // 检查是否已达到最大限制
        if (currentState.selectedCategoryIds.length >= MAX_NAV_CATEGORIES) {
            // 显示最大限制警告
            const limitInfo = document.querySelector('.category-limit-info');
            if (limitInfo) {
                limitInfo.classList.add('shake-animation');
                setTimeout(() => {
                    limitInfo.classList.remove('shake-animation');
                }, 820);
            }
            return;
        }

        // 添加到选中列表
        if (!currentState.selectedCategoryIds.includes(categoryId)) {
            currentState.selectedCategoryIds.push(categoryId);
        }
    } else {
        // 检查是否只剩下最后一个分类
        if (currentState.selectedCategoryIds.length <= 1) {
            // 显示至少需要一个分类的警告
            showToast('至少需要选择一个分类', 'warning');

            // 高亮显示当前元素提示不能移除
            const categoryItem = document.querySelector(`.category-item[data-id="${categoryId}"]`);
            if (categoryItem) {
                categoryItem.classList.add('shake-animation');
                setTimeout(() => {
                    categoryItem.classList.remove('shake-animation');
                }, 820);
            }
            return;
        }

        // 从选中列表移除
        currentState.selectedCategoryIds = currentState.selectedCategoryIds.filter(id => id !== categoryId);
    }

    // 立即保存用户设置
    saveUserCategorySettings();

    // 重新渲染设置项
    populateCategorySettings();

    // 重新渲染导航栏分类
    renderCategories();

    // 如果当前激活的分类不在选中列表中，切换到第一个选中的分类
    if (!currentState.selectedCategoryIds.includes(currentState.activeCategoryId) && currentState.selectedCategoryIds.length > 0) {
        handleCategoryChange(currentState.selectedCategoryIds[0], true);
    }

    // 显示提示信息
    showToast('分类设置已更新', 'info');
}

// 更新分类限制警告
function updateCategoryLimitWarning() {
    const warningElement = document.getElementById('categoryLimitWarning');
    if (!warningElement) return;

    const selectedCount = currentState.selectedCategoryIds.length;

    if (selectedCount >= MAX_NAV_CATEGORIES) {
        warningElement.classList.add('active');
    } else {
        warningElement.classList.remove('active');
    }
}

// 显示轻提示 (Toast)
function showToast(message, type = 'success') {
    // 检查是否已存在toast元素，如果存在则移除
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建新的toast元素
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;

    // 设置图标
    let icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'info') icon = 'info-circle';
    if (type === 'warning') icon = 'exclamation-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 自动消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// 保存用户分类设置到本地存储
function saveUserCategorySettings() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentState.selectedCategoryIds));
}

// 从本地存储加载用户分类设置
function loadUserCategorySettings() {
    try {
        const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedSettings) {
            currentState.selectedCategoryIds = JSON.parse(savedSettings);
            // 验证保存的分类ID是否存在于当前分类列表中
            currentState.selectedCategoryIds = currentState.selectedCategoryIds.filter(
                id => currentState.categories.some(cat => cat.id === id)
            );
        } else {
            // 如果没有保存的设置，使用默认值（前10个分类）
            currentState.selectedCategoryIds = currentState.categories.slice(0, MAX_NAV_CATEGORIES).map(cat => cat.id);
        }
    } catch (error) {
        console.error('加载用户分类设置出错:', error);
        // 出错时使用默认值
        currentState.selectedCategoryIds = currentState.categories.slice(0, MAX_NAV_CATEGORIES).map(cat => cat.id);
    }
}

// 视图模式切换
function toggleViewMode() {
    currentState.isSimpleMode = !currentState.isSimpleMode;

    if (currentState.isSimpleMode) {
        document.body.classList.add('simple-mode');
        elements.viewModeToggle.innerHTML = '<i class="fas fa-th"></i><span>切换视图</span>';
        elements.viewModeToggle.title = "切换到图片模式";
    } else {
        document.body.classList.remove('simple-mode');
        elements.viewModeToggle.innerHTML = '<i class="fas fa-list"></i><span>切换视图</span>';
        elements.viewModeToggle.title = "切换到简约模式";
    }

    // 保存当前模式到本地存储
    localStorage.setItem(VIEW_MODE_KEY, currentState.isSimpleMode ? 'simple' : 'grid');

    // 重新渲染故事列表，以应用新的视图模式
    if (currentState.stories.length > 0) {
        renderStories(false, true);
    }
}

// 检查并应用存储的视图模式
function checkSavedViewMode() {
    const savedViewMode = localStorage.getItem(VIEW_MODE_KEY);
    // 如果用户之前设置过具体的视图模式，使用已保存的设置
    // 如果没有保存的设置，默认使用简约模式
    if (savedViewMode === 'grid') {
        currentState.isSimpleMode = false;
        document.body.classList.remove('simple-mode');
        elements.viewModeToggle.innerHTML = '<i class="fas fa-list"></i><span>切换视图</span>';
        elements.viewModeToggle.title = "切换到简约模式";
    } else {
        // 默认使用简约模式 (savedViewMode === 'simple' 或者 null/undefined)
        currentState.isSimpleMode = true;
        document.body.classList.add('simple-mode');
        elements.viewModeToggle.innerHTML = '<i class="fas fa-th"></i><span>切换视图</span>';
        elements.viewModeToggle.title = "切换到图片模式";
    }
}

//随机数0-10
function getRandomInt() {
    return Math.floor(Math.random() * 7);
}

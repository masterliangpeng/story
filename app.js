// 常量定义
const APP_ID = 'nnfnnjshrt2pzvdl';
const APP_SECRET = 'iq7Wx2HaVBaKiKzOErLeXvWA97iAsMGo';
const API_BASE_URL = 'https://www.mxnzp.com/api/story';

// 当前状态
let currentState = {
    activeCategoryId: null, // 初始为null，加载后设为第一个分类的ID
    currentPage: 1,
    stories: [],
    categories: [],
    searchKeyword: '',
    isLoading: false,   // 是否正在加载数据
    hasMoreData: true   // 是否还有更多数据
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
    storyLength: document.getElementById('storyLength'),
    storyContent: document.getElementById('storyContent'),
    homeView: document.querySelector('.home-view'),
    articleView: document.querySelector('.article-view'),
    searchBar: document.querySelector('.search-bar'),
    logo: document.querySelector('.logo'),
    themeToggle: document.getElementById('themeToggle'),
    refreshButton: document.getElementById('refreshButton'),
    searchButton: document.getElementById('searchButton'),
    floatingSearch: document.getElementById('floatingSearch'),
    searchClose: document.getElementById('searchClose'),
    searchClear: document.getElementById('searchClear'),
    searchSubmit: document.getElementById('searchSubmit')
};

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
    
    // 刷新按钮
    elements.refreshButton.addEventListener('click', refreshHome);
    
    // 搜索按钮和关闭按钮
    elements.searchButton.addEventListener('click', toggleSearchBox);
    elements.searchClose.addEventListener('click', closeSearchBox);
    
    // 新增的清除和提交按钮 - 改为通过浮动搜索框找到按钮
    elements.floatingSearch.querySelector('#searchClear').addEventListener('click', clearSearchInput);
    elements.floatingSearch.querySelector('#searchSubmit').addEventListener('click', submitSearch);
    
    // 点击遮罩关闭搜索框
    elements.floatingSearch.addEventListener('click', (e) => {
        if (e.target === elements.floatingSearch) {
            closeSearchBox();
        }
    });
    
    // ESC键关闭搜索框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSearchBox();
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
    floatingSearchInput.addEventListener('input', () => {
        const floatingSearchClear = elements.floatingSearch.querySelector('#searchClear');
        if (floatingSearchInput.value.trim() === '') {
            floatingSearchClear.style.visibility = 'hidden';
            floatingSearchClear.style.opacity = '0';
        } else {
            floatingSearchClear.style.visibility = 'visible';
            floatingSearchClear.style.opacity = '0.7';
        }
    });
    
    // 检查并应用存储的主题
    checkSavedTheme();
});

// 显示欢迎动画
function showWelcomeAnimation() {
    // 添加初始欢迎遮罩
    const welcomeOverlay = document.createElement('div');
    welcomeOverlay.className = 'welcome-overlay';
    welcomeOverlay.innerHTML = `
        <div class="welcome-content">
            <div class="welcome-icon">
                <i class="fas fa-book"></i>
            </div>
            <h1 class="welcome-title">故事小平台</h1>
            <p class="welcome-text">欢迎来到您的个人故事世界</p>
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
    
    setTimeout(() => {
        // 显示加载中状态并重新加载第一个分类
        if (currentState.categories.length > 0) {
            handleCategoryChange(currentState.categories[0].type_id, true);
            
            // 选中第一个分类标签
            document.querySelectorAll('.filter-tag').forEach(tag => {
                tag.classList.remove('active');
                if (parseInt(tag.dataset.id) === currentState.categories[0].type_id) {
                    tag.classList.add('active');
                }
            });
        }
        
        // 淡入动画
        setTimeout(() => {
            elements.storyGrid.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            elements.storyGrid.style.opacity = '1';
            elements.storyGrid.style.transform = 'translateY(0)';
        }, 300);
    }, 300);
}

// 显示加载遮罩
function showLoading() {
    elements.loadingOverlay.classList.add('active');
}

// 隐藏加载遮罩
function hideLoading() {
    // 添加淡出动画效果
    elements.loadingOverlay.classList.add('fade-out');
    
    setTimeout(() => {
        elements.loadingOverlay.classList.remove('active');
        elements.loadingOverlay.classList.remove('fade-out');
    }, 400);
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
        console.log('内容不足以产生滚动条，加载更多数据...');
        // 递归加载更多内容，直到出现滚动条或没有更多数据
        loadMoreStories(() => checkIfScrollNeeded());
    }
}

// 加载更多故事
function loadMoreStories(callback) {
    // 设置加载中状态，防止重复触发
    currentState.isLoading = true;
    
    // 显示加载遮罩，与搜索加载保持一致
    showLoading();
    
    // 增加页码
    currentState.currentPage++;
    
    // 添加淡出动画，与搜索加载一致
    const existingCards = elements.storyGrid.querySelectorAll('.content-card');
    existingCards.forEach((card, index) => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0.7';
        card.style.transform = 'translateY(-5px)';
    });
    
    // 延迟加载以展示加载动画
    setTimeout(() => {
        loadStories(true).then(() => {
            // 恢复现有卡片的原样式
            existingCards.forEach((card, index) => {
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
            
            // 如果有回调函数，调用它
            if (typeof callback === 'function') {
                setTimeout(callback, 300);
            }
        });
    }, 400);
}

// 加载分类
async function loadCategories() {
    // 显示加载遮罩
    showLoading();
    
    try {
        const url = `${API_BASE_URL}/types?app_id=${APP_ID}&app_secret=${APP_SECRET}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 1 && data.data.length > 0) {
            currentState.categories = data.data;
            
            // 设置默认激活的分类为第一个分类
            currentState.activeCategoryId = data.data[0].type_id;
            
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

// 渲染分类标签
function renderCategories() {
    let html = '';
    
    // 添加API返回的分类，并默认选中第一个
    currentState.categories.forEach((category, index) => {
        const isActive = category.type_id === currentState.activeCategoryId;
        html += `<div class="filter-tag ${isActive ? 'active' : ''}" data-id="${category.type_id}">${category.name}</div>`;
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
        });
    });
}

// 渲染故事列表
function renderStories(append = false) {
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
        html += `
            <div class="content-card" onclick="loadStoryDetail(${story.storyId})">
                <div class="card-category">${story.type}</div>
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
                        <div class="account-name">${story.type}</div>
                        <div class="card-stats">
                            <span><i class="far fa-clock"></i> ${story.readTime}</span>
                            <span><i class="far fa-file-alt"></i> ${story.length}字</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50 * (i - startIndex));
        }
    } else {
        elements.storyGrid.innerHTML = html;
        
        // 卡片淡入动画
        const cards = elements.storyGrid.querySelectorAll('.content-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50 * index);
        });
    }
}

// 显示卡片加载骨架屏
function showCardSkeletons() {
    const cardCount = window.innerWidth > 768 ? 6 : 4;
    let skeletonHtml = '';
    
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
    
    elements.storyGrid.innerHTML = skeletonHtml;
}

// 加载故事列表
async function loadStories(append = false) {
    // 如果正在加载且不是被loadMoreStories调用（append=true），不重复请求
    if (currentState.isLoading && !append) {
        return;
    }
    
    // 如果不是被loadMoreStories调用（第一次加载或分类/搜索变更），则设置加载中状态
    if (!append) {
        currentState.isLoading = true;
        // 显示加载遮罩
        showLoading();
        // 显示骨架屏
        showCardSkeletons();
    }
    
    try {
        // 添加延迟模拟网络请求
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let url = `${API_BASE_URL}/list?page=${currentState.currentPage}&keyword=${currentState.searchKeyword}&app_id=${APP_ID}&app_secret=${APP_SECRET}`;
        
        // 添加分类参数
        if (currentState.activeCategoryId) {
            url += `&type_id=${currentState.activeCategoryId}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 1) {
            const newStories = data.data;
            
            // 判断是否还有更多数据
            currentState.hasMoreData = newStories.length > 0;
            
            // 根据append参数决定是追加还是替换数据
            if (append) {
                currentState.stories = [...currentState.stories, ...newStories];
            } else {
                currentState.stories = newStories;
            }
            
            // 渲染故事列表
            renderStories(append);
            
            // 首次加载或分类切换后，检查是否需要加载更多内容以产生滚动条
            if (!append) {
                // 延迟执行检查，确保DOM已经完全渲染
                setTimeout(() => {
                    checkIfScrollNeeded();
                }, 300);
            }
        } else {
            console.error('加载故事列表失败:', data.msg);
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
        hideLoading();
    }
}

// 加载故事详情
async function loadStoryDetail(storyId) {
    // 显示加载遮罩
    showLoading();
    
    try {
        const url = `${API_BASE_URL}/details?story_id=${storyId}&app_id=${APP_ID}&app_secret=${APP_SECRET}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 1) {
            const story = data.data;
            
            // 更新故事详情页面
            elements.storyTitle.textContent = story.title;
            elements.storyType.textContent = story.type;
            elements.storyReadTime.textContent = `预计阅读时间：${story.readTime}`;
            elements.storyLength.textContent = story.length;
            
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
            console.error('加载故事详情失败:', data.msg);
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
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
    });
    
    // 等待动画完成后清空内容并加载新故事
    setTimeout(() => {
        // 清空现有内容
        elements.storyGrid.innerHTML = '';
        
        // 重新加载故事
        loadStories();
    }, 300);
}

// 监听搜索输入变化，控制清除按钮显示
function toggleClearButton() {
    if (elements.searchInput.value.trim() === '') {
        elements.searchClear.style.visibility = 'hidden';
        elements.searchClear.style.opacity = '0';
    } else {
        elements.searchClear.style.visibility = 'visible';
        elements.searchClear.style.opacity = '0.7';
    }
}

// 清除搜索输入
function clearSearchInput() {
    const floatingSearchInput = elements.floatingSearch.querySelector('#searchInput');
    const floatingSearchClear = elements.floatingSearch.querySelector('#searchClear');
    
    if (floatingSearchInput) {
        floatingSearchInput.value = '';
        floatingSearchInput.focus();
        
        // 隐藏清除按钮
        if (floatingSearchClear) {
            floatingSearchClear.style.visibility = 'hidden';
            floatingSearchClear.style.opacity = '0';
        }
    }
}

// 处理搜索表单提交
function submitSearch() {
    const floatingSearchInput = elements.floatingSearch.querySelector('#searchInput');
    if (floatingSearchInput) {
        const keyword = floatingSearchInput.value.trim();
        performSearch(keyword);
    }
}

// 处理搜索按键事件
function handleSearchKeydown(event) {
    // 只有当按下Enter键时才触发搜索
    if (event.key === 'Enter') {
        const keyword = event.target.value.trim();
        performSearch(keyword);
    }
}

// 执行搜索
function performSearch(keyword) {
    // 如果搜索关键词没变，不重新搜索
    if (keyword === currentState.searchKeyword) {
        return;
    }
    
    // 添加搜索反馈动画
    const floatingSearchBar = elements.floatingSearch.querySelector('.search-bar');
    if (floatingSearchBar) {
        floatingSearchBar.classList.add('search-active');
        setTimeout(() => {
            floatingSearchBar.classList.remove('search-active');
        }, 400);
    }
    
    currentState.searchKeyword = keyword;
    currentState.currentPage = 1;
    currentState.hasMoreData = true; // 重置分页状态
    currentState.stories = []; // 清空当前故事列表
    
    // 关闭搜索框
    closeSearchBox();
    
    // 显示加载中状态
    showLoading();
    
    // 添加淡出动画
    const cards = elements.storyGrid.querySelectorAll('.content-card');
    cards.forEach((card, index) => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
    });
    
    // 等待动画完成后清空内容并加载新故事
    setTimeout(() => {
        // 清空现有内容
        elements.storyGrid.innerHTML = '';
        
        // 重新加载故事
        loadStories();
    }, 300);
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
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    }
}

// 检查保存的主题
function checkSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// 显示搜索框
function toggleSearchBox() {
    elements.floatingSearch.classList.add('active');
    
    // 直接获取浮动搜索框中的搜索栏元素，而不是使用外部的 elements.searchBar
    const floatingSearchBar = elements.floatingSearch.querySelector('.search-bar');
    const floatingSearchInput = elements.floatingSearch.querySelector('#searchInput');
    const floatingSearchClear = elements.floatingSearch.querySelector('#searchClear');
    
    // 添加焦点效果类到浮动搜索框中的搜索栏
    if (floatingSearchBar) {
        floatingSearchBar.classList.add('search-focus');
    }
    
    // 清除按钮状态
    if (floatingSearchInput && floatingSearchClear) {
        if (floatingSearchInput.value.trim() === '') {
            floatingSearchClear.style.visibility = 'hidden';
            floatingSearchClear.style.opacity = '0';
        } else {
            floatingSearchClear.style.visibility = 'visible';
            floatingSearchClear.style.opacity = '0.7';
        }
    }
    
    // 短暂延迟后设置焦点，等待动画完成
    setTimeout(() => {
        if (floatingSearchInput) {
            floatingSearchInput.focus();
        }
    }, 300);
}

// 关闭搜索框
function closeSearchBox() {
    elements.floatingSearch.classList.remove('active');
    
    // 直接获取浮动搜索框中的搜索栏元素
    const floatingSearchBar = elements.floatingSearch.querySelector('.search-bar');
    
    // 移除焦点效果类
    if (floatingSearchBar) {
        floatingSearchBar.classList.remove('search-focus');
    }
} 
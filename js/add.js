// 字符计数功能
const titleInput = document.getElementById('storyTitle');
const contentTextarea = document.getElementById('storyContent');
const titleCount = document.getElementById('titleCount');
const contentCount = document.getElementById('contentCount');

titleInput.addEventListener('input', function() {
    titleCount.textContent = this.value.length;
});

contentTextarea.addEventListener('input', function() {
    contentCount.textContent = this.value.length;
});

// 表单提交处理
document.getElementById('storyForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = {
        category: document.getElementById('storyCategory'),
        categoryId: this.category.value,
        categoryText: this.category.options[this.category.selectedIndex].text,
        title: document.getElementById('storyTitle').value,
        content: document.getElementById('storyContent').value
    };
    // 验证表单
    if (!formData.category || !formData.title || !formData.content) {
        alert('请填写所有必填项！');
        return;
    }

    if (formData.title.length < 2) {
        alert('故事标题至少需要2个字符！');
        return;
    }

    if (formData.content.length < 500) {
        alert('故事内容至少需要500个字符！');
        return;
    }

    const excerpt = formData.content.slice(0,80) + "...";

    const data = {
        category_id: formData.categoryId,
        title: formData.title,
        excerpt: excerpt,
        category_name: formData.categoryText,
        length: formData.content.length
    };

    insert('story_main', data, formData.content).then(res =>{
        const contentData = {
            story_id: res,
            content: formData.content
        };
        insert('story_content',contentData);
    });

    alert('故事保存成功！感谢您的分享。');

    resetForm();
    // 可以选择重置表单或跳转到其他页面
    // if (confirm('是否继续添加新故事？')) {
    //     resetForm();
    // } else {
    //     window.location.href = 'index.html';
    // }
});

async function insert(tableName,newData) {
    const {data, error} = await window.supabaseClient.insertData(tableName, newData);
    if (error) {
        console.error('新增数据错误:', error);
        return null;
    }

    return data[0].id;
}
// 重置表单
function resetForm() {
    document.getElementById('storyForm').reset();
    titleCount.textContent = '0';
    contentCount.textContent = '0';
}

// 主题切换支持（如果主页面有主题切换功能）
function applyTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// 页面加载时应用主题
document.addEventListener('DOMContentLoaded', applyTheme);

// 监听主题变化
window.addEventListener('storage', function(e) {
    if (e.key === 'theme') {
        applyTheme();
    }
});

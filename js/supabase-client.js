// 初始化Supabase客户端
const supabaseUrl = 'https://cxtvmolpayeplvdxcjvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dHZtb2xwYXllcGx2ZHhjanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NTE0NTgsImV4cCI6MjA2MTEyNzQ1OH0.LIBg-OUlZHE6jtct1hRBFn1uOw6upqyDOCK-qBqaXic';


// 从全局supabase对象中解构出createClient方法
let supabaseClient;
try {
  // 检查supabase是否已定义
  if (typeof supabase !== 'undefined') {
    const { createClient } = supabase;
    console.log('supabase全局对象已找到, createClient:', createClient);

    if (typeof createClient === 'function') {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase客户端初始化完成');
    } else {
      console.error('createClient不是一个函数');
    }
  } else {
    console.error('supabase全局对象未找到，确保正确引入CDN');
  }
} catch (error) {
  console.error('初始化Supabase客户端时出错:', error);
}

// 基本查询函数
async function fetchData(tableName, options = {}) {
  try {
    //构建查询
    let query = supabaseClient
      .from(tableName)
      .select(options.columns || '*');

    // 添加过滤条件
    if (options.filter) {
      for (const [column, value] of Object.entries(options.filter)) {
        query = query.eq(column, value);
      }
    }

     // 添加过滤条件
     if (options.filterLike) {
      for (const [column, value] of Object.entries(options.filterLike)) {
        query = query.like(column, '%' + value + '%');
      }
    }

    // 添加排序
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending
      });
    }

    // 添加分页
    if (options.pagination) {
      const { page, pageSize } = options.pagination;
      query = query
        .range((page - 1) * pageSize, page * pageSize - 1);
    }

    // 执行查询
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { data:data, error: error };
  } catch (error) {
    console.error('Supabase查询错误:', error);
    return { data: null, error };
  }
}

// 插入数据
async function insertData(tableName, data) {
  try {
    const { data: insertedData, error } = await supabaseClient
      .from(tableName)
      .insert(data)
      .select();

    if (error) {
      throw error;
    }

    return { data: insertedData, error: null };
  } catch (error) {
    console.error('Supabase插入错误:', error);
    return { data: null, error };
  }
}

// 更新数据
async function updateData(tableName, id, data) {
  try {
    const { data: updatedData, error } = await supabaseClient
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { data: updatedData, error: null };
  } catch (error) {
    console.error('Supabase更新错误:', error);
    return { data: null, error };
  }
}

// 删除数据
async function deleteData(tableName, id) {
  try {
    const { error } = await supabaseClient
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Supabase删除错误:', error);
    return { error };
  }
}

// 导出函数
window.supabaseClient = {
  fetchData
};

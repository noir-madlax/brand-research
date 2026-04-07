/**
 * 认证管理模块
 * 处理登录状态检查、token 管理等
 */

const Auth = {
  // Token 过期时间（24 小时）
  TOKEN_EXPIRY_MS: 24 * 60 * 60 * 1000,

  /**
   * 检查用户是否已登录
   */
  isLoggedIn() {
    const token = localStorage.getItem('authToken');
    const loginTime = localStorage.getItem('loginTime');

    if (!token || !loginTime) {
      return false;
    }

    // 检查 token 是否过期
    const loginTimeMs = new Date(loginTime).getTime();
    const nowMs = new Date().getTime();
    
    if (nowMs - loginTimeMs > this.TOKEN_EXPIRY_MS) {
      this.logout();
      return false;
    }

    return true;
  },

  /**
   * 获取当前登录用户信息
   */
  getCurrentUser() {
    if (!this.isLoggedIn()) {
      return null;
    }

    const token = localStorage.getItem('authToken');
    try {
      const decoded = atob(token);
      const [username] = decoded.split(':');
      return { username };
    } catch (e) {
      this.logout();
      return null;
    }
  },

  /**
   * 登出
   */
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('loginTime');
  },

  /**
   * 保存重定向 URL（用于登录后返回）
   */
  setShouldRedirectUrl(url) {
    sessionStorage.setItem('redirectUrl', url);
  },

  /**
   * 获取重定向 URL
   */
  getShouldRedirectUrl() {
    return sessionStorage.getItem('redirectUrl');
  },

  /**
   * 清除重定向 URL
   */
  clearRedirectUrl() {
    sessionStorage.removeItem('redirectUrl');
  }
};

/**
 * 检查登录状态的中间件函数
 * 如果未登录，重定向到登录页
 * 
 * 使用方式：
 * <script src="auth.js"></script>
 * <script>
 *   Auth.requireLogin(); // 在详情页加载时调用
 * </script>
 */
function requireLogin() {
  if (!Auth.isLoggedIn()) {
    // 保存当前页面 URL，登录后返回
    Auth.setShouldRedirectUrl(window.location.pathname + window.location.search);
    window.location.href = 'login.html';
  }
}

/**
 * 在页面加载时自动检查登录状态
 */
document.addEventListener('DOMContentLoaded', () => {
  // 对于需要登录的页面（ford.html, byd.html, toyota.html），自动检查登录状态
  const detailPages = ['ford.html', 'byd.html', 'toyota.html'];
  const currentPageName = window.location.pathname.split('/').pop() || 'index.html';
  
  if (detailPages.some(page => currentPageName.includes(page))) {
    requireLogin();
  }
});

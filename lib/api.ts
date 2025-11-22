/**
 * API 客户端工具
 * 基于后端 OpenAPI 规范实现
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

// ==================== 类型定义 ====================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  avatar_url?: string | null;
  trust_level: number;
  is_active: boolean;
  is_silenced: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface OAuthInitiateResponse {
  authorization_url: string;
  state: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  detail: string | Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}

// ==================== 工具函数 ====================

/**
 * 处理 API 响应
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`
    }));
    
    const errorMessage = typeof error.detail === 'string' 
      ? error.detail 
      : error.detail.map(e => e.msg).join(', ');
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * 获取认证 header
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

// ==================== 认证相关 API ====================

/**
 * 检查用户名（邮箱）是否存在
 * GET /api/auth/check-username - 检查用户名是否存在
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/check-username?username=${encodeURIComponent(email)}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.exists || false;
  } catch (error) {
    console.error('Check username error:', error);
    return false;
  }
}

/**
 * 发送邮箱登录链接
 * TODO: 等待后端提供此接口
 */
export async function sendEmailLogin(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/email-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  return handleResponse<{ success: boolean; message: string }>(response);
}

/**
 * 用户名密码登录
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  const data = await handleResponse<LoginResponse>(response);
  
  // 保存 token 到 localStorage
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

/**
 * 发起 SSO 登录
 * 注意: 返回的 authorization_url 会重定向到 OAuth 提供商,
 * OAuth 提供商会回调到后端配置的 redirect_uri
 */
export async function initiateSSOLogin(): Promise<OAuthInitiateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/sso/initiate`, {
    method: 'GET',
  });
  
  return handleResponse<OAuthInitiateResponse>(response);
}

/**
 * OAuth 回调处理
 */
export async function handleOAuthCallback(code: string, state: string): Promise<LoginResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/sso/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    {
      method: 'GET',
    }
  );
  
  const data = await handleResponse<LoginResponse>(response);
  
  // 保存 token 到 localStorage
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

/**
 * 登出
 */
export async function logout(): Promise<LogoutResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  const data = await handleResponse<LogoutResponse>(response);
  
  // 清除本地存储
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  
  return data;
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  return handleResponse<UserResponse>(response);
}

// ==================== 本地存储工具 ====================

/**
 * 检查用户是否已登录
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

/**
 * 获取本地存储的用户信息
 */
export function getStoredUser(): UserResponse | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * 获取本地存储的 token
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// ==================== 健康检查 ====================

/**
 * 健康检查
 */
export async function healthCheck(): Promise<Record<string, any>> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
  });
  
  return handleResponse<Record<string, any>>(response);
}

// ==================== 账号管理相关 API ====================

export interface Account {
  cookie_id: string;
  name?: string;
  email?: string;
  status: number; // 0=禁用, 1=启用
  is_shared: number; // 0=专属, 1=共享
  created_at: string;
  updated_at: string;
  last_used_at?: string | null;
  quotas?: any;
}

/**
 * 获取账号列表
 */
export async function getAccounts(): Promise<Account[]> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/accounts`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<{ success: boolean; data: Account[] }>(response);
  return result.data;
}

/**
 * 获取账号详情
 */
export async function getAccount(cookieId: string): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/accounts/${cookieId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<{ success: boolean; data: Account }>(response);
  return result.data;
}

/**
 * 删除账号
 */
export async function deleteAccount(cookieId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/accounts/${cookieId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<{ success: boolean; data: any }>(response);
  return result.data;
}

/**
 * 更新账号状态
 */
export async function updateAccountStatus(cookieId: string, status: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/accounts/${cookieId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  
  const result = await handleResponse<{ success: boolean; data: any }>(response);
  return result.data;
}

/**
 * 获取 OAuth 授权 URL
 */
export async function getOAuthAuthorizeUrl(isShared: number = 0): Promise<{ auth_url: string; state: string; expires_in: number }> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/oauth/authorize`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_shared: isShared }),
  });
  
  const result = await handleResponse<{ success: boolean; data: { auth_url: string; state: string; expires_in: number } }>(response);
  return result.data;
}

// ==================== API Key 管理 ====================

export interface PluginAPIKey {
  id: number;
  user_id: number;
  key_preview: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export interface CreateAPIKeyResponse {
  id: number;
  user_id: number;
  key: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

/**
 * 获取 API Key 列表
 */
export async function getAPIKeys(): Promise<PluginAPIKey[]> {
  const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  return handleResponse<PluginAPIKey[]>(response);
}

/**
 * 获取 API Key 信息(兼容旧代码)
 */
export async function getAPIKeyInfo(): Promise<PluginAPIKey | null> {
  const keys = await getAPIKeys();
  // 返回第一个激活的 API Key，如果没有则返回 null
  return keys.find(key => key.is_active) || keys[0] || null;
}

/**
 * 生成新的 API Key
 */
export async function generateAPIKey(name: string = 'My API Key'): Promise<CreateAPIKeyResponse> {
  const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  
  return handleResponse<CreateAPIKeyResponse>(response);
}

/**
 * 删除指定的 API Key
 */
export async function deleteAPIKey(keyId: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/api-keys/${keyId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  return handleResponse<any>(response);
}

/**
 * 提交 OAuth 回调
 */
export async function submitOAuthCallback(callbackUrl: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/oauth/callback`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ callback_url: callbackUrl }),
  });
  
  const result = await handleResponse<{ success: boolean; data: any }>(response);
  return result.data;
}

/**
 * 获取账号配额
 */
export async function getAccountQuotas(cookieId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/accounts/${cookieId}/quotas`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<{ success: boolean; data: any }>(response);
  return result.data;
}

/**
 * 更新模型配额状态
 */
export async function updateQuotaStatus(cookieId: string, modelName: string, status: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/accounts/${cookieId}/quotas/${modelName}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  
  const result = await handleResponse<{ success: boolean; data: any }>(response);
  return result.data;
}

/**
 * 更新 Cookie 优先级
 */
export async function updateCookiePreference(preferShared: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/preference`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ prefer_shared: preferShared }),
  });
  
  const result = await handleResponse<{ success: boolean; data: any }>(response);
  return result.data;
}

/**
 * 获取 Cookie 优先级设置
 */
export async function getCookiePreference(): Promise<{ prefer_shared: number }> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/preference`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<{ success: boolean; data: { prefer_shared: number } }>(response);
  return result.data;
}

// ==================== 配额管理相关 API ====================

export interface UserQuotaItem {
  pool_id: string;
  user_id: string;
  model_name: string;
  quota: string;
  max_quota: string;
  last_recovered_at: string;
  last_updated_at: string;
}

export interface QuotaConsumption {
  log_id: string;
  user_id: string;
  cookie_id: string;
  model_name: string;
  quota_before: string;
  quota_after: string;
  quota_consumed: string;
  is_shared: number;
  consumed_at: string;
}

export interface SharedPoolModelQuota {
  model_name: string;
  total_quota: string;
  earliest_reset_time: string | null;
  available_cookies: string;
  status: number;
  last_fetched_at: string;
}

export interface SharedPoolModelStats {
  total_quota: number;
  available_cookies: number;
  earliest_reset_time: string | null;
  status: number;
}

export interface SharedPoolStats {
  accounts: {
    total_shared: number;
    active_shared: number;
    inactive_shared: number;
  };
  quotas_by_model: Record<string, SharedPoolModelStats>;
  note?: string;
}

/**
 * 获取用户配额池
 */
export async function getUserQuotas(): Promise<UserQuotaItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/quotas/user`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<{ success: boolean; data: UserQuotaItem[] }>(response);
  return result.data;
}

/**
 * 获取配额消耗记录
 */
export async function getQuotaConsumption(params?: {
  limit?: number;
  start_date?: string;
  end_date?: string;
}): Promise<QuotaConsumption[]> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  
  const url = `${API_BASE_URL}/api/plugin-api/quotas/consumption${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<{ success: boolean; data: QuotaConsumption[] }>(response);
  return result.data;
}

/**
 * 获取共享池配额信息
 */
export async function getSharedPoolQuotas(): Promise<SharedPoolModelQuota[]> {
  const response = await fetch(`${API_BASE_URL}/api/plugin-api/quotas/shared-pool`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<{ success: boolean; data: SharedPoolModelQuota[] }>(response);
  return result.data;
}

/**
 * 获取共享池统计信息
 */
export async function getSharedPoolStats(): Promise<SharedPoolStats> {
  const response = await fetch(`${API_BASE_URL}/api/usage/shared-pool/stats`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<{ success: boolean; data: SharedPoolStats }>(response);
  return result.data;
}

// ==================== 聊天相关 API ====================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

/**
 * 发送聊天请求（流式）
 * 使用用户的 access_token 进行认证
 */
export async function sendChatCompletionStream(
  request: ChatCompletionRequest,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<void> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`
      }));
      const errorMessage = typeof error.detail === 'string'
        ? error.detail
        : Array.isArray(error.detail)
        ? error.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
        : JSON.stringify(error.detail);
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
        
        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6);
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.error('解析 SSE 数据失败:', e);
          }
        }
      }
    }
  } catch (error) {
    onError(error as Error);
  }
}
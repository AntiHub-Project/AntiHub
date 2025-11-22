import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否访问 dashboard 路由
  if (pathname.startsWith('/dashboard')) {
    // 从 cookie 中获取 access_token
    const token = request.cookies.get('access_token')?.value;

    // 如果没有 token，重定向到登录页
    if (!token) {
      const url = new URL('/auth', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// 配置需要应用中间件的路径
export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
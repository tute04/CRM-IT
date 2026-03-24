import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Public routes — no auth required
    const publicRoutes = ['/', '/login', '/registro', '/api/pagos/webhook'];
    const isPublicRoute = publicRoutes.some(route =>
        route === '/' ? pathname === '/' : pathname.startsWith(route)
    );

    // If not logged in and trying to access protected route → redirect to login
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If logged in and on login/registro → redirect to panel
    if (user && (pathname === '/login' || pathname === '/registro')) {
        const url = request.nextUrl.clone();
        url.pathname = '/panel';
        return NextResponse.redirect(url);
    }

    // If logged in, check plan status for protected routes
    const isAdmin = user?.email === 'matebonavia@gmail.com';
    const isExemptFromBlock = pathname === '/suscripcion-vencida' || pathname === '/suscripcion' || pathname.startsWith('/api/pagos') || isAdmin;
    if (user && !isPublicRoute && !isExemptFromBlock) {
        const { data: negocio } = await supabase
            .from('negocios')
            .select('plan, trial_ends_at')
            .eq('owner_id', user.id)
            .single();

        if (negocio) {
            const isTrialExpired = negocio.plan === 'trial' && new Date(negocio.trial_ends_at) < new Date();

            if (negocio.plan === 'bloqueado' || isTrialExpired) {
                if (isTrialExpired && negocio.plan === 'trial') {
                    await supabase
                        .from('negocios')
                        .update({ plan: 'bloqueado' })
                        .eq('owner_id', user.id);
                }

                const url = request.nextUrl.clone();
                url.pathname = '/suscripcion-vencida';
                return NextResponse.redirect(url);
            }
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

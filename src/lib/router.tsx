import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface RouterContextValue {
  pathname: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue>({
  pathname: '/',
  navigate: () => {},
});

const RAW_BASE = import.meta.env.BASE_URL || '/';
const BASE_PREFIX = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE;

function normalizePath(path: string): string {
  if (!path) return '/';
  const [clean] = path.split(/[?#]/);
  let stripped = clean || '/';
  if (BASE_PREFIX && stripped.startsWith(BASE_PREFIX)) {
    stripped = stripped.slice(BASE_PREFIX.length) || '/';
  }
  if (stripped.length > 1 && stripped.endsWith('/')) {
    return stripped.slice(0, -1);
  }
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

function buildFullHref(to: string): string {
  if (!BASE_PREFIX) return to;
  if (to === '/') return `${BASE_PREFIX}/`;
  return `${BASE_PREFIX}${to.startsWith('/') ? to : `/${to}`}`;
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<string>(() =>
    normalizePath(window.location.pathname)
  );

  useEffect(() => {
    const onPopState = () => {
      setPathname(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    const fullTarget = buildFullHref(to);
    const targetUrl = new URL(fullTarget, window.location.origin);
    const nextPath = normalizePath(targetUrl.pathname);
    const hash = targetUrl.hash;

    if (
      nextPath !== normalizePath(window.location.pathname) ||
      hash !== window.location.hash
    ) {
      window.history.pushState({}, '', fullTarget);
      setPathname(nextPath);
    }

    if (hash) {
      requestAnimationFrame(() => {
        const el = document.getElementById(hash.slice(1));
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function usePathname(): string {
  return useContext(RouterContext).pathname;
}

export function useNavigate() {
  return useContext(RouterContext).navigate;
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
}

export function Link({ to, onClick, children, ...props }: LinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      props.target === '_blank'
    ) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={buildFullHref(to)} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

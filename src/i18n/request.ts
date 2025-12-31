import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { locales, defaultLocale, type Locale } from './config';

export default getRequestConfig(async () => {
  // Get locale from URL path (set by middleware)
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Extract locale from pathname
  let locale: Locale = defaultLocale;
  for (const l of locales) {
    if (pathname.startsWith(`/${l}/`) || pathname === `/${l}`) {
      locale = l;
      break;
    }
  }
  
  // Fallback to cookie if not in path
  if (locale === defaultLocale && !pathname.startsWith('/en')) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('locale')?.value;
    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
      locale = cookieLocale as Locale;
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});


import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type MetaType = 'website' | 'article';

type PageMetaOptions = {
  title: string;
  description: string;
  canonicalPath?: string;
  type?: MetaType;
  image?: string;
  noIndex?: boolean;
};

const DEFAULT_OG_IMAGE = '/og-cover.svg';

function upsertNamedMeta(name: string, content: string) {
  const selector = `meta[name="${name}"]`;
  const node = document.head.querySelector<HTMLMetaElement>(selector) ?? document.createElement('meta');
  node.setAttribute('name', name);
  node.setAttribute('content', content);
  if (!node.parentElement) document.head.appendChild(node);
}

function upsertPropertyMeta(property: string, content: string) {
  const selector = `meta[property="${property}"]`;
  const node = document.head.querySelector<HTMLMetaElement>(selector) ?? document.createElement('meta');
  node.setAttribute('property', property);
  node.setAttribute('content', content);
  if (!node.parentElement) document.head.appendChild(node);
}

function upsertCanonical(href: string) {
  const node = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.createElement('link');
  node.setAttribute('rel', 'canonical');
  node.setAttribute('href', href);
  if (!node.parentElement) document.head.appendChild(node);
}

function toAbsoluteUrl(input: string) {
  return new URL(input, window.location.origin).toString();
}

export function usePageMeta({
  title,
  description,
  canonicalPath,
  type = 'website',
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: PageMetaOptions) {
  const location = useLocation();

  useEffect(() => {
    const canonical = toAbsoluteUrl(canonicalPath ?? location.pathname);
    const imageUrl = toAbsoluteUrl(image);
    const locale = document.documentElement.lang === 'vi' ? 'vi_VN' : 'en_US';

    document.title = title;
    upsertNamedMeta('description', description);
    upsertNamedMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    upsertCanonical(canonical);

    upsertPropertyMeta('og:title', title);
    upsertPropertyMeta('og:description', description);
    upsertPropertyMeta('og:type', type);
    upsertPropertyMeta('og:url', canonical);
    upsertPropertyMeta('og:image', imageUrl);
    upsertPropertyMeta('og:locale', locale);
    upsertPropertyMeta('og:site_name', 'Thịnh Hưng Dental');

    upsertNamedMeta('twitter:card', 'summary_large_image');
    upsertNamedMeta('twitter:title', title);
    upsertNamedMeta('twitter:description', description);
    upsertNamedMeta('twitter:image', imageUrl);
  }, [canonicalPath, description, image, location.pathname, noIndex, title, type]);
}

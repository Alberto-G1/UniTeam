import { useEffect } from 'react';

const ensureMetaTag = (attr, value) => {
  const selector = `meta[${attr}="${value}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, value);
    document.head.appendChild(element);
  }
  return element;
};

const SeoMeta = ({
  title,
  description,
  path = '/',
  image = '/favicon.ico',
  type = 'website',
}) => {
  useEffect(() => {
    const siteName = 'UniTeam';
    const safeTitle = title ? `${title} | ${siteName}` : siteName;
    const safeDescription = description || 'UniTeam public portal for university collaboration.';

    document.title = safeTitle;

    const baseUrl = window.location.origin;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const canonicalUrl = `${baseUrl}${normalizedPath}`;
    const imageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;

    const descriptionMeta = ensureMetaTag('name', 'description');
    descriptionMeta.setAttribute('content', safeDescription);

    const ogTitle = ensureMetaTag('property', 'og:title');
    ogTitle.setAttribute('content', safeTitle);

    const ogDescription = ensureMetaTag('property', 'og:description');
    ogDescription.setAttribute('content', safeDescription);

    const ogType = ensureMetaTag('property', 'og:type');
    ogType.setAttribute('content', type);

    const ogUrl = ensureMetaTag('property', 'og:url');
    ogUrl.setAttribute('content', canonicalUrl);

    const ogImage = ensureMetaTag('property', 'og:image');
    ogImage.setAttribute('content', imageUrl);

    const ogSiteName = ensureMetaTag('property', 'og:site_name');
    ogSiteName.setAttribute('content', siteName);

    const twitterCard = ensureMetaTag('name', 'twitter:card');
    twitterCard.setAttribute('content', 'summary_large_image');

    const twitterTitle = ensureMetaTag('name', 'twitter:title');
    twitterTitle.setAttribute('content', safeTitle);

    const twitterDescription = ensureMetaTag('name', 'twitter:description');
    twitterDescription.setAttribute('content', safeDescription);

    const twitterImage = ensureMetaTag('name', 'twitter:image');
    twitterImage.setAttribute('content', imageUrl);
  }, [description, image, path, title, type]);

  return null;
};

export default SeoMeta;

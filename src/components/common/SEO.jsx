/**
 * SEO Component - Optimización SEO Dinámica
 *
 * Componente reutilizable para optimizar SEO en diferentes páginas
 */

import { useEffect } from 'react';

const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  published,
  modified,
  section,
  tags
}) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description);
    }

    // Update keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (keywords) {
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords);
      } else {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        metaKeywords.content = keywords;
        document.head.appendChild(metaKeywords);
      }
    }

    // Update Open Graph tags
    const updateMetaProperty = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (content) {
        if (meta) {
          meta.setAttribute('content', content);
        } else {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      }
    };

    updateMetaProperty('og:title', title);
    updateMetaProperty('og:description', description);
    updateMetaProperty('og:image', image || 'https://nexupay.cl/og-image.jpg');
    updateMetaProperty('og:url', url || window.location.href);
    updateMetaProperty('og:type', type);

    // Update Twitter Card tags
    const updateMetaName = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (content) {
        if (meta) {
          meta.setAttribute('content', content);
        } else {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      }
    };

    updateMetaName('twitter:title', title);
    updateMetaName('twitter:description', description);
    updateMetaName('twitter:image', image || 'https://nexupay.cl/twitter-card.jpg');

    // Update article-specific meta tags
    if (type === 'article') {
      updateMetaProperty('article:author', author);
      updateMetaProperty('article:published_time', published);
      updateMetaProperty('article:modified_time', modified);
      updateMetaProperty('article:section', section);

      if (tags && Array.isArray(tags)) {
        tags.forEach(tag => {
          updateMetaProperty('article:tag', tag);
        });
      }
    }

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (url) {
      if (canonical) {
        canonical.setAttribute('href', url);
      } else {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        canonical.setAttribute('href', url);
        document.head.appendChild(canonical);
      }
    }

  }, [title, description, keywords, image, url, type, author, published, modified, section, tags]);

  return null; // This component doesn't render anything
};

export default SEO;
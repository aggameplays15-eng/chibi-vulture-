import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useApp } from '@/context/AppContext';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
}

const SEO = ({ title, description, image, url, type = 'website' }: SEOProps) => {
  const { appName, appDescription, headerLogoUrl } = useApp();
  
  const siteName = appName || 'Chibi Vulture';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Art Community`;
  const metaDescription = description || appDescription || 'Premium Art Community. Partagez votre art, découvrez des artistes, achetez des produits uniques.';
  const metaImage = image || `${window.location.origin}/logo.svg`;
  const metaUrl = url || window.location.href;

  const structuredData = type === 'article' ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": fullTitle,
    "image": [metaImage],
    "description": metaDescription,
    "url": metaUrl,
  } : type === 'profile' ? {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": fullTitle,
    "description": metaDescription,
    "image": metaImage,
  } : {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": window.location.origin,
    "description": metaDescription,
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={metaUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;

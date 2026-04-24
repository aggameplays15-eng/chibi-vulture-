// Tests pour les bibliothèques Vercel
// Ces tests vérifient que les bibliothèques sont correctement importées

import { describe, it, expect } from 'vitest';

describe('Vercel Libraries', () => {
  describe('@vercel/analytics', () => {
    it('should import Analytics component', () => {
      const { Analytics } = require('@vercel/analytics/react');
      expect(Analytics).toBeDefined();
    });
  });

  describe('@vercel/speed-insights', () => {
    it('should import SpeedInsights component', () => {
      const { SpeedInsights } = require('@vercel/speed-insights/react');
      expect(SpeedInsights).toBeDefined();
    });
  });

  describe('@vercel/og', () => {
    it('should import ImageResponse', () => {
      const { ImageResponse } = require('@vercel/og');
      expect(ImageResponse).toBeDefined();
    });
  });

  describe('@vercel/edge-config', () => {
    it('should import get function', () => {
      const { get } = require('@vercel/edge-config');
      expect(get).toBeDefined();
      expect(typeof get).toBe('function');
    });
  });

  describe('@vercel/blob', () => {
    it('should import blob functions', () => {
      const { put, del, list } = require('@vercel/blob');
      expect(put).toBeDefined();
      expect(del).toBeDefined();
      expect(list).toBeDefined();
      expect(typeof put).toBe('function');
      expect(typeof del).toBe('function');
      expect(typeof list).toBe('function');
    });
  });
});

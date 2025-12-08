'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  X, Accessibility, Type, Contrast, ZoomIn, ZoomOut, RotateCcw,
  Eye, EyeOff, Moon, Sun, Palette, AlignLeft, AlignCenter, AlignRight,
  Link2, Heading, MousePointer, Image, Minus, Plus, Pause, Volume2
} from 'lucide-react';

interface AccessibilityWidgetProps {
  enabled?: boolean;
}

interface AccessibilitySettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  highContrast: boolean;
  invertColors: boolean;
  grayscale: boolean;
  darkContrast: boolean;
  lightContrast: boolean;
  saturate: boolean;
  readableFont: boolean;
  highlightLinks: boolean;
  highlightHeadings: boolean;
  bigCursor: boolean;
  hideImages: boolean;
  textAlign: 'left' | 'center' | 'right' | 'default';
  readingGuide: boolean;
  readingMask: boolean;
  stopAnimations: boolean;
  muteSounds: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  lineHeight: 100,
  letterSpacing: 0,
  wordSpacing: 0,
  highContrast: false,
  invertColors: false,
  grayscale: false,
  darkContrast: false,
  lightContrast: false,
  saturate: false,
  readableFont: false,
  highlightLinks: false,
  highlightHeadings: false,
  bigCursor: false,
  hideImages: false,
  textAlign: 'default',
  readingGuide: false,
  readingMask: false,
  stopAnimations: false,
  muteSounds: false,
};

export function AccessibilityWidget({ enabled = true }: AccessibilityWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [guidePosition, setGuidePosition] = useState(0);
  const [activeTab, setActiveTab] = useState<'content' | 'color' | 'navigation'>('content');

  useEffect(() => {
    setMounted(true);

    // Load settings from localStorage
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
        applySettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse accessibility settings:', e);
      }
    }
  }, []);

  // Apply settings to document
  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font size
    root.style.fontSize = `${newSettings.fontSize}%`;

    // Line height
    if (newSettings.lineHeight !== 100) {
      root.style.setProperty('--a11y-line-height', `${newSettings.lineHeight}%`);
    } else {
      root.style.removeProperty('--a11y-line-height');
    }

    // Letter spacing
    if (newSettings.letterSpacing !== 0) {
      root.style.setProperty('--a11y-letter-spacing', `${newSettings.letterSpacing}px`);
    } else {
      root.style.removeProperty('--a11y-letter-spacing');
    }

    // Word spacing
    if (newSettings.wordSpacing !== 0) {
      root.style.setProperty('--a11y-word-spacing', `${newSettings.wordSpacing}px`);
    } else {
      root.style.removeProperty('--a11y-word-spacing');
    }

    // Classes
    root.classList.toggle('a11y-high-contrast', newSettings.highContrast);
    root.classList.toggle('a11y-invert', newSettings.invertColors);
    root.classList.toggle('a11y-grayscale', newSettings.grayscale);
    root.classList.toggle('a11y-dark-contrast', newSettings.darkContrast);
    root.classList.toggle('a11y-light-contrast', newSettings.lightContrast);
    root.classList.toggle('a11y-saturate', newSettings.saturate);
    root.classList.toggle('a11y-readable-font', newSettings.readableFont);
    root.classList.toggle('a11y-highlight-links', newSettings.highlightLinks);
    root.classList.toggle('a11y-highlight-headings', newSettings.highlightHeadings);
    root.classList.toggle('a11y-big-cursor', newSettings.bigCursor);
    root.classList.toggle('a11y-hide-images', newSettings.hideImages);
    root.classList.toggle('a11y-reading-guide', newSettings.readingGuide);
    root.classList.toggle('a11y-reading-mask', newSettings.readingMask);
    root.classList.toggle('a11y-stop-animations', newSettings.stopAnimations);

    // Text align
    if (newSettings.textAlign !== 'default') {
      root.style.setProperty('--a11y-text-align', newSettings.textAlign);
    } else {
      root.style.removeProperty('--a11y-text-align');
    }

    // Mute sounds
    if (newSettings.muteSounds) {
      document.querySelectorAll('audio, video').forEach((el) => {
        (el as HTMLMediaElement).muted = true;
      });
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    applySettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');
  };

  // Reading guide mouse tracking
  useEffect(() => {
    if (!settings.readingGuide) return;

    const handleMouseMove = (e: MouseEvent) => {
      setGuidePosition(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.readingGuide]);

  // Don't render if not enabled or not mounted
  if (!enabled || !mounted) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-4 left-4 z-50">
        {!isOpen ? (
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
            aria-label="Open accessibility options"
            title="Accessibility Options"
          >
            <Accessibility className="h-6 w-6" />
          </Button>
        ) : (
          <Card className="shadow-xl w-80 max-h-[85vh] overflow-hidden flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Accessibility className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Accessibility</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                  aria-label="Close accessibility options"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 border-b">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'content'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Content
                </button>
                <button
                  onClick={() => setActiveTab('color')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'color'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Color
                </button>
                <button
                  onClick={() => setActiveTab('navigation')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'navigation'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Navigation
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {activeTab === 'content' && (
                  <>
                    {/* Font Size */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <Type className="h-4 w-4" />
                        Text Size
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSetting('fontSize', Math.max(settings.fontSize - 10, 80))}
                          disabled={settings.fontSize <= 80}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                          {settings.fontSize}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSetting('fontSize', Math.min(settings.fontSize + 10, 200))}
                          disabled={settings.fontSize >= 200}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Line Height */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Line Height
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSetting('lineHeight', Math.max(settings.lineHeight - 10, 100))}
                          disabled={settings.lineHeight <= 100}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                          {settings.lineHeight}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSetting('lineHeight', Math.min(settings.lineHeight + 10, 200))}
                          disabled={settings.lineHeight >= 200}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Letter Spacing */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Letter Spacing
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSetting('letterSpacing', Math.max(settings.letterSpacing - 1, 0))}
                          disabled={settings.letterSpacing <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                          {settings.letterSpacing}px
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSetting('letterSpacing', Math.min(settings.letterSpacing + 1, 10))}
                          disabled={settings.letterSpacing >= 10}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Word Spacing */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Word Spacing
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSetting('wordSpacing', Math.max(settings.wordSpacing - 2, 0))}
                          disabled={settings.wordSpacing <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                          {settings.wordSpacing}px
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateSetting('wordSpacing', Math.min(settings.wordSpacing + 2, 20))}
                          disabled={settings.wordSpacing >= 20}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Text Align */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Text Alignment
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={settings.textAlign === 'left' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateSetting('textAlign', 'left')}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={settings.textAlign === 'center' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateSetting('textAlign', 'center')}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={settings.textAlign === 'right' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateSetting('textAlign', 'right')}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Readable Font */}
                    <ToggleOption
                      icon={<Type className="h-4 w-4" />}
                      label="Dyslexia-Friendly Font"
                      value={settings.readableFont}
                      onChange={(value) => updateSetting('readableFont', value)}
                    />

                    {/* Stop Animations */}
                    <ToggleOption
                      icon={<Pause className="h-4 w-4" />}
                      label="Stop Animations"
                      value={settings.stopAnimations}
                      onChange={(value) => updateSetting('stopAnimations', value)}
                    />

                    {/* Mute Sounds */}
                    <ToggleOption
                      icon={<Volume2 className="h-4 w-4" />}
                      label="Mute Sounds"
                      value={settings.muteSounds}
                      onChange={(value) => updateSetting('muteSounds', value)}
                    />
                  </>
                )}

                {activeTab === 'color' && (
                  <>
                    {/* High Contrast */}
                    <ToggleOption
                      icon={<Contrast className="h-4 w-4" />}
                      label="High Contrast"
                      value={settings.highContrast}
                      onChange={(value) => updateSetting('highContrast', value)}
                    />

                    {/* Dark Contrast */}
                    <ToggleOption
                      icon={<Moon className="h-4 w-4" />}
                      label="Dark Contrast"
                      value={settings.darkContrast}
                      onChange={(value) => updateSetting('darkContrast', value)}
                    />

                    {/* Light Contrast */}
                    <ToggleOption
                      icon={<Sun className="h-4 w-4" />}
                      label="Light Contrast"
                      value={settings.lightContrast}
                      onChange={(value) => updateSetting('lightContrast', value)}
                    />

                    {/* Invert Colors */}
                    <ToggleOption
                      icon={<Palette className="h-4 w-4" />}
                      label="Invert Colors"
                      value={settings.invertColors}
                      onChange={(value) => updateSetting('invertColors', value)}
                    />

                    {/* Grayscale */}
                    <ToggleOption
                      icon={<Palette className="h-4 w-4" />}
                      label="Grayscale"
                      value={settings.grayscale}
                      onChange={(value) => updateSetting('grayscale', value)}
                    />

                    {/* Saturate */}
                    <ToggleOption
                      icon={<Palette className="h-4 w-4" />}
                      label="High Saturation"
                      value={settings.saturate}
                      onChange={(value) => updateSetting('saturate', value)}
                    />
                  </>
                )}

                {activeTab === 'navigation' && (
                  <>
                    {/* Highlight Links */}
                    <ToggleOption
                      icon={<Link2 className="h-4 w-4" />}
                      label="Highlight Links"
                      value={settings.highlightLinks}
                      onChange={(value) => updateSetting('highlightLinks', value)}
                    />

                    {/* Highlight Headings */}
                    <ToggleOption
                      icon={<Heading className="h-4 w-4" />}
                      label="Highlight Headings"
                      value={settings.highlightHeadings}
                      onChange={(value) => updateSetting('highlightHeadings', value)}
                    />

                    {/* Big Cursor */}
                    <ToggleOption
                      icon={<MousePointer className="h-4 w-4" />}
                      label="Big Cursor"
                      value={settings.bigCursor}
                      onChange={(value) => updateSetting('bigCursor', value)}
                    />

                    {/* Reading Guide */}
                    <ToggleOption
                      icon={<Minus className="h-4 w-4" />}
                      label="Reading Guide"
                      value={settings.readingGuide}
                      onChange={(value) => updateSetting('readingGuide', value)}
                    />

                    {/* Reading Mask */}
                    <ToggleOption
                      icon={<Eye className="h-4 w-4" />}
                      label="Reading Mask"
                      value={settings.readingMask}
                      onChange={(value) => updateSetting('readingMask', value)}
                    />

                    {/* Hide Images */}
                    <ToggleOption
                      icon={<Image className="h-4 w-4" />}
                      label="Hide Images"
                      value={settings.hideImages}
                      onChange={(value) => updateSetting('hideImages', value)}
                    />
                  </>
                )}
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reading Guide Line */}
      {settings.readingGuide && (
        <div
          className="fixed left-0 right-0 pointer-events-none z-40"
          style={{
            top: guidePosition,
            height: '3px',
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
          }}
        />
      )}

      {/* Reading Mask */}
      {settings.readingMask && (
        <>
          <div
            className="fixed left-0 right-0 top-0 pointer-events-none z-40 bg-black/60"
            style={{ height: Math.max(0, guidePosition - 50) }}
          />
          <div
            className="fixed left-0 right-0 bottom-0 pointer-events-none z-40 bg-black/60"
            style={{ top: guidePosition + 50 }}
          />
        </>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        /* Line height */
        .a11y-line-height * {
          line-height: var(--a11y-line-height) !important;
        }

        /* Letter spacing */
        .a11y-letter-spacing * {
          letter-spacing: var(--a11y-letter-spacing) !important;
        }

        /* Word spacing */
        .a11y-word-spacing * {
          word-spacing: var(--a11y-word-spacing) !important;
        }

        /* Text align */
        [style*="--a11y-text-align"] p,
        [style*="--a11y-text-align"] div,
        [style*="--a11y-text-align"] span {
          text-align: var(--a11y-text-align) !important;
        }

        /* High Contrast */
        .a11y-high-contrast {
          filter: contrast(120%) !important;
        }
        .a11y-high-contrast * {
          font-weight: 500 !important;
        }

        /* Dark Contrast */
        .a11y-dark-contrast {
          filter: brightness(0.8) contrast(150%) !important;
          background: #1a1a1a !important;
          color: #ffffff !important;
        }
        .a11y-dark-contrast * {
          color: #ffffff !important;
        }

        /* Light Contrast */
        .a11y-light-contrast {
          filter: brightness(1.3) contrast(120%) !important;
          background: #ffffff !important;
        }

        /* Invert Colors */
        .a11y-invert {
          filter: invert(1) hue-rotate(180deg) !important;
        }

        /* Grayscale */
        .a11y-grayscale {
          filter: grayscale(100%) !important;
        }

        /* Saturate */
        .a11y-saturate {
          filter: saturate(200%) !important;
        }

        /* Readable Font */
        .a11y-readable-font * {
          font-family: 'Comic Sans MS', 'OpenDyslexic', Arial, sans-serif !important;
        }

        /* Highlight Links */
        .a11y-highlight-links a {
          background: #ffff00 !important;
          color: #000000 !important;
          text-decoration: underline !important;
          padding: 2px 4px !important;
          border-radius: 2px !important;
        }

        /* Highlight Headings */
        .a11y-highlight-headings h1,
        .a11y-highlight-headings h2,
        .a11y-highlight-headings h3,
        .a11y-highlight-headings h4,
        .a11y-highlight-headings h5,
        .a11y-highlight-headings h6 {
          background: #e0f2fe !important;
          padding: 4px 8px !important;
          border-left: 4px solid #0ea5e9 !important;
          margin: 8px 0 !important;
        }

        /* Big Cursor */
        .a11y-big-cursor,
        .a11y-big-cursor * {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M4 4 L4 28 L12 20 L16 28 L20 26 L16 18 L28 18 Z" fill="black" stroke="white" stroke-width="2"/></svg>') 0 0, auto !important;
        }

        /* Hide Images */
        .a11y-hide-images img,
        .a11y-hide-images svg,
        .a11y-hide-images [style*="background-image"] {
          opacity: 0 !important;
          visibility: hidden !important;
        }

        /* Stop Animations */
        .a11y-stop-animations *,
        .a11y-stop-animations *::before,
        .a11y-stop-animations *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }

        /* Ensure widget stays functional */
        .a11y-hide-images [aria-label*="accessibility"] img,
        .a11y-hide-images [aria-label*="Accessibility"] img {
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>
    </>
  );
}

// Helper component for toggle options
function ToggleOption({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
        {icon}
        {label}
      </label>
      <Button
        variant={value ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange(!value)}
        className="w-full"
      >
        {value ? 'On' : 'Off'}
      </Button>
    </div>
  );
}

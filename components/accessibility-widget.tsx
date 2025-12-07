'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Accessibility, Type, Contrast, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface AccessibilityWidgetProps {
  enabled?: boolean;
}

export function AccessibilityWidget({ enabled = true }: AccessibilityWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load settings from localStorage
    const savedFontSize = localStorage.getItem('accessibility-font-size');
    const savedContrast = localStorage.getItem('accessibility-high-contrast');

    if (savedFontSize) {
      const size = parseInt(savedFontSize);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}%`;
    }

    if (savedContrast === 'true') {
      setHighContrast(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  // Don't render if not enabled or not mounted (prevents SSR issues)
  if (!enabled || !mounted) {
    return null;
  }

  const handleFontSizeIncrease = () => {
    const newSize = Math.min(fontSize + 10, 150);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
    localStorage.setItem('accessibility-font-size', newSize.toString());
  };

  const handleFontSizeDecrease = () => {
    const newSize = Math.max(fontSize - 10, 80);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
    localStorage.setItem('accessibility-font-size', newSize.toString());
  };

  const handleToggleContrast = () => {
    const newContrast = !highContrast;
    setHighContrast(newContrast);

    if (newContrast) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('accessibility-high-contrast', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('accessibility-high-contrast', 'false');
    }
  };

  const handleReset = () => {
    setFontSize(100);
    setHighContrast(false);
    document.documentElement.style.fontSize = '100%';
    document.documentElement.classList.remove('high-contrast');
    localStorage.removeItem('accessibility-font-size');
    localStorage.removeItem('accessibility-high-contrast');
  };

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
          <Card className="shadow-xl w-72">
            <CardContent className="p-4">
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

              <div className="space-y-4">
                {/* Font Size */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Type className="h-4 w-4" />
                    Text Size
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFontSizeDecrease}
                      disabled={fontSize <= 80}
                      className="flex-1"
                    >
                      <ZoomOut className="h-4 w-4 mr-1" />
                      Smaller
                    </Button>
                    <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                      {fontSize}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFontSizeIncrease}
                      disabled={fontSize >= 150}
                      className="flex-1"
                    >
                      <ZoomIn className="h-4 w-4 mr-1" />
                      Larger
                    </Button>
                  </div>
                </div>

                {/* High Contrast */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Contrast className="h-4 w-4" />
                    Display Mode
                  </label>
                  <Button
                    variant={highContrast ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleToggleContrast}
                    className="w-full"
                  >
                    {highContrast ? 'High Contrast: On' : 'High Contrast: Off'}
                  </Button>
                </div>

                {/* Reset */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* High Contrast Styles */}
      {highContrast && (
        <style jsx global>{`
          .high-contrast {
            filter: contrast(120%);
          }
          .high-contrast * {
            font-weight: 500 !important;
          }
        `}</style>
      )}
    </>
  );
}

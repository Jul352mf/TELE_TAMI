"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Volume2 } from "lucide-react";

interface VoiceSpeedSliderProps {
  onSpeedChange?: (speed: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceSpeedSlider({ 
  onSpeedChange, 
  disabled = false,
  className = "" 
}: VoiceSpeedSliderProps) {
  const [speed, setSpeed] = useState([1.0]);

  // Load persisted speed from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tami-voice-speed');
      if (saved) {
        const parsedSpeed = parseFloat(saved);
        if (parsedSpeed >= 0.5 && parsedSpeed <= 2.0) {
          setSpeed([parsedSpeed]);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save speed and notify parent when changed
  useEffect(() => {
    try {
      localStorage.setItem('tami-voice-speed', speed[0].toString());
    } catch {
      // Ignore localStorage errors
    }
    
    if (onSpeedChange) {
      onSpeedChange(speed[0]);
    }
  }, [speed, onSpeedChange]);

  const handleSpeedChange = (newSpeed: number[]) => {
    setSpeed(newSpeed);
  };

  const getSpeedLabel = (speed: number) => {
    if (speed < 0.8) return "Slow";
    if (speed > 1.2) return "Fast";
    return "Normal";
  };

  return (
    <Card className={`${className} ${disabled ? 'opacity-50' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="voice-speed" className="text-sm font-medium">
            Voice Speed
          </Label>
          <span className="text-sm text-muted-foreground ml-auto">
            {getSpeedLabel(speed[0])} ({speed[0].toFixed(1)}x)
          </span>
        </div>
        
        <div className="space-y-2">
          <Slider
            id="voice-speed"
            value={speed}
            onValueChange={handleSpeedChange}
            min={0.5}
            max={2.0}
            step={0.1}
            disabled={disabled}
            className="w-full"
            aria-label="Voice speed control"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
          </div>
        </div>
        
        {disabled && (
          <p className="text-xs text-muted-foreground">
            Speed control available during call
          </p>
        )}
      </CardContent>
    </Card>
  );
}
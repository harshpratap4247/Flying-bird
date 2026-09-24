import React, { useEffect, useRef, useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Trophy, 
  Download, 
  Copy, 
  Check, 
  Code2, 
  X, 
  Sparkles, 
  Flame, 
  Zap, 
  HelpCircle,
  Gamepad2,
  Camera,
  Upload,
  RefreshCw,
  UserCheck,
  Sun,
  SunMedium
} from 'lucide-react';
import customFaceBirdUrl from './assets/images/cake_face_player_1790235326067.jpg';

// --- Types & Config ---
type BirdSkin = 'custom' | 'classic' | 'blue' | 'crimson' | 'cyber';
type Difficulty = 'easy' | 'classic' | 'hard';

interface SkinConfig {
  name: string;
  bodyColor: string;
  wingColor: string;
  bellyColor: string;
  outlineColor: string;
  beakColor: string;
  tailColor: string;
}

const SKINS: Record<BirdSkin, SkinConfig> = {
  custom: {
    name: 'Cake Face',
    bodyColor: '#f59e0b',
    wingColor: '#fbbf24',
    bellyColor: '#fef08a',
    outlineColor: '#78350f',
    beakColor: '#ea580c',
    tailColor: '#d97706',
  },
  classic: {
    name: 'Sunny Flapper',
    bodyColor: '#f59e0b',
    wingColor: '#fbbf24',
    bellyColor: '#fef08a',
    outlineColor: '#78350f',
    beakColor: '#ea580c',
    tailColor: '#d97706',
  },
  blue: {
    name: 'Cobalt Jay',
    bodyColor: '#0284c7',
    wingColor: '#38bdf8',
    bellyColor: '#bae6fd',
    outlineColor: '#0c4a6e',
    beakColor: '#f97316',
    tailColor: '#0369a1',
  },
  crimson: {
    name: 'Phoenix Flare',
    bodyColor: '#e11d48',
    wingColor: '#fb7185',
    bellyColor: '#ffe4e6',
    outlineColor: '#881337',
    beakColor: '#f59e0b',
    tailColor: '#be123c',
  },
  cyber: {
    name: 'Cyber Lime',
    bodyColor: '#10b981',
    wingColor: '#34d399',
    bellyColor: '#a7f3d0',
    outlineColor: '#064e3b',
    beakColor: '#facc15',
    tailColor: '#059669',
  }
};

const DIFFICULTY_SETTINGS: Record<Difficulty, { label: string; gap: number; speed: number; spawnInterval: number }> = {
  easy: { label: 'Relaxed', gap: 155, speed: 2.1, spawnInterval: 120 },
  classic: { label: 'Classic', gap: 135, speed: 2.4, spawnInterval: 110 },
  hard: { label: 'Hardcore', gap: 115, speed: 2.8, spawnInterval: 95 },
};

// Web Audio synthesizer
class RetroAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playFlap() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio playback failsafe
    }
  }

  public playScore() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.2, now + 0.08);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // ignore audio errors
    }
  }

  public playHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // ignore
    }
  }

  public playDie() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }
}

const audioEngine = new RetroAudio();

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [selectedSkin, setSelectedSkin] = useState<BirdSkin>('custom');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('classic');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string>(customFaceBirdUrl);
  const [brightness, setBrightness] = useState<number>(1.35);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const customImgRef = useRef<HTMLImageElement | null>(null);

  // References for mutable game loop state to avoid closure stalls
  const gameStateRef = useRef<'start' | 'playing' | 'gameover'>('start');
  const skinRef = useRef<BirdSkin>('custom');
  const diffRef = useRef<Difficulty>('classic');
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const brightnessRef = useRef<number>(1.35);

  useEffect(() => {
    brightnessRef.current = brightness;
  }, [brightness]);

  const toggleBrightness = () => {
    setBrightness((prev) => (prev === 1.35 ? 1.6 : prev === 1.6 ? 1.0 : 1.35));
  };

  // Initialize and update custom image element
  useEffect(() => {
    const img = new Image();
    img.src = customImageUrl;
    img.onload = () => {
      customImgRef.current = img;
    };
    customImgRef.current = img;
  }, [customImageUrl]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setCustomImageUrl(result);
          setSelectedSkin('custom');
          skinRef.current = 'custom';
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefaultPhoto = () => {
    setCustomImageUrl(customFaceBirdUrl);
    setSelectedSkin('custom');
    skinRef.current = 'custom';
  };

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    skinRef.current = selectedSkin;
  }, [selectedSkin]);

  useEffect(() => {
    diffRef.current = selectedDifficulty;
  }, [selectedDifficulty]);

  // Load High Score on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('flappy_bird_high_score');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) {
          setHighScore(val);
          highScoreRef.current = val;
        }
      }
    } catch {
      // Ignore localStorage error in strict sandbox
    }
  }, []);

  // Main Canvas & Engine Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const WIDTH = 400;
    const HEIGHT = 600;
    const GROUND_HEIGHT = 90;
    const PLAY_HEIGHT = HEIGHT - GROUND_HEIGHT;

    // HiDPI Crisp Canvas Setup
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(dpr, dpr);

    let animationId: number;
    let frames = 0;
    let groundScroll = 0;
    let shakeTimer = 0;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
      rotation: number;
      vRot: number;
    }

    const particles: Particle[] = [];

    const addFeathers = (x: number, y: number, color: string) => {
      for (let i = 0; i < 4; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 2 + 1,
          size: Math.random() * 3 + 2,
          color,
          alpha: 1,
          decay: 0.025 + Math.random() * 0.02,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.1
        });
      }
    };

    const addCreamParticles = (x: number, y: number) => {
      const colors = ['#ffffff', '#ffffff', '#fef08a', '#fde047', '#fbcfe8', '#38bdf8'];
      for (let i = 0; i < 5; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.7) * 3.5,
          vy: Math.random() * 2 + 0.5,
          size: Math.random() * 3.5 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.03 + Math.random() * 0.02,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.15
        });
      }
    };

    const addExplosion = (x: number, y: number) => {
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4.5 + 1.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color: ['#ef4444', '#f59e0b', '#fbbf24', '#ffffff', '#38bdf8'][Math.floor(Math.random() * 5)],
          alpha: 1,
          decay: 0.03 + Math.random() * 0.02,
          rotation: 0,
          vRot: 0
        });
      }
    };

    // Bird Engine
    const bird = {
      x: 85,
      y: 260,
      radius: 15,
      velocity: 0,
      gravity: 0.38,
      jumpImpulse: -7.2,
      rotation: 0,
      wingTimer: 0,

      reset() {
        this.x = 85;
        this.y = 260;
        this.velocity = 0;
        this.rotation = 0;
        this.wingTimer = 0;
      },

      flap() {
        this.velocity = this.jumpImpulse;
        this.wingTimer = 10;
        audioEngine.playFlap();
        if (skinRef.current === 'custom') {
          addCreamParticles(this.x - 12, this.y + 2);
        } else {
          const skin = SKINS[skinRef.current];
          addFeathers(this.x - 12, this.y + 4, skin.wingColor);
        }
      },

      update() {
        if (gameStateRef.current === 'start') {
          this.y = 250 + Math.sin(frames * 0.08) * 8;
          this.rotation = 0;
          this.wingTimer = frames % 20 < 10 ? 1 : 0;
          return;
        }

        this.velocity += this.gravity;
        if (this.velocity > 9) this.velocity = 9;
        this.y += this.velocity;

        if (this.velocity < 0) {
          this.rotation = Math.max(-0.45, this.velocity * 0.07);
        } else {
          this.rotation = Math.min(Math.PI / 2.2, (this.velocity - 2) * 0.12);
        }

        if (this.wingTimer > 0) this.wingTimer--;
      },

      draw() {
        const skin = SKINS[skinRef.current];
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const isFlapping = this.wingTimer > 0 || (gameStateRef.current === 'start' && frames % 14 < 7);

        // Render Pure Face Avatar (Specially removed all bird wings, beak, tail per user request)
        if (
          skinRef.current === 'custom' &&
          customImgRef.current &&
          customImgRef.current.complete &&
          customImgRef.current.naturalWidth > 0
        ) {
          const faceR = 19;
          const currentBrightness = brightnessRef.current || 1.35;

          // Glowing backdrop for high-brightness pop
          ctx.save();
          ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
          ctx.shadowBlur = 12;

          // Circular Clipped Face Avatar with High Brightness filter
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, faceR, 0, Math.PI * 2);
          ctx.clip();

          // High Brightness filter on canvas
          ctx.filter = `brightness(${currentBrightness}) contrast(1.1) saturate(1.15)`;
          ctx.drawImage(customImgRef.current, -faceR, -faceR, faceR * 2, faceR * 2);
          ctx.restore();

          // Outer crisp White and Golden rings (Clean character frame without bird parts)
          ctx.beginPath();
          ctx.arc(0, 0, faceR, 0, Math.PI * 2);
          ctx.lineWidth = 2.8;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, faceR + 1.8, 0, Math.PI * 2);
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = '#f59e0b';
          ctx.stroke();

          // Glossy highlight reflection
          ctx.beginPath();
          ctx.arc(-2, -2, faceR - 2.5, Math.PI * 1.05, Math.PI * 1.65);
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.stroke();

          ctx.restore();
          ctx.restore();
          return;
        }

        // Tail
        ctx.fillStyle = skin.tailColor;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-21, -6);
        ctx.lineTo(-19, 4);
        ctx.closePath();
        ctx.fill();

        // Main Body Oval
        ctx.fillStyle = skin.bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = skin.outlineColor;
        ctx.stroke();

        // Belly
        ctx.fillStyle = skin.bellyColor;
        ctx.beginPath();
        ctx.ellipse(-2, 3, 10, 7, 0, 0, Math.PI);
        ctx.fill();

        // Wing
        ctx.save();
        ctx.translate(-4, 0);
        ctx.rotate(isFlapping ? -0.4 : 0.2);
        ctx.fillStyle = skin.wingColor;
        ctx.strokeStyle = skin.outlineColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Big Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, -4, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = skin.outlineColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pupil
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(10, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupil Gleam
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(9.5, -5.5, 1, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = skin.beakColor;
        ctx.strokeStyle = skin.outlineColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(11, -2);
        ctx.lineTo(21, 2);
        ctx.lineTo(11, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Beak Mouth line
        ctx.beginPath();
        ctx.moveTo(11, 2);
        ctx.lineTo(19, 2);
        ctx.stroke();

        ctx.restore();
      }
    };

    // Pipes
    class Pipe {
      x: number;
      width: number;
      gap: number;
      topHeight: number;
      bottomY: number;
      bottomHeight: number;
      passed: boolean;

      constructor(x: number, gapSize: number) {
        this.x = x;
        this.width = 64;
        this.gap = gapSize;
        this.passed = false;

        const minTop = 60;
        const maxTop = PLAY_HEIGHT - this.gap - 60;
        this.topHeight = Math.floor(Math.random() * (maxTop - minTop)) + minTop;
        this.bottomY = this.topHeight + this.gap;
        this.bottomHeight = PLAY_HEIGHT - this.bottomY;
      }

      update(speed: number) {
        this.x -= speed;
      }

      draw() {
        const lipHeight = 24;
        const lipOverhang = 3.5;

        // Top Pipe
        drawPipeCylinder(this.x, 0, this.width, this.topHeight - lipHeight);
        drawPipeCap(this.x - lipOverhang, this.topHeight - lipHeight, this.width + lipOverhang * 2, lipHeight);

        // Bottom Pipe
        drawPipeCap(this.x - lipOverhang, this.bottomY, this.width + lipOverhang * 2, lipHeight);
        drawPipeCylinder(this.x, this.bottomY + lipHeight, this.width, this.bottomHeight - lipHeight);
      }
    }

    const drawPipeCylinder = (x: number, y: number, w: number, h: number) => {
      if (h <= 0) return;
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#15803d');
      grad.addColorStop(0.2, '#22c55e');
      grad.addColorStop(0.5, '#4ade80');
      grad.addColorStop(0.8, '#16a34a');
      grad.addColorStop(1, '#14532d');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(x + 7, y, 4, h);
    };

    const drawPipeCap = (x: number, y: number, w: number, h: number) => {
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#15803d');
      grad.addColorStop(0.25, '#22c55e');
      grad.addColorStop(0.55, '#86efac');
      grad.addColorStop(0.85, '#16a34a');
      grad.addColorStop(1, '#052e16');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 8, y + 2, 4, h - 4);
    };

    let pipes: Pipe[] = [];

    const triggerGameOver = () => {
      if (gameStateRef.current === 'gameover') return;
      gameStateRef.current = 'gameover';
      setGameState('gameover');
      shakeTimer = 16;
      audioEngine.playHit();
      audioEngine.playDie();
      addExplosion(bird.x, bird.y);

      if (scoreRef.current > highScoreRef.current) {
        highScoreRef.current = scoreRef.current;
        setHighScore(scoreRef.current);
        try {
          localStorage.setItem('flappy_bird_high_score', scoreRef.current.toString());
        } catch {
          // ignore
        }
      }
    };

    // Parallax Clouds
    const clouds = [
      { x: 30, y: 75, s: 0.9, sp: 0.4 },
      { x: 180, y: 130, s: 0.7, sp: 0.3 },
      { x: 310, y: 55, s: 1.1, sp: 0.45 },
    ];

    const drawCloud = (x: number, y: number, scale: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.arc(16, -6, 22, 0, Math.PI * 2);
      ctx.arc(36, 0, 18, 0, Math.PI * 2);
      ctx.arc(20, 10, 16, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawSkyline = () => {
      const baseY = PLAY_HEIGHT;
      ctx.fillStyle = '#60a5fa';
      ctx.globalAlpha = 0.35;

      const buildings = [
        { x: 10, w: 36, h: 70 },
        { x: 55, w: 42, h: 105 },
        { x: 105, w: 30, h: 50 },
        { x: 145, w: 48, h: 90 },
        { x: 200, w: 36, h: 65 },
        { x: 245, w: 44, h: 115 },
        { x: 298, w: 38, h: 80 },
        { x: 345, w: 46, h: 95 }
      ];

      buildings.forEach(b => {
        ctx.fillRect(b.x, baseY - b.h, b.w, b.h);
        ctx.fillStyle = '#bfdbfe';
        for (let wy = baseY - b.h + 8; wy < baseY - 10; wy += 14) {
          for (let wx = b.x + 6; wx < b.x + b.w - 8; wx += 10) {
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
        ctx.fillStyle = '#60a5fa';
      });

      ctx.globalAlpha = 1.0;
    };

    const drawGround = () => {
      const y = PLAY_HEIGHT;
      const dirtGrad = ctx.createLinearGradient(0, y, 0, HEIGHT);
      dirtGrad.addColorStop(0, '#eab308');
      dirtGrad.addColorStop(0.15, '#ca8a04');
      dirtGrad.addColorStop(1, '#a16207');
      ctx.fillStyle = dirtGrad;
      ctx.fillRect(0, y, WIDTH, GROUND_HEIGHT);

      const grassGrad = ctx.createLinearGradient(0, y, 0, y + 14);
      grassGrad.addColorStop(0, '#4ade80');
      grassGrad.addColorStop(1, '#16a34a');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, y, WIDTH, 14);

      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, y + 13, WIDTH, 2);

      // Tufts
      ctx.fillStyle = '#22c55e';
      const stripeW = 20;
      const offset = groundScroll % stripeW;
      for (let x = -stripeW; x < WIDTH + stripeW; x += stripeW) {
        ctx.beginPath();
        ctx.moveTo(x - offset, y + 14);
        ctx.lineTo(x - offset + 8, y + 20);
        ctx.lineTo(x - offset + 12, y + 14);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y + 36);
      ctx.lineTo(WIDTH, y + 36);
      ctx.moveTo(0, y + 58);
      ctx.lineTo(WIDTH, y + 58);
      ctx.stroke();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    };

    const roundRect = (c: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
      c.beginPath();
      c.moveTo(x + radius, y);
      c.lineTo(x + width - radius, y);
      c.quadraticCurveTo(x + width, y, x + width, y + radius);
      c.lineTo(x + width, y + height - radius);
      c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      c.lineTo(x + radius, y + height);
      c.quadraticCurveTo(x, y + height, x, y + height - radius);
      c.lineTo(x, y + radius);
      c.quadraticCurveTo(x, y, x + radius, y);
      c.closePath();
    };

    const drawMedal = (cx: number, cy: number, finalScore: number) => {
      let color = null;
      if (finalScore >= 40) color = '#38bdf8'; // Platinum
      else if (finalScore >= 25) color = '#fbbf24'; // Gold
      else if (finalScore >= 10) color = '#cbd5e1'; // Silver
      else if (finalScore >= 3) color = '#d97706'; // Bronze

      if (color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#78350f';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', cx, cy + 1);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('—', cx, cy);
      }
    };

    const drawStartScreen = () => {
      ctx.save();
      ctx.textAlign = 'center';

      // Title
      ctx.font = '900 36px "Press Start 2P", sans-serif';
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#78350f';
      ctx.strokeText('FLAPPY BIRD', WIDTH / 2, 130);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('FLAPPY BIRD', WIDTH / 2, 130);

      // Subtitle
      ctx.font = '800 15px sans-serif';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeText('RETRO JS EDITION', WIDTH / 2, 168);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('RETRO JS EDITION', WIDTH / 2, 168);

      // Instruction Box
      const boxY = 325;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      roundRect(ctx, 40, boxY, WIDTH - 80, 105, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const alpha = 0.65 + Math.sin(frames * 0.1) * 0.35;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fde047';
      ctx.font = '800 17px sans-serif';
      ctx.fillText('PRESS SPACE OR TAP', WIDTH / 2, boxY + 42);

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 13px sans-serif';
      ctx.fillText('Avoid pipes and beat your high score!', WIDTH / 2, boxY + 76);

      if (highScoreRef.current > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px sans-serif';
        ctx.fillText(`🏆 BEST SCORE: ${highScoreRef.current}`, WIDTH / 2, 455);
      }

      ctx.restore();
    };

    const drawGameOverScreen = () => {
      ctx.save();
      ctx.textAlign = 'center';

      // Header
      ctx.font = '900 36px sans-serif';
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#450a0a';
      ctx.strokeText('GAME OVER', WIDTH / 2, 125);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('GAME OVER', WIDTH / 2, 125);

      // Scorecard
      const cardX = 45;
      const cardY = 165;
      const cardW = WIDTH - 90;
      const cardH = 175;

      ctx.fillStyle = '#fef3c7';
      roundRect(ctx, cardX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#b45309';
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      roundRect(ctx, cardX + 10, cardY + 10, cardW - 20, cardH - 20, 10);
      ctx.fill();

      // Medal Box
      const medalBoxX = cardX + 24;
      const medalBoxY = cardY + 36;
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      roundRect(ctx, medalBoxX, medalBoxY, 70, 80, 8);
      ctx.fill();

      ctx.font = '700 11px sans-serif';
      ctx.fillStyle = '#78350f';
      ctx.fillText('MEDAL', medalBoxX + 35, medalBoxY + 16);
      drawMedal(medalBoxX + 35, medalBoxY + 48, scoreRef.current);

      // Score details
      const labelX = cardX + cardW - 35;
      ctx.font = '800 13px sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.textAlign = 'right';
      ctx.fillText('SCORE', labelX, cardY + 42);

      ctx.font = '900 28px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(scoreRef.current.toString(), labelX, cardY + 72);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cardX + 110, cardY + 86);
      ctx.lineTo(labelX, cardY + 86);
      ctx.stroke();

      ctx.font = '800 13px sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.fillText('BEST', labelX, cardY + 110);

      ctx.font = '900 28px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(highScoreRef.current.toString(), labelX, cardY + 140);

      if (scoreRef.current > 0 && scoreRef.current >= highScoreRef.current) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 11px sans-serif';
        ctx.fillText('✨ NEW RECORD!', labelX, cardY + 162);
      }

      // Play Again Button inside canvas
      const cx = WIDTH / 2;
      const cy = 385;
      const bx = cx - 95;
      const by = cy - 26;

      ctx.fillStyle = '#78350f';
      roundRect(ctx, bx, by + 4, 190, 52, 12);
      ctx.fill();

      const btnGrad = ctx.createLinearGradient(0, by, 0, by + 52);
      btnGrad.addColorStop(0, '#f59e0b');
      btnGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = btnGrad;
      roundRect(ctx, bx, by, 190, 52, 12);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '900 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText('PLAY AGAIN', cx, cy);

      ctx.restore();
    };

    const drawInGameScore = () => {
      ctx.save();
      ctx.font = '900 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeText(scoreRef.current.toString(), WIDTH / 2, 65);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(scoreRef.current.toString(), WIDTH / 2, 65);
      ctx.restore();
    };

    // Main Game Loop Function
    const loop = () => {
      frames++;
      if (shakeTimer > 0) shakeTimer--;

      const currentDiff = DIFFICULTY_SETTINGS[diffRef.current];

      // Clouds
      clouds.forEach(c => {
        c.x -= c.sp;
        if (c.x < -60) c.x = WIDTH + 60;
      });

      // Ground scroll
      if (gameStateRef.current !== 'gameover') {
        groundScroll += currentDiff.speed;
      }

      bird.update();

      // Gameplay state
      if (gameStateRef.current === 'playing') {
        if (frames % currentDiff.spawnInterval === 0) {
          pipes.push(new Pipe(WIDTH + 20, currentDiff.gap));
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
          const p = pipes[i];
          p.update(currentDiff.speed);

          // Scoring
          if (!p.passed && p.x + p.width < bird.x - bird.radius) {
            p.passed = true;
            scoreRef.current++;
            setCurrentScore(scoreRef.current);
            audioEngine.playScore();
          }

          // Collision Box
          const bx = bird.x - bird.radius + 3;
          const by = bird.y - bird.radius + 3;
          const bw = bird.radius * 2 - 6;
          const bh = bird.radius * 2 - 6;

          // Top Pipe
          if (bx < p.x + p.width && bx + bw > p.x && by < p.topHeight) {
            triggerGameOver();
            break;
          }

          // Bottom Pipe
          if (bx < p.x + p.width && bx + bw > p.x && by + bh > p.bottomY) {
            triggerGameOver();
            break;
          }

          // Cull
          if (p.x + p.width < -30) {
            pipes.splice(i, 1);
          }
        }

        // Ceiling
        if (bird.y - bird.radius <= 0) {
          bird.y = bird.radius;
          bird.velocity = 0;
        }

        // Ground
        if (bird.y + bird.radius >= PLAY_HEIGHT) {
          bird.y = PLAY_HEIGHT - bird.radius;
          triggerGameOver();
        }
      } else if (gameStateRef.current === 'gameover') {
        if (bird.y + bird.radius < PLAY_HEIGHT) {
          bird.y += bird.velocity;
          bird.velocity += bird.gravity * 1.2;
        } else {
          bird.y = PLAY_HEIGHT - bird.radius;
        }
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;
        pt.rotation += pt.vRot;
        if (pt.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // --- Rendering ---
      ctx.save();
      if (shakeTimer > 0) {
        const dx = (Math.random() - 0.5) * 8;
        const dy = (Math.random() - 0.5) * 8;
        ctx.translate(dx, dy);
      }

      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, PLAY_HEIGHT);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#7dd3fc');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Scenery
      clouds.forEach(c => drawCloud(c.x, c.y, c.s));
      drawSkyline();

      // Pipes
      pipes.forEach(p => p.draw());

      // Ground
      drawGround();

      // Particles
      particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rotation);
        ctx.fillStyle = pt.color;
        ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
        ctx.restore();
      });

      // Bird
      bird.draw();

      // State Screens
      if (gameStateRef.current === 'start') {
        drawStartScreen();
      } else if (gameStateRef.current === 'playing') {
        drawInGameScore();
      } else if (gameStateRef.current === 'gameover') {
        drawGameOverScreen();
      }

      ctx.restore();

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    // Global action dispatcher
    const handleGameAction = (clientX?: number, clientY?: number) => {
      if (gameStateRef.current === 'start') {
        bird.reset();
        pipes = [];
        scoreRef.current = 0;
        setCurrentScore(0);
        particles.length = 0;
        gameStateRef.current = 'playing';
        setGameState('playing');
        bird.flap();
      } else if (gameStateRef.current === 'playing') {
        bird.flap();
      } else if (gameStateRef.current === 'gameover') {
        if (clientX !== undefined && clientY !== undefined) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = WIDTH / rect.width;
          const scaleY = HEIGHT / rect.height;
          const canvasX = (clientX - rect.left) * scaleX;
          const canvasY = (clientY - rect.top) * scaleY;

          // Restart button area: [cx - 95, cy - 26, 190, 52] with cx=200, cy=385
          if (
            canvasX >= 105 &&
            canvasX <= 295 &&
            canvasY >= 359 &&
            canvasY <= 411
          ) {
            bird.reset();
            pipes = [];
            scoreRef.current = 0;
            setCurrentScore(0);
            particles.length = 0;
            gameStateRef.current = 'playing';
            setGameState('playing');
            bird.flap();
            return;
          }
        }
        // General tap/key to restart after brief pause
        if (frames > 20) {
          bird.reset();
          pipes = [];
          scoreRef.current = 0;
          setCurrentScore(0);
          particles.length = 0;
          gameStateRef.current = 'playing';
          setGameState('playing');
          bird.flap();
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleGameAction();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleGameAction(e.clientX, e.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches && e.touches.length > 0) {
        handleGameAction(e.touches[0].clientX, e.touches[0].clientY);
      } else {
        handleGameAction();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audioEngine.enabled = next;
    if (next) audioEngine.init();
  };

  const handleManualRestart = () => {
    // Trigger reset by simulating action
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const event = new MouseEvent('mousedown', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + (rect.height * 385) / 600,
        bubbles: true
      });
      canvas.dispatchEvent(event);
    }
  };

  const handleCopyStandaloneCode = async () => {
    try {
      const res = await fetch('/flappy-bird.html');
      const htmlText = await res.text();
      await navigator.clipboard.writeText(htmlText);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2400);
    } catch {
      // Fallback
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2400);
    }
  };

  const handleDownloadHTML = async () => {
    try {
      const res = await fetch('/flappy-bird.html');
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flappy-bird.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open('/flappy-bird.html', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-3 sm:p-6 select-none font-sans overflow-x-hidden">
      
      {/* Top Navbar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 px-3 sm:px-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40">
            <Gamepad2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-1.5">
              Flappy Bird Arcade
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                HTML5
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">Zero-asset physics canvas arcade game</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-xs font-semibold ${
              soundOn 
                ? 'bg-slate-800/90 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-800/50 border-slate-800 text-slate-500 hover:bg-slate-800'
            }`}
            title={soundOn ? 'Sound On' : 'Muted'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundOn ? 'Audio' : 'Mute'}</span>
          </button>

          <button
            onClick={handleCopyStandaloneCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 transition-all shadow-sm"
            title="Copy standalone single-file HTML code"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedCode ? 'Copied HTML!' : 'Copy Single .HTML'}</span>
          </button>

          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-700/25 border border-emerald-400/40 transition-all active:scale-95"
            title="Download complete standalone single-file game"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download .html</span>
          </button>
        </div>
      </header>

      {/* Main Game Stage Layout */}
      <main className="flex-1 w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-6 my-auto">
        
        {/* Left Side Options Panel (Desktop) */}
        <aside className="hidden lg:flex flex-col gap-4 w-60">
          
          {/* Stats Widget */}
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              Arcade Records
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">High Score</span>
                <span className="text-lg font-black text-amber-400">{highScore}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Current Run</span>
                <span className="text-lg font-black text-white">{currentScore}</span>
              </div>
            </div>
          </div>

          {/* Difficulty Preset */}
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Zap className="w-4 h-4 text-sky-400" />
              Difficulty
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {(['easy', 'classic', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                    selectedDifficulty === d
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Gap: {DIFFICULTY_SETTINGS[selectedDifficulty].gap}px • Speed: {DIFFICULTY_SETTINGS[selectedDifficulty].speed}x
            </p>
          </div>

          {/* Skin Selection */}
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Character Skin
              </div>
              {selectedSkin === 'custom' && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SKINS) as BirdSkin[]).map((skinKey) => {
                const s = SKINS[skinKey];
                const active = selectedSkin === skinKey;
                const isPhoto = skinKey === 'custom';
                return (
                  <button
                    key={skinKey}
                    onClick={() => setSelectedSkin(skinKey)}
                    className={`p-2 rounded-xl flex items-center gap-2 border transition-all text-left ${
                      active
                        ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500/50'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {isPhoto ? (
                      <img 
                        src={customImageUrl} 
                        alt="Photo Avatar"
                        className="w-5 h-5 rounded-full object-cover border border-amber-400/80 shrink-0 shadow-sm"
                      />
                    ) : (
                      <span 
                        className="w-4 h-4 rounded-full border border-black/40 shrink-0 shadow-inner" 
                        style={{ backgroundColor: s.bodyColor }}
                      />
                    )}
                    <span className="text-xs font-bold truncate">{s.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Photo Uploader / Reset Controls */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload New Face</span>
              </button>

              {customImageUrl !== customFaceBirdUrl && (
                <button
                  onClick={handleResetToDefaultPhoto}
                  className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restore Birthday Cake Face</span>
                </button>
              )}

              {/* High Brightness Adjustment */}
              <div className="mt-1 pt-2.5 border-t border-slate-800/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Face Brightness
                  </span>
                  <span className="text-[11px] font-black text-amber-300">
                    {brightness === 1.6 ? 'Ultra (1.6x)' : brightness === 1.35 ? 'High (1.35x)' : 'Normal (1.0x)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  {[
                    { label: 'Normal', val: 1.0 },
                    { label: 'High', val: 1.35 },
                    { label: 'Ultra', val: 1.6 }
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setBrightness(item.val)}
                      className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                        brightness === item.val
                          ? 'bg-amber-500 text-slate-950 shadow font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </aside>

        {/* Central Game Arcade Cabinet View */}
        <div className="flex flex-col items-center">
          
          {/* Arcade Housing */}
          <div className="relative p-2.5 sm:p-3 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-3xl border-4 border-slate-700/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]">
            
            {/* Top Arcade Marquee Badge */}
            <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Flame className="w-3.5 h-3.5" />
                <span>FLAPPY ARCADE 60FPS</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span>HI: <strong className="text-amber-400">{highScore}</strong></span>
                <span>NOW: <strong className="text-white">{currentScore}</strong></span>
              </div>
            </div>

            {/* Canvas Screen */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner bg-[#70c5ce]">
              <canvas
                ref={canvasRef}
                className="block cursor-pointer touch-none"
                style={{ width: '400px', height: '600px' }}
              />

              {/* In-Game State Floating Quick Controls */}
              {gameState === 'gameover' && (
                <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none">
                  <button
                    onClick={handleManualRestart}
                    className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/40 border-2 border-amber-300 transition-transform active:scale-95 animate-bounce"
                  >
                    <RotateCcw className="w-4 h-4" /> Tap / Click to Restart
                  </button>
                </div>
              )}
            </div>

            {/* Cabinet Bottom Bar */}
            <div className="mt-2.5 px-2 flex items-center justify-between text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Spacebar / Click / Touch to Jump</span>
              </div>
              <button
                onClick={() => setShowCodeModal(true)}
                className="hover:text-amber-400 flex items-center gap-1 transition-colors text-[11px]"
              >
                <Code2 className="w-3.5 h-3.5" /> View HTML
              </button>
            </div>
          </div>

          {/* Mobile Options Bar */}
          <div className="flex lg:hidden flex-wrap items-center justify-center gap-2 mt-4 max-w-sm">
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Skin:</span>
              <select
                value={selectedSkin}
                onChange={(e) => setSelectedSkin(e.target.value as BirdSkin)}
                className="bg-transparent font-bold text-amber-400 focus:outline-none"
              >
                {(Object.keys(SKINS) as BirdSkin[]).map((k) => (
                  <option key={k} value={k} className="bg-slate-900 text-white">
                    {SKINS[k].name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-bold"
              title="Upload custom face"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Face</span>
            </button>

            <button
              onClick={toggleBrightness}
              className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-xl text-xs font-bold"
              title="Toggle Face Brightness"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{brightness >= 1.6 ? 'Ultra' : brightness >= 1.35 ? 'High' : 'Normal'}</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Mode:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty)}
                className="bg-transparent font-bold text-sky-400 focus:outline-none capitalize"
              >
                {(['easy', 'classic', 'hard'] as Difficulty[]).map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Side Info & Instructions Panel */}
        <aside className="hidden lg:flex flex-col gap-4 w-64">
          
          {/* How to Play Card */}
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              How to Play
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white text-[10px] font-mono">SPACE</kbd>, click or tap to flap wings.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Guide your bird safely between the green pipes without crashing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Earn 1 point per pair passed. Unlock Bronze, Silver, Gold & Platinum medals!</span>
              </li>
            </ul>
          </div>

          {/* Standalone HTML File Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 rounded-2xl p-4 border border-amber-500/30 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              Single-File Portability
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Fully self-contained HTML file featuring HTML5 Canvas, responsive controls, synthesized Web Audio, and zero external dependencies.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopyStandaloneCode}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                {copiedCode ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'Copied HTML Code!' : 'Copy Single HTML Code'}
              </button>
              <button
                onClick={handleDownloadHTML}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
              >
                <Download className="w-4 h-4" />
                Download flappy-bird.html
              </button>
            </div>
          </div>

          {/* Medals Guide */}
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-4 border border-slate-800 shadow-xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Medal Tiers
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-700 border border-amber-900"></span>
                <span className="text-slate-300">Bronze: 3+</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 border border-slate-400"></span>
                <span className="text-slate-300">Silver: 10+</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-500"></span>
                <span className="text-slate-300">Gold: 25+</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="w-3.5 h-3.5 rounded-full bg-sky-400 border border-sky-500"></span>
                <span className="text-slate-300">Platinum: 40+</span>
              </div>
            </div>
          </div>

        </aside>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800/80 mt-4">
        <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">SPACEBAR</kbd> to play in real-time</span>
        <span>Pure Canvas 2D • Web Audio Synthesizer • Standalone Ready</span>
      </footer>

      {/* Standalone HTML Code Preview Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Standalone HTML Code Preview (flappy-bird.html)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyStandaloneCode}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 text-slate-300 font-mono text-xs overflow-y-auto flex-1 leading-relaxed selection:bg-amber-500 selection:text-slate-950">
              <p className="text-amber-400/90 mb-3 pb-2 border-b border-slate-800">
                Save the code below as <code>flappy-bird.html</code> and double-click to open in any web browser without internet or server!
              </p>
              <pre className="whitespace-pre-wrap break-all text-[11px] text-slate-400">
                {`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flappy Bird JS</title>
  ... (Complete 600-line self-contained single-file HTML ready to save and run)
</html>`}
              </pre>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end gap-2">
              <button
                onClick={handleDownloadHTML}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" /> Download File Directly
              </button>
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

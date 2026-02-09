"use client";

/**
 * HeroBackground - Hero Region Enhanced Background Component
 * 
 * Provide multiple type visual effects: 
 * - Dynamic grid
 * - Particle effect
 * - Gradient halo
 * - Visual effect
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * AnimatedGrid - DynamicGridBackground
 */
interface AnimatedGridProps {
 className?: string;
 gridSize?: number;
 color?: string;
 opacity?: number;
 animated?: boolean;
}

export function AnimatedGrid({
 className,
 gridSize = 40,
 color = "rgb(249, 115, 22)",
 opacity = 0.1,
 animated = true,
}: AnimatedGridProps) {
 return (
 <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
 <div
 className={cn(
 "absolute inset-0",
 animated && "animate-grid-flow"
 )}
 style={{
 backgroundImage: `
 linear-gradient(${color} 1px, transparent 1px),
 linear-gradient(90deg, ${color} 1px, transparent 1px)
 `,
 backgroundSize: `${gridSize}px ${gridSize}px`,
 opacity,
 }}
 />
 
 <style jsx>{`
 @keyframes grid-flow {
 0% {
 transform: translateY(0);
 }
 100% {
 transform: translateY(${gridSize}px);
 }
 }
 .animate-grid-flow {
 animation: grid-flow 20s linear infinite;
 }
 `}</style>
 </div>
 );
}

/**
 * ParticleField - ParticleEffect
 */
interface Particle {
 id: number;
 x: number;
 y: number;
 size: number;
 speedX: number;
 speedY: number;
 opacity: number;
}

interface ParticleFieldProps {
 className?: string;
 particleCount?: number;
 particleColor?: string;
 particleSize?: [number, number]; // [min, max]
 speed?: number;
}

export function ParticleField({
 className,
 particleCount = 50,
 particleColor = "#f97316",
 particleSize = [2, 6],
 speed = 0.5,
}: ParticleFieldProps) {
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const particlesRef = useRef<Particle[]>([]);
 const animationRef = useRef<number>();

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;

 const ctx = canvas.getContext("2d");
 if (!ctx) return;

 const resizeCanvas = () => {
 canvas.width = canvas.offsetWidth;
 canvas.height = canvas.offsetHeight;
 };

 resizeCanvas();
 window.addEventListener("resize", resizeCanvas);

 // InitialParticle
 particlesRef.current = Array.from({ length: particleCount }, (_, i) => ({
 id: i,
 x: Math.random() * canvas.width,
 y: Math.random() * canvas.height,
 size: particleSize[0] + Math.random() * (particleSize[1] - particleSize[0]),
 speedX: (Math.random() - 0.5) * speed,
 speedY: (Math.random() - 0.5) * speed,
 opacity: 0.2 + Math.random() * 0.5,
 }));

 const animate = () => {
 ctx.clearRect(0, 0, canvas.width, canvas.height);

 particlesRef.current.forEach((particle) => {
 // Update
 particle.x += particle.speedX;
 particle.y += particle.speedY;

 // EdgeProcess
 if (particle.x < 0) particle.x = canvas.width;
 if (particle.x > canvas.width) particle.x = 0;
 if (particle.y < 0) particle.y = canvas.height;
 if (particle.y > canvas.height) particle.y = 0;

 // Particle
 ctx.beginPath();
 ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
 ctx.fillStyle = particleColor;
 ctx.globalAlpha = particle.opacity;
 ctx.fill();
 });

 ctx.globalAlpha = 1;
 animationRef.current = requestAnimationFrame(animate);
 };

 animate();

 return () => {
 window.removeEventListener("resize", resizeCanvas);
 if (animationRef.current) {
 cancelAnimationFrame(animationRef.current);
 }
 };
 }, [particleCount, particleColor, particleSize, speed]);

 return (
 <canvas
 ref={canvasRef}
 className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}
 />
 );
}

/**
 * GlowOrbs - GlowEffect
 */
interface GlowOrbsProps {
 className?: string;
 orbCount?: number;
 colors?: string[];
 minSize?: number;
 maxSize?: number;
 blur?: number;
 animated?: boolean;
}

export function GlowOrbs({
 className,
 orbCount = 3,
 colors = ["#f97316", "#fb923c", "#ea580c"],
 minSize = 300,
 maxSize = 600,
 blur = 120,
 animated = true,
}: GlowOrbsProps) {
 const orbs = Array.from({ length: orbCount }, (_, i) => ({
 id: i,
 color: colors[i % colors.length],
 size: minSize + Math.random() * (maxSize - minSize),
 top: Math.random() * 80 - 20,
 left: Math.random() * 80 - 10,
 delay: i * 2,
 duration: 15 + Math.random() * 10,
 }));

 return (
 <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
 {orbs.map((orb) => (
 <div
 key={orb.id}
 className={cn(
 "absolute rounded-full opacity-30 dark:opacity-20",
 animated && "animate-float-orb"
 )}
 style={{
 width: orb.size,
 height: orb.size,
 top: `${orb.top}%`,
 left: `${orb.left}%`,
 background: `radial-gradient(circle, ${orb.color}60 0%, transparent 70%)`,
 filter: `blur(${blur}px)`,
 animationDelay: `${orb.delay}s`,
 animationDuration: `${orb.duration}s`,
 }}
 />
 ))}
 
 <style jsx>{`
 @keyframes float-orb {
 0%, 100% {
 transform: translate(0, 0) scale(1);
 }
 25% {
 transform: translate(30px, -20px) scale(1.05);
 }
 50% {
 transform: translate(-20px, 30px) scale(0.95);
 }
 75% {
 transform: translate(20px, 20px) scale(1.02);
 }
 }
 .animate-float-orb {
 animation: float-orb ease-in-out infinite;
 }
 `}</style>
 </div>
 );
}

/**
 * WaveBackground - WaveBackground
 */
interface WaveBackgroundProps {
 className?: string;
 waveColor?: string;
 waveOpacity?: number;
 waveCount?: number;
 speed?: number;
}

export function WaveBackground({
 className,
 waveColor = "#f97316",
 waveOpacity = 0.1,
 waveCount = 3,
 speed = 15,
}: WaveBackgroundProps) {
 return (
 <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
 <svg
 className="absolute bottom-0 w-full"
 viewBox="0 0 1440 320"
 preserveAspectRatio="none"
 style={{ height: "40%" }}
 >
 {Array.from({ length: waveCount }).map((_, i) => (
 <path
 key={i}
 fill={waveColor}
 fillOpacity={waveOpacity - i * 0.02}
 className="animate-wave"
 style={{
 animationDelay: `${i * 0.5}s`,
 animationDuration: `${speed + i * 2}s`,
 }}
 d={`M0,${160 + i * 20}L48,${170 + i * 15}C96,${180 + i * 10},192,${200 - i * 5},288,${192 + i * 8}C384,${184 + i * 6},480,${144 + i * 12},576,${154 + i * 10}C672,${165 + i * 8},768,${229 - i * 10},864,${234 + i * 5}C960,${240 + i * 3},1056,${190 + i * 7},1152,${165 + i * 15}C1248,${140 + i * 10},1344,${140 + i * 8},1392,${140 + i * 6}L1440,${140 + i * 5}L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z`}
 />
 ))}
 </svg>
 
 <style jsx>{`
 @keyframes wave {
 0%, 100% {
 d: path("M0,160L48,170C96,180,192,200,288,192C384,184,480,144,576,154C672,165,768,229,864,234C960,240,1056,190,1152,165C1248,140,1344,140,1392,140L1440,140L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z");
 }
 50% {
 d: path("M0,192L48,186C96,181,192,169,288,181C384,192,480,224,576,218C672,213,768,165,864,154C960,144,1056,165,1152,181C1248,197,1344,208,1392,213L1440,218L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z");
 }
 }
 .animate-wave {
 animation: wave ease-in-out infinite;
 }
 `}</style>
 </div>
 );
}

/**
 * NoiseTexture - NoiseTextureOverlay
 */
interface NoiseTextureProps {
 className?: string;
 opacity?: number;
}

export function NoiseTexture({
 className,
 opacity = 0.03,
}: NoiseTextureProps) {
 return (
 <div
 className={cn("absolute inset-0 pointer-events-none mix-blend-overlay", className)}
 style={{
 backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
 opacity,
 }}
 />
 );
}

/**
 * HeroBackground - Group Background
 * 
 * Will group multiple type effects at once
 */
interface HeroBackgroundProps {
 className?: string;
 variant?: "default" | "minimal" | "particles" | "waves";
 primaryColor?: string;
 secondaryColor?: string;
}

export function HeroBackground({
 className,
 variant = "default",
 primaryColor = "#f97316",
 secondaryColor = "#fb923c",
}: HeroBackgroundProps) {
 if (variant === "minimal") {
 return (
 <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
 <GlowOrbs colors={[primaryColor, secondaryColor]} orbCount={2} animated />
 </div>
 );
 }

 if (variant === "particles") {
 return (
 <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
 <GlowOrbs colors={[primaryColor, secondaryColor]} orbCount={2} animated />
 <ParticleField particleColor={primaryColor} particleCount={30} />
 </div>
 );
 }

 if (variant === "waves") {
 return (
 <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
 <GlowOrbs colors={[primaryColor, secondaryColor]} orbCount={2} animated />
 <WaveBackground waveColor={primaryColor} />
 </div>
 );
 }

 // Default variant
 return (
 <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
 <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
 <GlowOrbs colors={[primaryColor, secondaryColor, "#3B82F6"]} orbCount={3} animated />
 <AnimatedGrid color={primaryColor} opacity={0.05} animated />
 <NoiseTexture opacity={0.02} />
 </div>
 );
}

export default HeroBackground;

/**
 * Tauri Environment Detection Hook
 * 
 * Detect whether running at Tauri app at component level
 */

import { useState, useEffect } from 'react';
import { isTauri, getPlatform, type Platform } from '@/lib/tauri';

export interface TauriEnvironment {
  /** Whether running at Tauri app */
  isTauri: boolean;
  /** Current platform */
  platform: Platform;
  /** Whether loading */
  isLoading: boolean;
}

/**
 * Detect Tauri Environment's Hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 * const { isTauri, platform, isLoading } = useTauri();
 * 
 * if (isLoading) return <div>Loading...</div>;
 * 
 * return (
 * <div>
 * {isTauri ? (
 * <p>Running in desktop app on {platform}</p>
 * ) : (
 * <p>Running in web browser</p>
 * )}
 * </div>
 * );
 * }
 * ```
 */
export function useTauri(): TauriEnvironment {
 const [environment, setEnvironment] = useState<TauriEnvironment>({
 isTauri: false,
 platform: 'web',
 isLoading: true,
 });

 useEffect(() => {
 async function detectEnvironment() {
 const inTauri = isTauri();
 const platform = await getPlatform();
 
 setEnvironment({
 isTauri: inTauri,
 platform,
 isLoading: false,
 });
 }

 detectEnvironment();
 }, []);

 return environment;
}

export default useTauri;

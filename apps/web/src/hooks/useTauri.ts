/**
 * Tauri 环境检测 Hook
 * 
 * 在组件中检测是否运行在 Tauri 桌面应用中
 */

import { useState, useEffect } from 'react';
import { isTauri, getPlatform, type Platform } from '@/lib/tauri';

export interface TauriEnvironment {
  /** 是否在 Tauri 桌面应用中运行 */
  isTauri: boolean;
  /** 当前平台 */
  platform: Platform;
  /** 是否正在加载 */
  isLoading: boolean;
}

/**
 * 检测 Tauri 环境的 Hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isTauri, platform, isLoading } = useTauri();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       {isTauri ? (
 *         <p>Running in desktop app on {platform}</p>
 *       ) : (
 *         <p>Running in web browser</p>
 *       )}
 *     </div>
 *   );
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

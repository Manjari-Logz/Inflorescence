import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

/**
 * Returns the safe bottom padding to use as content padding when a floating tab bar is present.
 * The tab bar is positioned at bottom 16-24px with height 64px, so content needs extra clearance.
 */
export function useSafeTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64;
  const tabBarBottom = Platform.OS === 'ios' ? 24 : 16;
  return insets.bottom + tabBarHeight + tabBarBottom + 8;
}

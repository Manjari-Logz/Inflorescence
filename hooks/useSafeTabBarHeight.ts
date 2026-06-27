import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export function useSafeTabBarHeight() {
  try {
    const height = useBottomTabBarHeight();
    return height;
  } catch (e) {
    return 0;
  }
}

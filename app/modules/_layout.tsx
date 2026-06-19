import { Stack } from 'expo-router';

export default function ModulesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="books" />
      <Stack.Screen name="podcasts" />
      <Stack.Screen name="placement" />
      <Stack.Screen name="custom-sections" />
      <Stack.Screen name="exercise" />
      <Stack.Screen name="reflection" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="badges" />
      <Stack.Screen name="money-vault" />
    </Stack>
  );
}

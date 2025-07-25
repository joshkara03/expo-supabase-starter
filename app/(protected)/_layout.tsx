import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/context/supabase-provider";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

export default function ProtectedLayout() {
	const { initialized, session } = useAuth();

	if (!initialized) {
		return null;
	}

	if (!session) {
		return <Redirect href="/welcome" />;
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false
			}}
		>
			<Stack.Screen name="(tabs)" />
			<Stack.Screen name="modal" options={{ presentation: "modal" }} />
			<Stack.Screen 
				name="video" 
				options={{
					presentation: 'card',
					headerShown: true,
					headerTitle: "Shot Analysis",
					headerBackTitle: "Back",
					headerBackVisible: true,
					headerTintColor: "#FF6B35",
					headerStyle: {
						backgroundColor: "#1F2937"
					},
					headerTitleStyle: {
						color: "#FFFFFF"
					}
				}} 
			/>
		</Stack>
	);
}

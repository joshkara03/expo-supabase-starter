import React from "react";
import { Tabs } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';

import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

export default function TabsLayout() {
	const { colorScheme } = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor:
						colorScheme === "dark"
							? colors.dark.background
							: colors.light.background,
				},
				tabBarActiveTintColor:
					colorScheme === "dark"
						? colors.dark.foreground
						: colors.light.foreground,
				tabBarShowLabel: false,
			}}
		>
			<Tabs.Screen name="picker" options={{ 
				title: "Videos",
				tabBarIcon: ({ color, size }) => (
					<MaterialIcons name="video-library" size={size} color={color} />
				)
			}} />
			<Tabs.Screen name="index" options={{ 
				title: "Record",
				tabBarIcon: ({ color, size }) => (
					<MaterialIcons name="videocam" size={size} color={color} />
				)
			}} />
			<Tabs.Screen name="video" options={{ 
				title: "Review",
				tabBarIcon: ({ color, size }) => (
					<MaterialIcons name="sports-basketball" size={size} color={color} />
				)
			}} />
			<Tabs.Screen name="settings" options={{ 
				title: "Settings",
				tabBarIcon: ({ color, size }) => (
					<MaterialIcons name="settings" size={size} color={color} />
				)
			}} />
		</Tabs>
	);
}

import { Tabs } from "expo-router";
import React from "react";
import BotBar from '../botbar';

export default function HomeLayout() {
    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: { display: "none" }, // Hide default tab bar
                }}
            >
                <Tabs.Screen name="home" options={{ headerShown: false }} />
            </Tabs>
            <BotBar />
        </>
    );
}


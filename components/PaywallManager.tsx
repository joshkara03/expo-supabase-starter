import { useEffect } from 'react';
import { Platform } from 'react-native';
import { usePlacement } from 'expo-superwall';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

/**
 * PaywallManager - Component that automatically triggers the paywall 
 * when mounted. This should be placed at the root of your app.
 */
export default function PaywallManager() {
  // Skip paywall in Expo Go since native module isn't available
  if (isExpoGo) {
    console.log('Superwall is disabled in Expo Go - requires a development build');
    return null;
  }
  
  const { registerPlacement } = usePlacement({
    onError: (err) => console.error("Paywall Error:", err),
    onPresent: (info) => console.log("Paywall Presented:", info),
    onDismiss: (info, result) =>
      console.log("Paywall Dismissed:", info, "Result:", result),
  });

  // Trigger paywall immediately when component mounts
  useEffect(() => {
    const showPaywall = async () => {
      try {
        await registerPlacement({
          placement: "campaign_trigger", // Using the default placement
        });
      } catch (error) {
        console.error("Failed to show paywall:", error);
      }
    };

    // Show paywall immediately
    showPaywall();
  }, []); // Empty dependency array means this runs once on mount

  // This component doesn't render anything
  return null;
}

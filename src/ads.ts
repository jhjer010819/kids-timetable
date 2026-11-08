export type AdPlacement = "save-image"

/**
 * Fires when the user saves the timetable image.
 * The on-screen gate is the stand-in interstitial. Replace this body with
 * AdMob (native wrapper) or AdSense, and resolve after the ad closes.
 */
export async function presentInterstitial(placement: AdPlacement): Promise<void> {
  if (placement !== "save-image") return
}

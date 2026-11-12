// Lets a tab screen with unsaved work stop the tab bar from leaving it.
//
// A screen (like Create) registers a guard under its route name. When a tab is tapped,
// the tab layout asks the current screen's guard first. The guard gets a `leave`
// function: if it returns true, it's handling things (e.g. showing a "discard?" popup)
// and calls `leave()` itself if the user decides to go.

type LeaveGuard = (leave: () => void) => boolean;

const guards = new Map<string, LeaveGuard>();

// Called by a screen to start guarding. Returns a function that stops guarding.
export function setLeaveGuard(routeName: string, guard: LeaveGuard) {
  guards.set(routeName, guard);
  return () => {
    if (guards.get(routeName) === guard) guards.delete(routeName);
  };
}

// Called by the tab layout. Returns true if the screen stopped the tab switch.
export function askBeforeLeaving(routeName: string, leave: () => void): boolean {
  const guard = guards.get(routeName);
  return guard ? guard(leave) : false;
}

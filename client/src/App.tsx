// Root router shell — routes are added per feature.

import { Route, Switch } from "wouter";
import { AuthGuard } from "./components/AuthGuard";

export function App() {
  return (
    <Switch>
      {/* TODO: add /login route (Feature 1) */}
      {/* TODO: add /change-password route (Feature 1) */}
      <Route>
        <AuthGuard>
          {/* TODO: add authenticated routes (Feature 2+) */}
          <p>Mission Control</p>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

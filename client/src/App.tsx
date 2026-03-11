// Root router shell — routes are added per feature.

import { Route, Switch } from "wouter";
import { AuthGuard } from "./components/AuthGuard";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/change-password">
        <AuthGuard>
          <ChangePasswordPage />
        </AuthGuard>
      </Route>
      <Route>
        <AuthGuard>
          {/* TODO: add authenticated routes (Feature 2+) */}
          <p>Mission Control</p>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Feedbacks from "./pages/Feedbacks";
import FeedbackDetail from "./pages/FeedbackDetail";
import FeedbackNew from "./pages/FeedbackNew";
import Avisos from "./pages/Avisos";
import AvisoNew from "./pages/AvisoNew";
import Padronizacao from "./pages/Padronizacao";
import Estatisticas from "./pages/Estatisticas";
import Usuarios from "./pages/Usuarios";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/feedbacks"} component={Feedbacks} />
      <Route path={"/feedbacks/new"} component={FeedbackNew} />
      <Route path={"/feedbacks/:id"} component={FeedbackDetail} />
      <Route path={"/avisos"} component={Avisos} />
      <Route path={"/avisos/new"} component={AvisoNew} />
      <Route path={"/padronizacao"} component={Padronizacao} />
      <Route path={"/estatisticas"} component={Estatisticas} />
      <Route path={"/usuarios"} component={Usuarios} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

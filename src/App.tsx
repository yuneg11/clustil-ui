import { Dashboard } from "@/components/dashboard";
import { ThemeProvider } from "@/components/theme";

export function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <Dashboard />
    </ThemeProvider>
  );
}

export default App;

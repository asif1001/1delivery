import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/login";
import Home from "@/pages/home";
import DriverDashboard from "@/pages/driver-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import TaskManagement from "@/pages/task-management";
import ComplaintManagement from "@/pages/complaint-management";
import NotFound from "@/pages/not-found";

function AppRouter() {
  const { userData, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return <Login />;
  }

  return (
    <Switch>
      {userData.role === 'admin' ? (
        <>
          <Route path="/" component={() => <AdminDashboard user={userData} />} />
          <Route path="/admin-dashboard" component={() => <AdminDashboard user={userData} />} />
          <Route path="/task-management" component={() => <TaskManagement />} />
          <Route path="/complaint-management" component={() => <ComplaintManagement />} />
        </>
      ) : userData.role === 'driver' ? (
        <>
          <Route path="/" component={() => <DriverDashboard user={userData} />} />
          <Route path="/driver-dashboard" component={() => <DriverDashboard user={userData} />} />
        </>
      ) : (
        <Route path="/" component={Home} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <WouterRouter base={import.meta.env.BASE_URL}>
          <AppRouter />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

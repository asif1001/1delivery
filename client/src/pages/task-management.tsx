import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  getAllTasks, 
  updateTask, 
  deleteTask, 
  saveTask,
  getAllUsers 
} from "@/lib/firebase";
import TaskCreationDialog from "@/components/task-creation-dialog";
import TaskList from "@/components/task-list";
import { 
  CalendarIcon, 
  ClockIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ArrowLeftIcon
} from "lucide-react";
import { Link } from "wouter";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: Date;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  assignedTo?: string;
}

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  active: boolean;
}

export default function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const { userData } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, driversData] = await Promise.all([
        getAllTasks(),
        getAllUsers()
      ]);
      
      setTasks(tasksData as Task[]);
      // Filter only drivers from all users
      setDrivers((driversData as User[]).filter(user => user.role === 'driver'));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks and drivers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTask = async (task: CreateTask) => {
    try {
      await saveTask(task);
      await loadData();
      toast({
        title: "Success",
        description: "Task created successfully"
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTask = async (id: string, task: Partial<Task>) => {
    try {
      await updateTask(id, task);
      await loadData();
      toast({
        title: "Success",
        description: "Task updated successfully"
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      await loadData();
      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    }
  };

  const getTasksByStatus = (status?: string) => {
    if (!status || status === 'all') return tasks;
    return tasks.filter(task => task.status === status);
  };

  const getTodayTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate >= today && taskDate < tomorrow;
    });
  };

  const getOverdueTasks = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate < today && task.status !== 'completed';
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const pendingTasks = getTasksByStatus('pending');
  const todayTasks = getTodayTasks();
  const overdueTasks = getOverdueTasks();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <div className="bg-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mr-3 shadow-lg p-1">
                <img 
                  src={new URL('/logo.png', import.meta.env.BASE_URL).toString()} 
                  alt="OilDelivery Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-white">
                <h1 className="text-lg sm:text-xl font-bold">OILDELIVERY</h1>
                <p className="text-xs sm:text-sm text-blue-100">Task Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link to="/admin-dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeftIcon className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Button>
              </Link>
              <div className="text-white text-right">
                <p className="text-xs sm:text-sm font-medium">{userData?.displayName}</p>
                <p className="text-xs text-blue-100 capitalize">{userData?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-gray-900">{todayTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangleIcon className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{overdueTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Task Management</CardTitle>
                <CardDescription>Create and manage daily operational tasks</CardDescription>
              </div>
              <TaskCreationDialog onAdd={handleAddTask} drivers={drivers} />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All Tasks</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                <TaskList
                  tasks={getTasksByStatus('all')}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  drivers={drivers}
                />
              </TabsContent>
              
              <TabsContent value="pending" className="mt-6">
                <TaskList
                  tasks={pendingTasks}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  drivers={drivers}
                />
              </TabsContent>
              
              <TabsContent value="today" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Today's Deadline ({todayTasks.length} tasks)</h3>
                  </div>
                  <TaskList
                    tasks={todayTasks}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    drivers={drivers}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="overdue" className="mt-6">
                <div className="space-y-4">
                  {overdueTasks.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-red-900">Overdue Tasks ({overdueTasks.length})</h3>
                    </div>
                  )}
                  <TaskList
                    tasks={overdueTasks}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    drivers={drivers}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="completed" className="mt-6">
                <TaskList
                  tasks={getTasksByStatus('completed')}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  drivers={drivers}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
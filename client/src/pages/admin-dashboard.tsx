import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  TruckIcon, 
  LogOutIcon, 
  UsersIcon, 
  MapPinIcon, 
  DropletIcon, 
  SettingsIcon,
  FileTextIcon,
  AlertTriangleIcon,
  DownloadIcon,
  EyeIcon,
  ClockIcon,
  Calendar,
  XIcon,
  DownloadCloudIcon,
  CalendarIcon

} from "lucide-react";
import { 
  getAllDeliveries, 
  getAllComplaints, 
  getAllUsers, 
  createDriverAccount,
  updateDriver,
  deleteDriver,
  saveBranch,
  getAllBranches,
  updateBranch,
  deleteBranch,
  saveOilType,
  getAllOilTypes,
  updateOilType,
  deleteOilType,
  deleteRecordsByDateRange,
  getFirestoreUsage,
  saveTask,
  getAllTasks,
  updateTask,
  deleteTask,
  getAllTransactions
} from "@/lib/firebase";
import { TransactionViewer } from "@/components/TransactionViewer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

// Task interface
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

// Basic types for the components that don't exist yet
interface User {
  uid: string;
  email: string | null;
  role: string;
  displayName: string | null;
  active?: boolean;
  empNo?: string;
  driverLicenceNo?: string;
  licenceExpiryDate?: Date;
}

interface Delivery {
  id: string;
  driverUid: string;
  driverName: string;
  status: 'completed' | 'loading' | 'unloading' | 'draft';
  oilTypeId: string | null;
  createdAt: Date | null;
  loadedOilLiters: number | null;
  completedTimestamp: Date | null;
}

interface Complaint {
  id: string;
  driverUid: string;
  driverName: string;
  status: 'open' | 'in_progress' | 'closed';
  description: string | null;
  createdAt: Date | null;
  photo: string | null;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  contactNo: string;
}

interface OilType {
  id: string;
  name: string;
  color?: string;
}

interface CreateBranch {
  name: string;
  address: string;
  contactNo: string;
}

interface CreateOilType {
  name: string;
  color?: string;
}

interface CreateDriver {
  displayName: string;
  email: string;
  password: string;
  empNo?: string;
  driverLicenceNo: string;
  licenceExpiryDate: string;
}

import AdminBranches from "./admin-branches";
import AdminOilTypes from "./admin-oil-types";
import AdminDrivers from "./admin-drivers";
import TaskCreationDialog from "@/components/task-creation-dialog";
import TaskList from "@/components/task-list";
import SettingsPanel from "@/components/settings-panel";

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [oilTypes, setOilTypes] = useState<OilType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, label: string} | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isTransactionViewerOpen, setIsTransactionViewerOpen] = useState(false);

  const { toast } = useToast();
  const { logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        deliveriesData,
        complaintsData,
        driversData,
        branchesData,
        oilTypesData,
        tasksData,
        storageData,
        transactionsData
      ] = await Promise.all([
        getAllDeliveries().catch(() => []),
        getAllComplaints().catch(() => []),
        getAllUsers().catch(() => []),
        getAllBranches().catch(() => []),
        getAllOilTypes().catch(() => []),
        getAllTasks().catch(() => []),
        getFirestoreUsage().catch(() => null),
        getAllTransactions().catch(() => [])
      ]);

      setDeliveries(deliveriesData);
      setComplaints(complaintsData);
      setDrivers(driversData.filter((user: User) => user.role === 'driver'));
      setBranches(branchesData);
      setOilTypes(oilTypesData);
      setTasks(tasksData);
      setStorageUsage(storageData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load some data. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
  };

  // Delivery stats
  const completedDeliveries = deliveries.filter(d => d.status === 'completed').length;
  const pendingDeliveries = deliveries.filter(d => d.status !== 'completed').length;
  const totalOilDelivered = deliveries
    .filter(d => d.status === 'completed')
    .reduce((total, d) => total + (d.loadedOilLiters || 0), 0);

  // Driver stats
  const activeDrivers = drivers.filter(d => d.active !== false).length;
  const totalDrivers = drivers.length;

  // Complaint stats
  const openComplaints = complaints.filter(c => c.status === 'open').length;
  const totalComplaints = complaints.length;

  // Task stats
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;

  // Handler functions
  const handleAddDriver = async (driver: CreateDriver) => {
    try {
      await createDriverAccount(driver);
      await loadData();
      toast({
        title: "Success",
        description: "Driver created successfully"
      });
    } catch (error) {
      console.error('Error creating driver:', error);
      toast({
        title: "Error",
        description: "Failed to create driver",
        variant: "destructive"
      });
    }
  };

  const handleUpdateDriver = async (id: string, driver: Partial<User>) => {
    try {
      await updateDriver(id, driver);
      await loadData();
      toast({
        title: "Success",
        description: "Driver updated successfully"
      });
    } catch (error) {
      console.error('Error updating driver:', error);
      toast({
        title: "Error",
        description: "Failed to update driver",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDriver = async (id: string) => {
    try {
      await deleteDriver(id);
      await loadData();
      toast({
        title: "Success",
        description: "Driver deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast({
        title: "Error",
        description: "Failed to delete driver",
        variant: "destructive"
      });
    }
  };

  const handleToggleDriverStatus = async (id: string, active: boolean) => {
    try {
      await updateDriver(id, { active });
      await loadData();
      toast({
        title: "Success",
        description: `Driver ${active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling driver status:', error);
      toast({
        title: "Error",
        description: "Failed to update driver status",
        variant: "destructive"
      });
    }
  };

  const handleAddBranch = async (branch: CreateBranch) => {
    try {
      await saveBranch(branch);
      await loadData();
      toast({
        title: "Success",
        description: "Branch added successfully"
      });
    } catch (error) {
      console.error('Error adding branch:', error);
      toast({
        title: "Error",
        description: "Failed to add branch",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBranch = async (id: string, branch: Partial<Branch>) => {
    try {
      await updateBranch(id, branch);
      await loadData();
      toast({
        title: "Success",
        description: "Branch updated successfully"
      });
    } catch (error) {
      console.error('Error updating branch:', error);
      toast({
        title: "Error",
        description: "Failed to update branch",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBranch = async (id: string) => {
    try {
      await deleteBranch(id);
      await loadData();
      toast({
        title: "Success",
        description: "Branch deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive"
      });
    }
  };

  const handleAddOilType = async (oilType: CreateOilType) => {
    try {
      await saveOilType(oilType);
      await loadData();
      toast({
        title: "Success",
        description: "Oil type added successfully"
      });
    } catch (error) {
      console.error('Error adding oil type:', error);
      toast({
        title: "Error",
        description: "Failed to add oil type",
        variant: "destructive"
      });
    }
  };

  const handleUpdateOilType = async (id: string, oilType: Partial<OilType>) => {
    try {
      await updateOilType(id, oilType);
      await loadData();
      toast({
        title: "Success",
        description: "Oil type updated successfully"
      });
    } catch (error) {
      console.error('Error updating oil type:', error);
      toast({
        title: "Error",
        description: "Failed to update oil type",
        variant: "destructive"
      });
    }
  };

  const handleDeleteOilType = async (id: string) => {
    try {
      await deleteOilType(id);
      await loadData();
      toast({
        title: "Success",
        description: "Oil type deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting oil type:', error);
      toast({
        title: "Error",
        description: "Failed to delete oil type",
        variant: "destructive"
      });
    }
  };

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

  const handleDeleteRecords = async (collection: string, startDate: Date, endDate: Date) => {
    try {
      await deleteRecordsByDateRange(collection, startDate, endDate);
      await loadData();
      toast({
        title: "Success",
        description: "Records deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting records:', error);
      toast({
        title: "Error",
        description: "Failed to delete records",
        variant: "destructive"
      });
    }
  };



  const downloadTransactionsCSV = () => {
    if (!transactions || transactions.length === 0) {
      toast({
        title: "No Data",
        description: "No transactions available to download",
        variant: "destructive"
      });
      return;
    }

    // Prepare CSV headers
    const headers = [
      "Transaction ID",
      "Type",
      "Date",
      "Driver Name",
      "Oil Type",
      "Quantity (L)",
      "Branch",
      "Start Meter",
      "End Meter",
      "Delivery Order",
      "Tank Level Photo",
      "Hose Connection Photo",
      "Final Tank Photo",
      "Status"
    ];

    // Helper function to get driver name from UID
    const getDriverName = (driverUid: string) => {
      const driver = drivers.find(d => d.uid === driverUid || d.id === driverUid);
      return driver ? (driver.displayName || driver.email) : driverUid || 'Unknown Driver';
    };

    // Helper function to format date properly
    const formatDate = (timestamp: any, createdAt: any) => {
      if (timestamp?.toDate) {
        return timestamp.toDate().toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } else if (createdAt) {
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      return 'Unknown Date';
    };

    // Combine all transactions with deliveries for complete export
    const allTransactions = [
      ...deliveries.map(delivery => ({
        id: delivery.id,
        type: 'Supply',
        timestamp: delivery.completedTimestamp,
        createdAt: delivery.createdAt,
        driverUid: delivery.driverUid,
        oilTypeName: delivery.oilTypeName,
        quantity: delivery.deliveredLiters,
        branchName: delivery.branchName,
        startMeterReading: delivery.startMeterReading,
        endMeterReading: delivery.endMeterReading,
        deliveryOrderId: delivery.deliveryOrderId,
        photos: delivery.photos || {},
        tankLevelPhoto: delivery.tankLevelPhoto,
        hoseConnectionPhoto: delivery.hoseConnectionPhoto,
        finalTankLevelPhoto: delivery.finalTankLevelPhoto,
        status: delivery.status || 'completed'
      })),
      ...transactions.map(transaction => ({
        ...transaction,
        quantity: transaction.deliveredLiters || transaction.loadedLiters || transaction.quantity
      }))
    ];

    // Prepare CSV data with enriched information
    const csvData = allTransactions.map(transaction => [
      transaction.id || transaction.loadSessionId || '',
      transaction.type || (transaction.deliveredLiters ? 'Supply' : 'Loading'),
      formatDate(transaction.timestamp, transaction.createdAt),
      getDriverName(transaction.driverUid),
      transaction.oilTypeName || '',
      transaction.quantity || '',
      transaction.branchName || '',
      transaction.startMeterReading || '',
      transaction.endMeterReading || '',
      transaction.deliveryOrderId || '',
      transaction.photos?.tankLevelBefore || transaction.photos?.tankLevel || transaction.tankLevelPhoto || '',
      transaction.photos?.hoseConnection || transaction.hoseConnectionPhoto || '',
      transaction.photos?.tankLevelAfter || transaction.photos?.finalTankLevel || transaction.finalTankLevelPhoto || '',
      transaction.status || 'completed'
    ]);

    // Create CSV content
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `oil_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Downloaded ${allTransactions.length} transactions with proper dates and driver names`
    });
  };

  const viewTransactionDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
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
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">OILDELIVERY</h1>
                <p className="text-xs sm:text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center text-xs sm:text-sm px-2 sm:px-4"
                data-testid="button-logout"
              >
                <LogOutIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 text-xs sm:text-sm">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="drivers" className="text-xs sm:text-sm">Drivers</TabsTrigger>
            <TabsTrigger value="branches" className="text-xs sm:text-sm">Branches</TabsTrigger>
            <TabsTrigger value="oil-types" className="text-xs sm:text-sm">Oil Types</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs sm:text-sm">Tasks</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* CSV Download Section */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Overview</h2>
                <p className="text-gray-600 text-sm">Today's operations and download reports</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={() => setIsTransactionViewerOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
                  data-testid="button-transaction-viewer"
                >
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">View Transactions</span>
                  <span className="sm:hidden">View</span>
                </Button>
                <Button
                  onClick={downloadTransactionsCSV}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                  data-testid="button-download-csv"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Download All Transactions CSV</span>
                  <span className="sm:hidden">Download CSV</span>
                </Button>
              </div>
            </div>

            {/* Today's Oil Delivered by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DropletIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Today's Oil Delivered (by Oil Type)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const today = new Date().toDateString();
                    const todayDeliveries = deliveries.filter(d => 
                      d.completedTimestamp && new Date(d.completedTimestamp).toDateString() === today
                    );
                    
                    const oilTypeTotals = todayDeliveries.reduce((acc, delivery) => {
                      const oilType = delivery.oilTypeName || 'Unknown';
                      acc[oilType] = (acc[oilType] || 0) + (delivery.deliveredLiters || 0);
                      return acc;
                    }, {});

                    const totalToday = Object.values(oilTypeTotals).reduce((sum, liters) => sum + liters, 0);

                    return Object.keys(oilTypeTotals).length > 0 ? (
                      <>
                        {Object.entries(oilTypeTotals).map(([oilType, liters]) => (
                          <div key={oilType} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                              <span className="font-medium">{oilType}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-blue-600">{liters.toLocaleString()}L</div>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total Today:</span>
                            <span className="text-blue-600">{totalToday.toLocaleString()}L</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <DropletIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No oil deliveries today</p>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions (Last 10) - Matching Driver Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Recent Transactions (Last 10)
                </CardTitle>
                <p className="text-sm text-gray-600">Complete history of loading and supply operations across all drivers</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Unified list combining deliveries and transactions with normalization
                  const allTransactions = [
                    // Map deliveries as supply transactions
                    ...deliveries.map(d => ({
                      id: d.id,
                      type: 'supply' as const,
                      timestamp: d.completedTimestamp || d.createdAt,
                      oilTypeName: d.oilTypeName || 'Unknown Oil Type',
                      quantity: d.deliveredLiters ?? d.loadedLiters ?? d.quantity ?? 0,
                      driverName: (() => {
                        const driver = drivers.find(dr => dr.uid === d.driverUid);
                        return driver ? (driver.displayName || driver.email) : (d.driverName || 'Unknown Driver');
                      })(),
                      branchName: (() => {
                        const branch = branches.find(b => b.id === d.branchId);
                        return branch ? branch.name : (d.branchName || 'Unknown Branch');
                      })(),
                      // Gather photos from all possible locations
                      photos: {
                        ...(d.photos || {}),
                        ...(d.tankLevelPhoto && { tankLevel: d.tankLevelPhoto }),
                        ...(d.hoseConnectionPhoto && { hoseConnection: d.hoseConnectionPhoto }),
                        ...(d.finalTankLevelPhoto && { tankLevelAfter: d.finalTankLevelPhoto }),
                        ...(d.meterReadingPhoto && { meterReading: d.meterReadingPhoto })
                      },
                      // Preserve other fields
                      ...d
                    })),
                    // Map loading and supply transactions
                    ...transactions.filter(t => t.type === 'loading' || t.type === 'supply').map(t => ({
                      id: t.id,
                      type: t.type as 'loading' | 'supply',
                      timestamp: t.timestamp || t.createdAt,
                      oilTypeName: t.oilTypeName || 'Unknown Oil Type',
                      quantity: t.deliveredLiters ?? t.loadedLiters ?? t.quantity ?? 0,
                      driverName: (() => {
                        const driver = drivers.find(dr => dr.uid === t.driverUid);
                        return driver ? (driver.displayName || driver.email) : (t.driverName || 'Unknown Driver');
                      })(),
                      branchName: t.type === 'supply' ? (() => {
                        const branch = branches.find(b => b.id === t.branchId);
                        return branch ? branch.name : (t.branchName || 'Unknown Branch');
                      })() : undefined,
                      // Gather photos from all possible locations
                      photos: {
                        ...(t.photos || {}),
                        ...(t.tankLevelPhoto && { tankLevel: t.tankLevelPhoto }),
                        ...(t.hoseConnectionPhoto && { hoseConnection: t.hoseConnectionPhoto }),
                        ...(t.finalTankLevelPhoto && { tankLevelAfter: t.finalTankLevelPhoto }),
                        ...(t.loadPhoto && { loadPhoto: t.loadPhoto })
                      },
                      // Preserve other fields
                      ...t
                    }))
                  ];

                  // Sort DESC by timestamp, take 10
                  const sortedTransactions = allTransactions
                    .sort((a, b) => {
                      const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
                      const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
                      return timestampB.getTime() - timestampA.getTime();
                    })
                    .slice(0, 10);

                  return sortedTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {sortedTransactions.map((transaction, index) => (
                        <div key={transaction.id || index} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                transaction.type === 'loading' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {transaction.type === 'loading' ? 'LOADING' : 'SUPPLY'}
                              </span>
                              <span className="font-medium">{transaction.oilTypeName}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {transaction.quantity.toLocaleString()}L
                              {transaction.type === 'supply' && transaction.branchName && (
                                <> • Delivered to {transaction.branchName}</>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {transaction.timestamp?.toDate ? 
                                transaction.timestamp.toDate().toLocaleString() : 
                                'Unknown date'
                              }
                            </div>
                            <div className="text-xs text-gray-500">Driver: {transaction.driverName}</div>
                            {transaction.type === 'supply' && transaction.branchName && (
                              <div className="text-xs text-gray-500">Branch: {transaction.branchName}</div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowTransactionModal(true);
                            }}
                            className="flex items-center gap-2"
                            data-testid={`button-view-transaction-${index}`}
                          >
                            <EyeIcon className="h-4 w-4" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No recent transactions</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers">
            <AdminDrivers
              drivers={drivers}
              onAddDriver={handleAddDriver}
              onUpdateDriver={handleUpdateDriver}
              onDeleteDriver={handleDeleteDriver}
              onToggleDriverStatus={handleToggleDriverStatus}
            />
          </TabsContent>

          <TabsContent value="branches">
            <AdminBranches
              branches={branches}
              oilTypes={oilTypes}
              onAddBranch={handleAddBranch}
              onUpdateBranch={handleUpdateBranch}
              onDeleteBranch={handleDeleteBranch}
            />
          </TabsContent>

          <TabsContent value="oil-types">
            <AdminOilTypes
              oilTypes={oilTypes}
              onAddOilType={handleAddOilType}
              onUpdateOilType={handleUpdateOilType}
              onDeleteOilType={handleDeleteOilType}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Task Management</h3>
                  <p className="text-sm text-gray-600">Create and manage daily operational tasks</p>
                </div>
                <div className="flex space-x-2">
                  <Link to="/task-management">
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      View All Tasks
                    </Button>
                  </Link>
                  <Link to="/complaint-management">
                    <Button variant="outline" size="sm">
                      <AlertTriangleIcon className="w-4 h-4 mr-2" />
                      Complaints
                    </Button>
                  </Link>
                  <TaskCreationDialog onAdd={handleAddTask} drivers={drivers} />
                </div>
              </div>
              <TaskList
                tasks={tasks.slice(0, 5)}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
                drivers={drivers}
              />
              {tasks.length > 5 && (
                <div className="text-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Link to="/task-management">
                      <Button variant="ghost" size="sm" className="flex-1">
                        View all {tasks.length} tasks →
                      </Button>
                    </Link>
                    <Link to="/complaint-management">
                      <Button variant="ghost" size="sm" className="flex-1">
                        <AlertTriangleIcon className="h-4 w-4 mr-1" />
                        Complaints ({openComplaints})
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">System Settings</h3>
                <p className="text-sm text-gray-600">Manage system preferences and data</p>
              </div>
              <SettingsPanel
                storageUsage={storageUsage}
                onDeleteRecords={handleDeleteRecords}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Details Modal - Simple Working Version */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            View detailed information about this transaction including photos and metadata
          </DialogDescription>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedTransaction.type === 'loading' ? 'Oil Loading Transaction' : 'Oil Supply Transaction'}
                  </h3>
                  <div className="text-sm text-gray-500 mt-1">
                    <strong>Date & Time:</strong> {selectedTransaction.timestamp?.toDate ? 
                      selectedTransaction.timestamp.toDate().toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) : 
                      selectedTransaction.createdAt ?
                      new Date(selectedTransaction.createdAt).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) :
                      'Unknown date'
                    }
                  </div>
                </div>
                <Badge variant={selectedTransaction.type === 'loading' ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                  {selectedTransaction.type === 'loading' ? 'Loading' : 'Supply'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className={`font-medium ${
                    selectedTransaction.type === 'loading' 
                      ? 'text-blue-600' 
                      : 'text-orange-600'
                  }`}>
                    {selectedTransaction.type === 'loading' ? 'Oil Loading' : 'Oil Supply'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Oil Type</label>
                  <p className="font-medium">
                    {(() => {
                      const oilType = oilTypes.find(o => o.id === selectedTransaction.oilTypeId);
                      return oilType ? `${oilType.name} - ${oilType.viscosity}` : selectedTransaction.oilTypeName || 'Unknown Oil Type';
                    })()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="font-medium">
                    {(selectedTransaction.deliveredLiters || selectedTransaction.loadedLiters || selectedTransaction.quantity || 0).toLocaleString()}L
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Driver</label>
                  <p className="font-medium">
                    {(() => {
                      const driver = drivers.find(d => d.uid === selectedTransaction.driverUid || d.id === selectedTransaction.driverUid);
                      return driver ? (driver.displayName || driver.email) : selectedTransaction.driverName || selectedTransaction.driverUid || 'Unknown Driver';
                    })()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Branch</label>
                  <p className="font-medium">
                    {(() => {
                      const branch = branches.find(b => b.id === selectedTransaction.branchId);
                      return branch ? branch.name : selectedTransaction.branchName || 'Unknown Branch';
                    })()}
                  </p>
                </div>
                {selectedTransaction.deliveryOrderId && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Delivery Order</label>
                    <p className="font-medium">{selectedTransaction.deliveryOrderId}</p>
                  </div>
                )}
                {(selectedTransaction.startMeterReading || selectedTransaction.endMeterReading) && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Start Meter</label>
                      <p className="font-medium">{selectedTransaction.startMeterReading || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">End Meter</label>
                      <p className="font-medium">{selectedTransaction.endMeterReading || 'N/A'}</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="font-medium text-green-600">{selectedTransaction.status || 'Completed'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Session ID</label>
                  <p className="font-medium text-xs text-gray-500">
                    {selectedTransaction.loadSessionId || selectedTransaction.id || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Photos - Simple Working Implementation */}
              {selectedTransaction.photos && Object.keys(selectedTransaction.photos).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Photos</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedTransaction.photos).map(([photoType, photoUrl]: [string, any]) => 
                      photoUrl && (
                        <div key={photoType} className="text-center">
                          <div className="relative group cursor-pointer"
                               onClick={() => {
                                 setSelectedPhoto({
                                   url: photoUrl,
                                   label: photoType.replace(/([A-Z])/g, ' $1').trim()
                                 });
                                 setShowPhotoModal(true);
                               }}>
                            <img 
                              src={photoUrl} 
                              alt={photoType} 
                              className="w-full h-20 object-cover rounded border hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                              <EyeIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {photoType.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-Size Photo Modal */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
          <DialogTitle className="sr-only">Photo Viewer</DialogTitle>
          <DialogDescription className="sr-only">
            Full size view of {selectedPhoto?.label || 'delivery photo'}
          </DialogDescription>
          {selectedPhoto && (
            <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
              {/* Header with photo label and close button */}
              <div className="absolute top-0 left-0 right-0 bg-black/80 text-white p-4 z-10 flex justify-between items-center">
                <h3 className="text-lg font-medium">{selectedPhoto.label}</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedPhoto.url;
                      link.download = `${selectedPhoto.label.replace(/\s+/g, '_')}_${new Date().getTime()}.jpg`;
                      link.click();
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <DownloadCloudIcon className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPhotoModal(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Full-size image */}
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.label}
                  className="max-w-full max-h-full object-contain"
                  style={{ maxHeight: 'calc(100vh - 120px)' }}
                />
              </div>
              
              {/* Footer with actions */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-4 z-10 flex justify-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedPhoto.url, '_blank')}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Open in New Tab
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedPhoto.url;
                    link.download = `${selectedPhoto.label.replace(/\s+/g, '_')}_${new Date().getTime()}.jpg`;
                    link.click();
                  }}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <DownloadCloudIcon className="h-4 w-4 mr-1" />
                  Download Photo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>



      {/* Transaction Viewer Modal */}
      {isTransactionViewerOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-auto bg-white rounded-lg p-3 sm:p-6">
            <TransactionViewer onClose={() => setIsTransactionViewerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
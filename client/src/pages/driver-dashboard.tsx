import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LogOutIcon, TruckIcon, DropletIcon, ClockIcon, EyeIcon, Calendar, User, XIcon, DownloadCloudIcon, AlertTriangleIcon, PlusIcon, CameraIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingWorkflow } from "@/components/LoadingWorkflow";
import { SupplyWorkflow } from "@/components/SupplyWorkflow";
import { getAllDeliveries, getUserByUid, getAllTransactions, getAllOilTypes, getUserComplaints, saveComplaint, getAllBranches } from "@/lib/firebase";
import { useUserProfile, useTransactions } from "@/hooks/useFirebaseAPI";

import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string | null;
  role: string;
  displayName: string | null;
  active?: boolean;
}

interface DriverDashboardProps {
  user: User;
}

export default function DriverDashboard({ user }: DriverDashboardProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [isLoadingWorkflowOpen, setIsLoadingWorkflowOpen] = useState(false);
  const [isSupplyWorkflowOpen, setIsSupplyWorkflowOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [todayDeliveryStats, setTodayDeliveryStats] = useState<{[key: string]: number}>({});

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, label: string} | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  
  // Complaint state
  const [complaints, setComplaints] = useState<any[]>([]);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showCreateComplaintModal, setShowCreateComplaintModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    photos: [] as string[]
  });

  useEffect(() => {
    loadDeliveries();
    loadUserProfile();
    loadTransactions();
    loadComplaints();
  }, [user.id]);

  const loadDeliveries = async () => {
    try {
      // Use empty array for now since Firebase access is not working
      // This will be replaced with proper backend API calls
      const userDeliveries: any[] = [];
      setDeliveries(userDeliveries);
      setRecentDeliveries([]);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      // Get all transactions from Firebase
      const allTransactions = await getAllTransactions();
      
      // Filter transactions for current user
      const userTransactions = allTransactions.filter((transaction: any) => 
        transaction.driverId === user.id || transaction.driverUid === user.id
      );
      
      setTransactions(userTransactions);
      
      // Calculate today's delivery stats by oil type
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStats: {[key: string]: number} = {};
      userTransactions.forEach((transaction: any) => {
        const transactionDate = transaction.timestamp?.toDate ? transaction.timestamp.toDate() : new Date(transaction.timestamp);
        if (transactionDate >= today && transaction.type === 'supply') {
          const oilTypeName = transaction.oilTypeName || 'Unknown';
          todayStats[oilTypeName] = (todayStats[oilTypeName] || 0) + (transaction.oilLiters || 0);
        }
      });
      setTodayDeliveryStats(todayStats);
      
      // Get recent transactions (last 10)
      const sortedTransactions = userTransactions
        .sort((a: any, b: any) => {
          const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);
      
      setRecentTransactions(sortedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Fallback to empty arrays on error
      setTransactions([]);
      setRecentTransactions([]);
      setTodayDeliveryStats({});
    }
  };

  const loadComplaints = async () => {
    try {
      const userComplaints = await getUserComplaints(user.id);
      setComplaints(userComplaints);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setComplaints([]);
    }
  };

  const handleSubmitComplaint = async () => {
    try {
      if (!complaintForm.title || !complaintForm.description) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const complaintData = {
        ...complaintForm,
        reportedBy: user.id,
        reporterName: user.displayName || user.email || 'Unknown Driver',
        status: 'open' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        watermarkedPhotos: complaintForm.photos
      };

      await saveComplaint(complaintData);

      toast({
        title: "Complaint Submitted",
        description: "Your complaint has been submitted successfully"
      });

      setShowCreateComplaintModal(false);
      setComplaintForm({
        title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        photos: []
      });
      loadComplaints();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast({
        title: "Error",
        description: "Failed to submit complaint",
        variant: "destructive"
      });
    }
  };

  const loadUserProfile = async () => {
    try {
      // For now use the Replit Auth user data directly
      // Later this will fetch from backend API
      setUserProfile(user);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleLoadingComplete = () => {
    setIsLoadingWorkflowOpen(false);
    loadDeliveries();
    loadTransactions();
    toast({
      title: "Loading Complete",
      description: "Oil loading completed successfully"
    });
  };

  const handleSupplyComplete = () => {
    setIsSupplyWorkflowOpen(false);
    loadDeliveries();
    loadTransactions();
    toast({
      title: "Supply Complete", 
      description: "Oil delivery completed successfully"
    });
  };

  const viewDeliveryDetails = (delivery: any) => {
    setSelectedDelivery(delivery);
    setShowDeliveryModal(true);
  };

  const viewTransactionDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  // Calculate total delivery liters for today by oil type
  const totalTodayDeliveryLiters = Object.values(todayDeliveryStats).reduce((sum, liters) => sum + liters, 0);
  


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
                <p className="text-xs sm:text-sm text-gray-500">Driver Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {userProfile?.displayName || user.displayName || user.email}
                </p>
                <p className="text-xs text-gray-500">{userProfile?.email || user.email}</p>
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
        {/* Main Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TruckIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Loading Oil</h3>
              <p className="text-gray-600 mb-4">
                Start loading oil from the main tank
              </p>
              <Button 
                onClick={() => setIsLoadingWorkflowOpen(true)}
                className="w-full bg-blue-500 hover:bg-blue-600"
                data-testid="button-start-loading"
              >
                Start Loading
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="bg-orange-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <DropletIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Supply Oil</h3>
              <p className="text-gray-600 mb-4">
                Deliver oil to customer locations
              </p>
              <Button 
                onClick={() => setIsSupplyWorkflowOpen(true)}
                className="w-full bg-orange-500 hover:bg-orange-600"
                data-testid="button-start-supply"
              >
                Start Supply
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Deliveries</CardTitle>
              <TruckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTodayDeliveryLiters.toLocaleString()}L</div>
              <div className="text-xs text-muted-foreground space-y-1">
                {Object.keys(todayDeliveryStats).length > 0 ? (
                  Object.entries(todayDeliveryStats).map(([oilType, liters]) => (
                    <div key={oilType} className="flex justify-between">
                      <span>{oilType}:</span>
                      <span className="font-medium">{liters.toLocaleString()}L</span>
                    </div>
                  ))
                ) : (
                  <p>No deliveries completed today</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Complaints</CardTitle>
              <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complaints.length}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Open:</span>
                  <span className="font-medium text-red-600">
                    {complaints.filter(c => c.status === 'open').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>In Progress:</span>
                  <span className="font-medium text-yellow-600">
                    {complaints.filter(c => c.status === 'in-progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Resolved:</span>
                  <span className="font-medium text-green-600">
                    {complaints.filter(c => c.status === 'resolved').length}
                  </span>
                </div>
              </div>
              <Button 
                onClick={() => setShowCreateComplaintModal(true)}
                size="sm" 
                className="w-full mt-3"
                variant="outline"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </CardContent>
          </Card>
        </div>



        {/* Recent Deliveries */}
        {recentDeliveries.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Recent Deliveries (Last 3)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDeliveries.map((delivery, index) => (
                  <div key={delivery.id || index} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">{delivery.oilTypeName || 'Unknown Oil Type'}</div>
                      <div className="text-sm text-gray-600">
                        {delivery.loadedOilLiters}L • Delivered to {delivery.branchName || 'Unknown Branch'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {delivery.completedTimestamp?.toDate ? 
                          delivery.completedTimestamp.toDate().toLocaleDateString() : 
                          'Unknown date'
                        }
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewDeliveryDetails(delivery)}
                      className="flex items-center gap-2"
                      data-testid={`button-view-delivery-${index}`}
                    >
                      <EyeIcon className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Complaints Section */}
        {complaints.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5" />
                My Complaints ({complaints.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complaints.slice(0, 5).map((complaint, index) => (
                  <div key={complaint.id || index} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">{complaint.title}</div>
                      <div className="text-sm text-gray-600 line-clamp-1">
                        {complaint.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={complaint.status === 'open' ? 'destructive' : 
                                   complaint.status === 'in-progress' ? 'default' : 'secondary'}
                        >
                          {complaint.status}
                        </Badge>
                        <Badge variant="outline">
                          {complaint.priority}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {complaint.createdAt?.toDate ? 
                            complaint.createdAt.toDate().toLocaleDateString() : 
                            'Unknown date'
                          }
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setShowComplaintModal(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                ))}
                {complaints.length > 5 && (
                  <div className="text-center text-sm text-gray-500">
                    And {complaints.length - 5} more complaints...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transaction History */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Recent Transactions (Last 10)
            </CardTitle>
            <p className="text-sm text-gray-600">Complete history of loading and supply operations</p>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction, index) => (
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
                        <span className="font-medium">{transaction.oilTypeName || 'Unknown Oil Type'}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {transaction.quantity?.toLocaleString()}L
                        {transaction.type === 'supply' && transaction.branchName && (
                          <> • Delivered to {transaction.branchName}</>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {transaction.timestamp?.toDate ? 
                            transaction.timestamp.toDate().toLocaleString() : 
                            'Unknown date'
                          }
                        </div>
                        {transaction.type === 'supply' && transaction.branchName && (
                          <div>Branch: {transaction.branchName}</div>
                        )}
                        <div>Driver: {userProfile?.displayName || user.displayName || user.email}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewTransactionDetails(transaction)}
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
                <p>No transaction history available</p>
                <p className="text-sm mt-2">Start loading or supplying oil to see your transaction history</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loading Workflow Modal */}
      <Dialog open={isLoadingWorkflowOpen} onOpenChange={setIsLoadingWorkflowOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <LoadingWorkflow onClose={handleLoadingComplete} />
        </DialogContent>
      </Dialog>

      {/* Supply Workflow Modal */}
      <Dialog open={isSupplyWorkflowOpen} onOpenChange={setIsSupplyWorkflowOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <SupplyWorkflow onClose={handleSupplyComplete} />
        </DialogContent>
      </Dialog>

      {/* Delivery Details Modal */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="max-w-2xl">
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Delivery Details</h3>
                <div className="text-sm text-gray-500">
                  {selectedDelivery.completedTimestamp?.toDate ? 
                    selectedDelivery.completedTimestamp.toDate().toLocaleDateString() : 
                    'Unknown date'
                  }
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Oil Type</label>
                  <p className="font-medium">{selectedDelivery.oilTypeName || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="font-medium">{selectedDelivery.loadedOilLiters}L</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Branch</label>
                  <p className="font-medium">{selectedDelivery.branchName || 'Unknown Branch'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Delivery Order</label>
                  <p className="font-medium">{selectedDelivery.deliveryOrderNo || 'N/A'}</p>
                </div>
              </div>

              {/* Photos */}
              {(selectedDelivery.meterReadingPhoto || selectedDelivery.tankLevelPhoto || selectedDelivery.finalTankLevelPhoto) && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Photos</label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDelivery.meterReadingPhoto && (
                      <div className="text-center">
                        <img 
                          src={selectedDelivery.meterReadingPhoto} 
                          alt="Meter Reading" 
                          className="w-full h-20 object-cover rounded border"
                        />
                        <p className="text-xs text-gray-500 mt-1">Meter Reading</p>
                      </div>
                    )}
                    {selectedDelivery.tankLevelPhoto && (
                      <div className="text-center">
                        <div className="relative group cursor-pointer"
                             onClick={() => {
                               setSelectedPhoto({
                                 url: selectedDelivery.tankLevelPhoto,
                                 label: 'Tank Level Photo'
                               });
                               setShowPhotoModal(true);
                             }}>
                          <img 
                            src={selectedDelivery.tankLevelPhoto} 
                            alt="Tank Level" 
                            className="w-full h-20 object-cover rounded border hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                            <EyeIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Tank Level</p>
                      </div>
                    )}
                    {selectedDelivery.finalTankLevelPhoto && (
                      <div className="text-center">
                        <div className="relative group cursor-pointer"
                             onClick={() => {
                               setSelectedPhoto({
                                 url: selectedDelivery.finalTankLevelPhoto,
                                 label: 'Final Tank Level Photo'
                               });
                               setShowPhotoModal(true);
                             }}>
                          <img 
                            src={selectedDelivery.finalTankLevelPhoto} 
                            alt="Final Tank Level" 
                            className="w-full h-20 object-cover rounded border hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                            <EyeIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Final Tank Level</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            View detailed information about this transaction including photos and metadata
          </DialogDescription>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transaction Details</h3>
                <div className="text-sm text-gray-500">
                  {selectedTransaction.timestamp?.toDate ? 
                    selectedTransaction.timestamp.toDate().toLocaleString() : 
                    'Unknown date'
                  }
                </div>
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
                  <p className="font-medium">{selectedTransaction.oilTypeName || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="font-medium">{selectedTransaction.quantity?.toLocaleString()}L</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Driver</label>
                  <p className="font-medium">
                    {userProfile?.displayName || user.displayName || user.email}
                  </p>
                </div>
                {selectedTransaction.type === 'supply' && selectedTransaction.branchName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Branch</label>
                    <p className="font-medium">{selectedTransaction.branchName}</p>
                    {selectedTransaction.branchAddress && (
                      <p className="text-sm text-gray-500">{selectedTransaction.branchAddress}</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Date & Time</label>
                  <p className="font-medium">
                    {selectedTransaction.timestamp?.toDate ? 
                      selectedTransaction.timestamp.toDate().toLocaleString() : 
                      'Unknown date'
                    }
                  </p>
                </div>
                {selectedTransaction.loadSessionId && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Load Session ID</label>
                    <p className="font-medium text-xs">{selectedTransaction.loadSessionId}</p>
                  </div>
                )}
                {selectedTransaction.startMeterReading && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Meter Reading</label>
                    <p className="font-medium">{selectedTransaction.startMeterReading}</p>
                  </div>
                )}
                {selectedTransaction.endMeterReading && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Meter Reading</label>
                    <p className="font-medium">{selectedTransaction.endMeterReading}</p>
                  </div>
                )}
                {selectedTransaction.meterReading && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Meter Reading</label>
                    <p className="font-medium">{selectedTransaction.meterReading}</p>
                  </div>
                )}
              </div>

              {/* Photos */}
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

      {/* Create Complaint Modal */}
      <Dialog open={showCreateComplaintModal} onOpenChange={setShowCreateComplaintModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Describe the issue you're experiencing. Add photos for evidence if needed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="complaint-title">Issue Title *</Label>
              <Input
                id="complaint-title"
                value={complaintForm.title}
                onChange={(e) => setComplaintForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <Label htmlFor="complaint-description">Description *</Label>
              <Textarea
                id="complaint-description"
                value={complaintForm.description}
                onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the issue"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={complaintForm.category} onValueChange={(value) => setComplaintForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment">Equipment Issue</SelectItem>
                    <SelectItem value="delivery">Delivery Problem</SelectItem>
                    <SelectItem value="safety">Safety Concern</SelectItem>
                    <SelectItem value="customer">Customer Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={complaintForm.priority} onValueChange={(value) => setComplaintForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowCreateComplaintModal(false);
                setComplaintForm({
                  title: '',
                  description: '',
                  category: 'other',
                  priority: 'medium',
                  photos: []
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleSubmitComplaint}>
                Submit Complaint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Complaint Modal */}
      <Dialog open={showComplaintModal} onOpenChange={setShowComplaintModal}>
        <DialogContent className="max-w-3xl">
          {selectedComplaint && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-xl">{selectedComplaint.title}</DialogTitle>
                    <DialogDescription>
                      Complaint #{selectedComplaint.id} • Reported on {selectedComplaint.createdAt?.toDate ? selectedComplaint.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                    </DialogDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge 
                      variant={selectedComplaint.status === 'open' ? 'destructive' : 
                               selectedComplaint.status === 'in-progress' ? 'default' : 'secondary'}
                    >
                      {selectedComplaint.status}
                    </Badge>
                    <Badge variant="outline">
                      {selectedComplaint.priority}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="mt-1">{selectedComplaint.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Category</Label>
                    <p className="mt-1 capitalize">{selectedComplaint.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Priority</Label>
                    <p className="mt-1 capitalize">{selectedComplaint.priority}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <p className="mt-1 capitalize">{selectedComplaint.status.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                    <p className="mt-1">{selectedComplaint.updatedAt?.toDate ? selectedComplaint.updatedAt.toDate().toLocaleDateString() : 'Unknown date'}</p>
                  </div>
                </div>

                {selectedComplaint.resolution && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium text-gray-600">Resolution</Label>
                    <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded">
                      <p>{selectedComplaint.resolution}</p>
                      {selectedComplaint.resolvedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Resolved on {selectedComplaint.resolvedAt.toDate ? selectedComplaint.resolvedAt.toDate().toLocaleString() : 'Unknown date'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedComplaint.watermarkedPhotos && selectedComplaint.watermarkedPhotos.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Photo Evidence ({selectedComplaint.watermarkedPhotos.length})
                    </Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {selectedComplaint.watermarkedPhotos.map((photo: string, index: number) => (
                        <div key={index} className="relative">
                          <img 
                            src={photo} 
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedPhoto({
                                url: photo,
                                label: `Evidence ${index + 1}`
                              });
                              setShowPhotoModal(true);
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                            <EyeIcon className="h-4 w-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
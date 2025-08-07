import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wifi, WifiOff, Download, Upload, Settings, Clock } from "lucide-react";

export default function EsslIntegrationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deviceForm, setDeviceForm] = useState({
    deviceName: "",
    ipAddress: "",
    port: "4370",
    locationId: "",
    serialNumber: "",
    model: ""
  });

  // Fetch locations for device assignment
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
  });

  // Fetch eSSL devices
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["/api/essl/devices"],
  });

  // Fetch raw punch data
  const { data: rawPunchData = [] } = useQuery({
    queryKey: ["/api/essl/raw-punch"],
  });

  // Add device mutation
  const addDeviceMutation = useMutation({
    mutationFn: async (deviceData: typeof deviceForm) => {
      const response = await apiRequest("POST", "/api/essl/devices", deviceData);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "eSSL device added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/essl/devices"] });
      setDeviceForm({
        deviceName: "",
        ipAddress: "",
        port: "4370",
        locationId: "",
        serialNumber: "",
        model: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add device",
        variant: "destructive",
      });
    },
  });

  // Sync device mutation
  const syncDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await apiRequest("POST", `/api/essl/devices/${deviceId}/sync`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Device sync completed" });
      queryClient.invalidateQueries({ queryKey: ["/api/essl/raw-punch"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Error",
        description: error.message || "Failed to sync device",
        variant: "destructive",
      });
    },
  });

  // Process raw data mutation
  const processDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/essl/process-data", {});
      return await response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Success", 
        description: `Processed ${data.recordsProcessed} punch records` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/essl/raw-punch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process data",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setDeviceForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceForm.deviceName || !deviceForm.ipAddress || !deviceForm.locationId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addDeviceMutation.mutate(deviceForm);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">eSSL Integration</h1>
        <p className="text-gray-600 mt-2">
          Manage eSSL biometric devices and synchronize attendance data
        </p>
      </div>

      {/* Add Device Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Add New eSSL Device
          </CardTitle>
          <CardDescription>
            Configure a new eSSL biometric device for attendance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddDevice} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name *</Label>
                <Input
                  id="deviceName"
                  placeholder="Main Gate Device"
                  value={deviceForm.deviceName}
                  onChange={(e) => handleInputChange("deviceName", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address *</Label>
                <Input
                  id="ipAddress"
                  placeholder="192.168.1.100"
                  value={deviceForm.ipAddress}
                  onChange={(e) => handleInputChange("ipAddress", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  placeholder="4370"
                  value={deviceForm.port}
                  onChange={(e) => handleInputChange("port", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  placeholder="SN123456789"
                  value={deviceForm.serialNumber}
                  onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="eSSL K30 Pro"
                  value={deviceForm.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationId">Location *</Label>
              <Select 
                value={deviceForm.locationId} 
                onValueChange={(value) => handleInputChange("locationId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location: any) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              disabled={addDeviceMutation.isPending}
              className="w-full md:w-auto"
            >
              {addDeviceMutation.isPending ? "Adding..." : "Add Device"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Devices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Registered Devices
          </CardTitle>
          <CardDescription>
            Manage your eSSL biometric devices and sync data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading devices...</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No devices registered yet. Add your first eSSL device above.
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device: any) => (
                <div key={device.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {device.isActive ? (
                        <Wifi className="h-5 w-5 text-green-500" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <h3 className="font-medium">{device.deviceName}</h3>
                        <p className="text-sm text-gray-600">
                          {device.ipAddress}:{device.port}
                        </p>
                        {device.lastSync && (
                          <p className="text-xs text-gray-500">
                            Last sync: {new Date(device.lastSync).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={device.isActive ? "default" : "secondary"}>
                        {device.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => syncDeviceMutation.mutate(device.id)}
                        disabled={syncDeviceMutation.isPending}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Sync
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw Punch Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Raw Punch Data
            </div>
            <Button
              onClick={() => processDataMutation.mutate()}
              disabled={processDataMutation.isPending}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-1" />
              Process Data
            </Button>
          </CardTitle>
          <CardDescription>
            Unprocessed attendance data from eSSL devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rawPunchData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No unprocessed punch data available
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {rawPunchData.map((punch: any) => (
                <div key={punch.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Employee ID: {punch.employeeId}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(punch.punchTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={punch.punchType === 'IN' ? 'default' : 'outline'}>
                      {punch.punchType}
                    </Badge>
                    <Badge variant={punch.isProcessed ? 'default' : 'secondary'}>
                      {punch.isProcessed ? 'Processed' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
          <CardDescription>
            How to set up and configure your eSSL devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">1. Network Configuration</h4>
              <p className="text-gray-600">
                Ensure your eSSL device is connected to the same network and accessible via IP address.
              </p>
            </div>
            <div>
              <h4 className="font-medium">2. Device Setup</h4>
              <p className="text-gray-600">
                Configure the device with employee IDs that match your system. Enable network communication.
              </p>
            </div>
            <div>
              <h4 className="font-medium">3. Data Synchronization</h4>
              <p className="text-gray-600">
                Use the Sync button to pull attendance data from devices. Process raw data to create attendance records.
              </p>
            </div>
            <div>
              <h4 className="font-medium">4. Employee Mapping</h4>
              <p className="text-gray-600">
                Ensure employee records have matching eSSL Employee IDs for automatic processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
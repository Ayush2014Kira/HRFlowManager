import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Clock, Users, Activity, Plus, Navigation } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function FieldTrackingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isStartVisitDialogOpen, setIsStartVisitDialogOpen] = useState(false);
  const [visitForm, setVisitForm] = useState({
    clientName: "",
    purpose: "",
    notes: "",
  });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Get current GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          // Get readable address (using reverse geocoding API if available)
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${location.latitude}+${location.longitude}&key=demo&limit=1`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
              location.address = data.results[0].formatted;
            }
          } catch (error) {
            console.log("Could not get address");
          }

          setCurrentLocation(location);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Could not get your current location. Please enable GPS.",
            variant: "destructive",
          });
        }
      );
    }
  }, []);

  // Fetch active field visits
  const { data: activeVisits = [] } = useQuery({
    queryKey: ["/api/field-visits/active", currentUser.employeeId],
    enabled: !!currentUser.employeeId,
  });

  // Fetch completed field visits
  const { data: completedVisits = [] } = useQuery({
    queryKey: ["/api/field-visits/completed", currentUser.employeeId],
    enabled: !!currentUser.employeeId,
  });

  // Start new field visit
  const startVisitMutation = useMutation({
    mutationFn: async (visitData: any) => {
      return fetch("/api/field-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...visitData,
          employeeId: currentUser.employeeId,
          startLocation: currentLocation ? `${currentLocation.latitude},${currentLocation.longitude}` : null,
          startAddress: currentLocation?.address,
        }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Visit Started",
        description: "Field visit has been started successfully.",
      });
      setIsStartVisitDialogOpen(false);
      setVisitForm({ clientName: "", purpose: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/field-visits"] });
    },
  });

  // End field visit
  const endVisitMutation = useMutation({
    mutationFn: async (visitId: string) => {
      return fetch(`/api/field-visits/${visitId}/end`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endLocation: currentLocation ? `${currentLocation.latitude},${currentLocation.longitude}` : null,
          endAddress: currentLocation?.address,
        }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Visit Completed",
        description: "Field visit has been completed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/field-visits"] });
    },
  });

  const handleStartVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitForm.clientName || !visitForm.purpose) {
      toast({
        title: "Validation Error",
        description: "Please fill in client name and purpose",
        variant: "destructive",
      });
      return;
    }
    startVisitMutation.mutate(visitForm);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Work Tracking</h1>
          <p className="text-gray-600">Track your field visits and client meetings</p>
        </div>
        <Dialog open={isStartVisitDialogOpen} onOpenChange={setIsStartVisitDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Start Visit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Field Visit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleStartVisit} className="space-y-4">
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={visitForm.clientName}
                  onChange={(e) => setVisitForm({ ...visitForm, clientName: e.target.value })}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={visitForm.purpose}
                  onChange={(e) => setVisitForm({ ...visitForm, purpose: e.target.value })}
                  placeholder="e.g., Sales meeting, Support visit"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                  placeholder="Additional notes about the visit"
                  rows={3}
                />
              </div>
              {currentLocation && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center text-green-700">
                    <Navigation className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">GPS Location Captured</span>
                  </div>
                  {currentLocation.address && (
                    <p className="text-sm text-green-600 mt-1">{currentLocation.address}</p>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={startVisitMutation.isPending}>
                  {startVisitMutation.isPending ? "Starting..." : "Start Visit"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsStartVisitDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentLocation ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Coordinates: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
              {currentLocation.address && (
                <p className="text-sm font-medium">{currentLocation.address}</p>
              )}
              <Badge variant="outline" className="text-green-600">
                GPS Active
              </Badge>
            </div>
          ) : (
            <div className="text-center py-4">
              <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Getting your location...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Visits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Active Visits
          </CardTitle>
          <CardDescription>
            Your ongoing field visits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeVisits.length > 0 ? (
            <div className="space-y-4">
              {activeVisits.map((visit: any) => (
                <div key={visit.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{visit.clientName}</h3>
                      <p className="text-sm text-gray-600">{visit.purpose}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        Started at {formatTime(visit.startTime)}
                      </div>
                      {visit.startAddress && (
                        <p className="text-sm text-gray-500">{visit.startAddress}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => endVisitMutation.mutate(visit.id)}
                      disabled={endVisitMutation.isPending}
                      size="sm"
                    >
                      End Visit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No active visits</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Completed Visits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Recent Visits
          </CardTitle>
          <CardDescription>
            Your completed field visits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedVisits.length > 0 ? (
            <div className="space-y-4">
              {completedVisits.map((visit: any) => (
                <div key={visit.id} className="border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{visit.clientName}</h3>
                      <Badge variant="outline" className="text-green-600">
                        Completed
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{visit.purpose}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(visit.startTime)} • {formatTime(visit.startTime)} - {formatTime(visit.endTime)}
                    </div>
                    {visit.distance && (
                      <p className="text-sm text-gray-500">Distance: {visit.distance} km</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No completed visits yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
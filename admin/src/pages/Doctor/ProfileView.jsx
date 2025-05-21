import React, { useEffect, useState, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarClock, FileText, Mail, MapPin, Edit } from "lucide-react";
import Doctorsidebar from "../../components/ui/Doctorsidebar";
import Doctornavbar from "../../components/ui/Doctornavbar";
import { DoctorContext } from "../../context/DoctorContext";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const EditProfileModal = ({ isOpen, onClose, doctorProfile, onUpdate }) => {
  const { backendUrl, dToken } = useContext(DoctorContext);
  const [formData, setFormData] = useState({
    email: "",
    addressLine1: "",
    addressLine2: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (doctorProfile) {
      console.log("Setting initial form data:", doctorProfile);
      setFormData({
        email: doctorProfile.email || "",
        addressLine1: doctorProfile.address?.addressLine1 || "",
        addressLine2: doctorProfile.address?.addressLine2 || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [doctorProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("Form field changed:", name, value);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    console.log("Validating form data:", formData);

    // Email validation (only if changed)
    if (formData.email && formData.email !== doctorProfile.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        console.log("Email validation failed: Invalid email format");
        toast.error("Please enter a valid email address", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return false;
      }
    }

    // Password validation (only if trying to change password)
    const hasCurrentPassword = !!formData.currentPassword;
    const hasNewPassword = !!formData.newPassword;
    const hasConfirmPassword = !!formData.confirmPassword;

    console.log("Password fields status:", {
      hasCurrentPassword,
      hasNewPassword,
      hasConfirmPassword,
    });

    // If any password field is filled, validate all password fields
    if (hasCurrentPassword || hasNewPassword || hasConfirmPassword) {
      // If only current password is filled, clear it and continue
      if (hasCurrentPassword && !hasNewPassword && !hasConfirmPassword) {
        console.log("Only current password provided, clearing password fields");
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        return true;
      }

      // If any password field is filled but not all, show error
      if (!hasCurrentPassword || !hasNewPassword || !hasConfirmPassword) {
        console.log("Password validation failed: Incomplete password fields");
        toast.error("Please fill in all password fields to change password", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return false;
      }

      // If all password fields are filled, validate them
      if (formData.newPassword.length < 6) {
        console.log("Password validation failed: New password is too short");
        toast.error("New password must be at least 6 characters long", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return false;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        console.log("Password validation failed: Passwords do not match");
        toast.error("New passwords do not match", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return false;
      }
    }

    console.log("Form validation passed");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission started");

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {};

      // Only include email if it's changed
      if (formData.email !== doctorProfile.email) {
        updateData.email = formData.email;
      }

      // Only include address if it's changed
      if (
        formData.addressLine1 !== doctorProfile.address?.addressLine1 ||
        formData.addressLine2 !== doctorProfile.address?.addressLine2
      ) {
        updateData.address = {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
        };
      }

      // Only include password fields if they're being changed
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // If no fields have changed, show message and return
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes detected", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        onClose();
        return;
      }

      console.log(
        "Sending request to:",
        `${backendUrl}/api/doctor/update-profile`,
      );
      console.log("Request data:", updateData);

      const response = await axios.put(
        `${backendUrl}/api/doctor/update-profile`,
        updateData,
        {
          headers: {
            Authorization: dToken,
          },
        },
      );

      console.log("API Response:", response.data);

      if (response.data.success) {
        toast.success("Profile updated successfully", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        onUpdate(response.data.doctor);
        onClose();
      } else {
        toast.error(response.data.message || "Failed to update profile", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage =
        "An unexpected error occurred. Please try again later.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid input data. Please check your entries.";
      } else if (error.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You are not authorized to perform this action.";
      } else if (error.response?.status === 404) {
        errorMessage = "Profile not found.";
      }

      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile information. Click save when you're
            done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input
              id="addressLine1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium mb-4">Change Password</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ProfileView = () => {
  const { backendUrl, dToken } = useContext(DoctorContext);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [totalPatientsCount, setTotalPatientsCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/doctor/profile`, {
          headers: { Authorization: dToken },
        });

        if (response.data.success) {
          console.log("Data before setting doctorProfile state:", response.data.doctor);
          const fetchedDoctorData = response.data.doctor;

          // Create a copy of statistics to ensure immutability before accessing nested properties
          const statisticsData = { ...fetchedDoctorData.statistics };

          // Update both the main doctorProfile state and the separate totalPatientsCount state
          setDoctorProfile({
            ...fetchedDoctorData,
            statistics: statisticsData || {},
            recentFeedbacks: fetchedDoctorData.recentFeedbacks || []
          });

          // Use the copied statisticsData to set the totalPatientsCount state
          if (statisticsData?.totalPatients !== undefined) {
            console.log("Content of fetchedDoctorData.statistics:", fetchedDoctorData.statistics);
            console.log("Value of fetchedDoctorData.statistics?.totalPatients before condition:", fetchedDoctorData.statistics?.totalPatients);
            setTotalPatientsCount(statisticsData.totalPatients);
            console.log("totalPatientsCount state set to:", statisticsData.totalPatients);
          } else {
            setTotalPatientsCount(0); // Set to 0 if totalPatients is unexpectedly undefined
            console.log("totalPatientsCount state set to 0 (undefined data)");
          }

          console.log("State value immediately after setDoctorProfile:", doctorProfile?.statistics?.totalPatients);
          console.log("Doctor profile data fetched:", response.data.doctor);
        } else {
          toast.error(response.data.message || "Failed to fetch profile");
        }
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again");
          navigate("/login");
        } else {
          toast.error(
            error.response?.data?.message || "Failed to fetch profile",
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (dToken) {
      fetchDoctorProfile();
    } else {
      toast.error("Please login to view profile");
      navigate("/login");
    }
  }, [backendUrl, dToken, navigate]);

  // Effect to monitor doctorProfile changes and log totalPatients
  useEffect(() => {
    if (doctorProfile) {
      console.log("doctorProfile state updated. Total Patients:", doctorProfile.statistics?.totalPatients);
    }
  }, [doctorProfile]);

  const handleProfileUpdate = async (updatedData) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/doctor/update-profile`,
        updatedData,
        {
          headers: { Authorization: dToken },
        },
      );

      if (response.data.success) {
        setDoctorProfile(response.data.doctor);
        toast.success("Profile updated successfully");
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  console.log("Total Patients value:", doctorProfile?.statistics?.totalPatients);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Doctorsidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Doctornavbar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="animate-pulse">
              <div className="mb-6">
                <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Card className="h-full">
                    <CardContent className="space-y-6">
                      <div className="flex justify-center">
                        <div className="h-24 w-24 rounded-full bg-gray-200"></div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-4 w-full bg-gray-200 rounded"></div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                        <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Doctorsidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Doctornavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
              <p className="text-gray-600">
                View and manage your professional information
              </p>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </Button>
          </div>

          {/* FIXED LAYOUT START */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center mb-8">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage
                        src={doctorProfile?.image}
                        alt={doctorProfile?.name}
                      />
                      <AvatarFallback className="bg-medical-primary text-white text-xl">
                        {doctorProfile?.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {doctorProfile?.name}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Email
                        </p>
                        <p className="text-gray-900">{doctorProfile?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Address
                        </p>
                        <div className="text-gray-900">
                          {doctorProfile?.address ? (
                            <div className="flex flex-wrap gap-4">
                              {doctorProfile.address.addressLine1 ||
                                "Address line 1 not set"}
                              {doctorProfile.address.addressLine2
                                ? `, ${doctorProfile.address.addressLine2}`
                                : ""}
                            </div>
                          ) : (
                            <p>Address not set</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center">
                    <div className="h-8 w-8 rounded-full bg-medical-primary text-white flex items-center justify-center mr-3 font-bold">
                      NPR
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Payment</p>
                      <p className="text-2xl font-bold">
                        NPR {doctorProfile?.totalPayment || 0}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center">
                    <FileText className="h-8 w-8 text-medical-primary mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Total Patients</p>
                      <p className="text-2xl font-bold">
                        {totalPatientsCount}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center">
                    <div className="h-8 w-8 rounded-full bg-medical-primary text-white flex items-center justify-center mr-3 font-bold">
                      {doctorProfile?.statistics?.averageRating || "0"}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Rating ({doctorProfile?.statistics?.totalRatings || 0})</p>
                      <div className="flex text-yellow-400">
                        {"★".repeat(
                          Math.floor(doctorProfile?.statistics?.averageRating || 0),
                        )}
                        {doctorProfile?.statistics?.averageRating % 1 !== 0 && doctorProfile?.statistics?.averageRating > 0 && "☆"}
                        {"☆".repeat(
                          5 - Math.ceil(doctorProfile?.statistics?.averageRating || 0),
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!doctorProfile?.recentFeedbacks?.length ? (
                      <p className="text-center text-gray-500">
                        No feedback yet
                      </p>
                    ) : (
                      doctorProfile.recentFeedbacks.map((feedback, index) => (
                        <div
                          key={index}
                          className="border-b pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {feedback.userName}
                                </p>
                                <span className="text-xs text-gray-400">
                                  {new Date(
                                    feedback.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {feedback.comment}
                              </p>
                            </div>
                            <div className="flex text-yellow-400">
                              {"★".repeat(feedback.rating)}
                              {"☆".repeat(5 - feedback.rating)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* FIXED LAYOUT END */}
        </main>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        doctorProfile={doctorProfile}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default ProfileView;

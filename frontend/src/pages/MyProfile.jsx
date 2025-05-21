import { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";

const MyProfile = () => {
  const [userData, setUserData] = useState({
    name: "",
    image: assets.profile,
    email: "",
    phone: "",
    address: {
      line1: "",
      line2: "",
    },
    gender: "",
    dob: ""
  });
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/user/get-profile", {
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });
        console.log("Profile API response:", res.data);
        if (res.data.success && res.data.userData) {
          const user = res.data.userData;
          setUserData({
            name: user.name || "",
            image: user.image && user.image !== "Not Selected" && user.image !== "" ? user.image : assets.profile,
            email: user.email || "",
            phone: user.phone || "",
            address: {
              line1: user.address?.line1 || "",
              line2: user.address?.line2 || ""
            },
            gender: user.gender && user.gender !== "Not Selected" ? user.gender : "",
            dob: user.dob && user.dob !== "Not Selected" && user.dob !== "" ? (user.dob.length >= 10 ? user.dob.substring(0, 10) : user.dob) : ""
          });
        } else {
          setError("Failed to load profile");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Error fetching profile");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Save profile handler
  const handleSave = async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "/api/user/update-profile",
        {
          name: userData.name,
          image: userData.image,
          phone: userData.phone,
          address: userData.address,
          gender: userData.gender,
          dob: userData.dob
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`
          } 
        }
      );
      if (res.data.success && res.data.user) {
        // Update UI immediately
        const user = res.data.user;
        setUserData({
          name: user.name || "",
          image: user.image || assets.profile,
          email: user.email || "",
          phone: user.phone || "",
          address: {
            line1: user.address?.line1 || "",
            line2: user.address?.line2 || ""
          },
          gender: user.gender || "",
          dob: user.dob ? user.dob.substring(0, 10) : ""
        });
        setIsEdit(false);
      } else {
        setError(res.data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Error updating profile");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem("token");
      const res = await axios.post('/api/user/upload-profile-image', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setUserData(prev => ({
          ...prev,
          image: res.data.imageUrl
        }));
      } else {
        setError(res.data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 flex">
      <div className="w-2/3 pr-8">
        <h2 className="text-2xl font-bold mb-6">My Profile</h2>
        <div className="border-b pb-4 mb-4 space-y-3">
          <h3 className="text-lg font-semibold">Contact Information</h3>
          <div className="space-y-1">
            <p className="text-gray-600">Email:</p>
            <p className="text-gray-800">{userData.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600">Phone:</p>
            {isEdit ? (
              <input
                type="text"
                value={userData.phone}
                onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))}
                className="p-2 border rounded-lg w-full"
              />
            ) : (
              <p className="text-gray-800">{userData.phone}</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-gray-600">Address:</p>
            {isEdit ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={userData.address.line1}
                  onChange={(e) => setUserData((prev) => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))}
                  className="p-2 border rounded-lg w-full"
                />
                <input
                  type="text"
                  value={userData.address.line2}
                  onChange={(e) => setUserData((prev) => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))}
                  className="p-2 border rounded-lg w-full"
                />
              </div>
            ) : (
              <p className="text-gray-800">{userData.address.line1}, {userData.address.line2}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <div className="space-y-2">
            <p className="text-gray-600">Gender:</p>
            {isEdit ? (
              <select
                onChange={(e) => setUserData((prev) => ({ ...prev, gender: e.target.value }))}
                value={userData.gender}
                className="p-2 border rounded-lg w-full"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-gray-800">{userData.gender}</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-gray-600">Birthday:</p>
            {isEdit ? (
              <input
                type="date"
                onChange={(e) => setUserData((prev) => ({ ...prev, dob: e.target.value }))}
                value={userData.dob}
                className="p-2 border rounded-lg w-full"
              />
            ) : (
              <p className="text-gray-800">{userData.dob}</p>
            )}
          </div>
        </div>
      </div>

      <div className="w-1/3 flex flex-col items-center">
        <div className="relative">
          <img src={userData.image} alt="Profile" className="w-32 h-32 rounded-full border-4 border-gray-200 object-cover" />
          {isEdit && (
            <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </label>
          )}
        </div>
        {isEdit ? (
          <input
            type="text"
            value={userData.name}
            onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
            className="mt-4 p-2 border rounded-lg w-full text-center"
          />
        ) : (
          <p className="text-xl font-semibold mt-4">{userData.name}</p>
        )}
        <div className="mt-auto pt-4">
          {error && (
            <div className="mb-2 text-red-500 text-center">{error}</div>
          )}
          <button
            onClick={() => {
              if (isEdit) handleSave();
              else setIsEdit(true);
            }}
            disabled={loading || uploading}
            className={`px-4 py-2 rounded-lg font-semibold text-white ${(loading || uploading) ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'} transition`}
          >
            {isEdit ? "Save Information" : loading ? "Loading..." : "Edit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;

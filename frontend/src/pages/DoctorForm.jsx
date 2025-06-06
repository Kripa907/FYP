import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DoctorForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    speciality: "",
    degree: "",
    experience: "",
    about: "",
    fees: "",
    licenseNumber: "",
    addressLine1: "",
    addressLine2: "",
    certificate: null,
    license: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    try {
      const response = await fetch("http://localhost:4001/api/doctor/apply-doctor", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();
      if (response.ok) {
        navigate("/submission");
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="w-full px-4 py-6 mx-auto my-8 bg-white rounded-lg shadow-lg border border-gray-300" style={{ maxHeight: "90vh", overflowY: "auto" }}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Doctor Application Form</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Full Name</label>
              <input 
                type="text" 
                name="name" 
                className="w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleChange} 
                placeholder="Dr. John Doe"
                required 
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input 
                type="email" 
                name="email" 
                className="w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleChange} 
                placeholder="doctor@example.com"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <input 
                type="password" 
                name="password" 
                className="w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleChange} 
                placeholder="Create a secure password"
                required 
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Medical License Number</label>
              <input 
                type="text" 
                name="licenseNumber" 
                className="w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleChange} 
                placeholder="Enter your medical license or registration number"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Speciality</label>
              <input 
                type="text" 
                name="speciality" 
                className="w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleChange} 
                placeholder="e.g. Cardiology, Dermatology"
                required 
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Degree</label>
              <input 
                type="text" 
                name="degree" 
                className="w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleChange} 
                placeholder="e.g. MD, MBBS, MS"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Years of Experience</label>
              <input 
                type="number" 
                name="experience" 
                className="w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleChange} 
                placeholder="e.g. 5"
                required 
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Consultation Fees</label>
              <input 
                type="number" 
                name="fees" 
                className="w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleChange} 
                placeholder="e.g. 100"
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Tell us about yourself</label>
            <textarea 
              name="about" 
              className="w-full border border-gray-300 rounded-lg p-3 min-h-32" 
              onChange={handleChange} 
              placeholder="Share your professional background, approach to patient care, and any specialized treatments you offer..."
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Address Line 1</label>
              <input 
                type="text" 
                name="addressLine1" 
                className="w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleChange} 
                placeholder="Street address, Building, etc."
                required 
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Address Line 2</label>
              <input 
                type="text" 
                name="addressLine2" 
                className="w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleChange} 
                placeholder="City, State, ZIP code"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Upload Certification</label>
              <input 
                type="file" 
                name="certificate"
                className="block w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleFileChange} 
                required 
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Upload Professional License</label>
              <input 
                type="file" 
                name="license"
                className="block w-full border border-gray-300 rounded-lg p-3" 
                onChange={handleFileChange} 
                required 
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              type="submit" 
              className="w-1/4 bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorForm
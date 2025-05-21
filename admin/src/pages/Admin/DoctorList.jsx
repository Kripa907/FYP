// import React from 'react'
// import { useEffect } from 'react'
// import { useContext } from 'react'
// import { AdminContext } from '../../context/AdminContext'

// const DoctorList = () => {

//   const { doctors, aToken, getAllDoctors } = useContext(AdminContext)

//   useEffect(() => {
//     if (aToken) {
//       getAllDoctors()
//     }
//   }, [aToken])

//   return (
//     <div className='m-5 max-h-[90vh] overflow-y-scroll'>
//       <h1 className='text-lg font-medium'>All Doctors</h1>
//       <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
//         {
//           doctors.map((item,index)=>(
//             <div className='border border-indigo-200 rounded-xl max-w-56 overflow-hiddden cursor-pointer group' key={index}>
//               <img className='bg-indigo-50 group-hover:bg-primary transtition-all duration-500' src={item.image} alt="" />
//               <div>
//                 <p className='text-neutral-800 text-lg font-medium'>{item.name}</p>
//                 <p className='text-zinc-600 text-sm'>{item.speciality}</p>
//                 <div className='mt-2 flex items-center gap-1 text-sm'>
//                   <input type="checkbox" checked={item.available}/>
//                   <p>Available</p>
//                 </div>
//               </div>
//             </div>
//           ))
//         }
//       </div>
//     </div>
//   )
// }

// export default DoctorList

import React, { useState } from 'react'
import { useEffect } from 'react'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'

const DoctorList = () => {
  const { doctors, aToken, getAllDoctors, deleteDoctor, updateDoctor } = useContext(AdminContext)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [currentDoctor, setCurrentDoctor] = useState(null)
  const [editedDoctor, setEditedDoctor] = useState({
    name: '',
    specialty: '',
    location: '', // Combined string for UI only
    addressLine1: '',
    addressLine2: '',
  })

  useEffect(() => {
    if (aToken) {
      getAllDoctors()
    }
  }, [aToken])

  // Filter out pending doctors
  const approvedDoctors = doctors.filter(doctor => doctor.status !== 'pending')

  const handleEditClick = (doctor) => {
    setCurrentDoctor(doctor)
    // Split location for editing if available
    let addressLine1 = '';
    let addressLine2 = '';
    if (doctor.location) {
      const parts = doctor.location.split(',').map(p => p.trim());
      addressLine1 = parts[0] || '';
      addressLine2 = parts[1] || '';
    } else if (doctor.address) {
      addressLine1 = doctor.address.addressLine1 || doctor.address.line1 || '';
      addressLine2 = doctor.address.addressLine2 || doctor.address.line2 || '';
    }
    setEditedDoctor({
      name: doctor.name,
      specialty: doctor.specialty || doctor.speciality || '',
      location: [addressLine1, addressLine2].filter(Boolean).join(', '),
      addressLine1,
      addressLine2,
    })
    setEditModalOpen(true)
  }

  const handleDeleteClick = (doctor) => {
    setCurrentDoctor(doctor)
    setDeleteModalOpen(true)
  }

  const handleSaveChanges = async () => {
    // Prepare the updated doctor object
    const updateData = {
      name: editedDoctor.name,
      specialty: editedDoctor.specialty, // always send 'specialty'
      address: {
        addressLine1: editedDoctor.addressLine1,
        addressLine2: editedDoctor.addressLine2
      }
    }
    const success = await updateDoctor(currentDoctor._id, updateData)
    if (success) {
      setEditModalOpen(false)
      await getAllDoctors() // Refresh the doctor list from backend
    }
  }

  const handleConfirmDelete = () => {
    deleteDoctor(currentDoctor._id)
    setDeleteModalOpen(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditedDoctor(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className='m-5'>
      <h1 className='text-lg font-medium mb-4'>All Doctors</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {approvedDoctors.map((doctor, index) => (
              <tr key={doctor._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={doctor.image} alt={doctor.name} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                      <div className="text-sm text-gray-500">{doctor.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{doctor.specialty || doctor.speciality}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{doctor.location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleEditClick(doctor)}
                    className="text-green-600 hover:text-green-900 mr-3"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(doctor)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {approvedDoctors.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No approved doctors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Doctor Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editedDoctor.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Specialty</label>
                <input
                  type="text"
                  name="specialty"
                  value={editedDoctor.specialty}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={editedDoctor.addressLine1}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={editedDoctor.addressLine2}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {currentDoctor?.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorList
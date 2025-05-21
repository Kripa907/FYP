

const MedicalRecords = () => {
  const records = [
    {
      title: "Kripa Gurung",
      date: "April 2, 2025",
      doctor: "Dr. Sarah Johnson",
      type: "view",
      link: "#"
    },
    {
      title: "Kripa Gurung",
      date: "February 22, 2025",
      doctor: "Dr. Sarah Johnson",
      type: "view",
      link: "#"
    },
    
  ];

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-md"> {/* Increased width and padding */}
      {/* Header */}
      <div className="mb-8"> {/* Increased margin */}
        <h1 className="text-3xl font-bold text-gray-800">Medical Records</h1> {/* Larger text */}
        <p className="text-gray-500 text-lg">View and download your medical records</p> {/* Larger text */}
      </div>

      <hr className="my-8 border-gray-200" /> {/* Increased margin */}

      {/* Categories */}
      <div className="mb-8"> {/* Increased margin */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Recodrs</h2> {/* Larger text */}
      </div>
        

      <hr className="my-8 border-gray-200" /> {/* Increased margin */}

      {/* Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8"> {/* Increased gap */}
        {records.map((record, index) => (
          <div 
            key={index}
            className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow min-h-[200px]" /* Increased padding and min-height */
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{record.title}</h3>
            <p className="text-gray-500 text-base mb-2">{record.date}</p> 
            <p className="text-gray-500 text-base mb-4">{record.doctor}</p> 
            <a 
              href={record.link} 
              className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-base font-medium hover:bg-blue-100 transition-colors" /* Larger button */
            >
              {record.type}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicalRecords;
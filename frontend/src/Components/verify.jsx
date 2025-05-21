
import  { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Verify = () => {
  
  const navigate = useNavigate();
    const backend = import.meta.env.VITE_BACKEND_URL;
  const [statusMessage, setStatusMessage] = useState("Verifying...");

  useEffect(() => {
    console.log("hello")
    const verifyPayment = async () => {
       
        if(!window.location.href.includes("pidx")) {
            navigate("/unsuccessfull/user");
            return;
        }
        const idx= window.location.href.split("&")[12]
        console.log("idx", idx);
      const pidx = idx.split("=")[1];
      console.log("pidx", pidx);    
      
      
      try {
        const response = await fetch(`${backend}/khalti/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pidx }),
        });

        const data = await response.json();

        if (data.message?.status === "Completed") {
          navigate(`/successfull/user?${window.location.href.split("?")[1]}`);
        } else if (data.message?.status === "Pending") {
          setStatusMessage("⏳ Payment pending.");
        } else {
          navigate("/unsuccessfull/user");
        }
      } catch (error) {
        console.error("Verification error:", error);
        navigate("/unsuccessfull/user");
      }
    };

    verifyPayment();
  }, [ navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>{statusMessage}</h2>
    </div>
  );
};

export default Verify;

// import jwt from 'jsonwebtoken'

// //admin authentication midleware
// const authAdmin = async (req,res,next) => {
//     try{

//         const {atoken} =req.headers
//         if(!atoken) {
//             return res.json({success:false,message:"Not Authorized Login Again!"})
//         }
//         const token_decode =jwt.verify(atoken,process.env.JWT_SECRET)

//         if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD){
//             return res.json({success:false,message:"Not Authorized Login Again!"})

//         }

//         next ()


//     } catch (error) {
//         console.log(error)
//         res.json({success:false, message:error.message})
//     }
// }

// export default authAdmin

// import jwt from 'jsonwebtoken';

// // Admin authentication middleware
// const authAdmin = async (req, res, next) => {
//     try {
//         const authHeader = req.headers.authorization; // Use 'authorization' header
//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return res.json({ success: false, message: "Not Authorized. Login Again!" });
//         }

//         const token = authHeader.split(' ')[1]; // Extract the token
//         const token_decode = jwt.verify(token, process.env.JWT_SECRET);

//         if (token_decode.email !== process.env.ADMIN_EMAIL) {
//             return res.json({ success: false, message: "Not Authorized. Login Again!" });
//         }

//         next();
//     } catch (error) {
//         console.log(error);
//         res.json({ success: false, message: error.message });
//     }
// };

// export default authAdmin;

import jwt from 'jsonwebtoken';

// Admin authentication middleware
const authAdmin = async (req, res, next) => {
  try {
      const authHeader = req.headers.authorization; // Use 'authorization' header
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ success: false, message: "Not Authorized. Login Again!" });
      }

      const token = authHeader.split(' ')[1]; // Extract the token
      const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

      if (tokenDecode.email !== process.env.ADMIN_EMAIL) {
          return res.status(401).json({ success: false, message: "Not Authorized. Login Again!" });
      }

      // Attach decoded token to the request object if you need it later
      req.admin = tokenDecode;
      next();
  } catch (error) {
      console.error("authAdmin error:", error);
      res.status(500).json({ success: false, message: error.message });
  }
};

export default authAdmin;